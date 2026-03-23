/**
 * IndexedDB cache for extracted ROM images.
 *
 * Persists decoded images as Blobs so they survive page reloads.
 * Versioned — when extraction targets change, bump CACHE_VERSION.
 * Stale caches (version < current) are kept but flagged, so existing
 * portraits still display while prompting the user to re-extract.
 */

import {IMAGE_CATALOG} from '@/utils/image-catalog';

/**
 * Auto-derived cache version — changes whenever the image catalog changes.
 * FNV-1a hash of all sorted catalog keys, truncated to a positive 32-bit int.
 * No manual bumping needed.
 */
function catalogHash(): number {
	const keys = Object.keys(IMAGE_CATALOG).sort().join('\n');
	let h = 0x81_1c_9d_c5; // FNV offset basis
	for (let i = 0; i < keys.length; i += 1) {
		h ^= keys.charCodeAt(i);
		h = Math.imul(h, 0x01_00_01_93); // FNV prime
	}
	return h >>> 0; // ensure positive
}

export const CACHE_VERSION = catalogHash();

const DB_NAME = 'taisen-fan-images';
const DB_VERSION = 1;
const STORE_NAME = 'cache';
const CACHE_KEY = 'images';

type CacheRecord = {
	version: number;
	images: Record<string, Blob>;
};

export type CacheResult = {
	/** The cached images as blob URLs (caller must revoke when done) */
	images: Map<string, string>;
	/** Whether the cache version matches the current extraction version */
	current: boolean;
};

// ============================================================================
// IndexedDB helpers
// ============================================================================

function openDb(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};
		req.onsuccess = () => {
			resolve(req.result);
		};
		req.onerror = () => {
			reject(req.error);
		};
	});
}

function txGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly');
		const store = tx.objectStore(STORE_NAME);
		const req = store.get(key);
		req.onsuccess = () => {
			resolve(req.result as T | undefined);
		};
		req.onerror = () => {
			reject(req.error);
		};
	});
}

function txPut<T>(db: IDBDatabase, key: string, value: T): Promise<void> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		const req = store.put(value, key);
		req.onsuccess = () => {
			resolve();
		};
		req.onerror = () => {
			reject(req.error);
		};
	});
}

function txDelete(db: IDBDatabase, key: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		const req = store.delete(key);
		req.onsuccess = () => {
			resolve();
		};
		req.onerror = () => {
			reject(req.error);
		};
	});
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Load cached images from IndexedDB.
 * Returns null if no cache exists.
 */
export async function loadCachedImages(): Promise<CacheResult | null> {
	const db = await openDb();
	try {
		const record = await txGet<CacheRecord>(db, CACHE_KEY);
		if (!record) return null;

		const images = new Map<string, string>();
		for (const [name, blob] of Object.entries(record.images)) {
			images.set(name, URL.createObjectURL(blob));
		}
		return {
			images,
			current: record.version >= CACHE_VERSION,
		};
	} finally {
		db.close();
	}
}

/**
 * Save pre-encoded PNG blobs to IndexedDB with the current version.
 *
 * @param pngs - Map of image key → PNG Blob (already encoded by the worker)
 */
export async function savePngBlobsToCache(
	pngs: Map<string, Blob>,
): Promise<void> {
	const blobs: Record<string, Blob> = {};
	for (const [name, blob] of pngs) {
		blobs[name] = blob;
	}

	const record: CacheRecord = {
		version: CACHE_VERSION,
		images: blobs,
	};

	const db = await openDb();
	try {
		await txPut(db, CACHE_KEY, record);
	} finally {
		db.close();
	}
}

/**
 * Clear all cached images from IndexedDB.
 */
export async function clearImageCache(): Promise<void> {
	const db = await openDb();
	try {
		await txDelete(db, CACHE_KEY);
	} finally {
		db.close();
	}
}
