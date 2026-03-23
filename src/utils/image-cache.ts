/**
 * IndexedDB cache for extracted ROM images.
 *
 * Persists decoded images as Blobs so they survive page reloads.
 * Versioned — when extraction targets change, bump CACHE_VERSION.
 * Stale caches (version < current) are kept but flagged, so existing
 * portraits still display while prompting the user to re-extract.
 */

/** Bump when extraction targets change (e.g. add game logo) */
export const CACHE_VERSION = 1;

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
 * Save extracted images to IndexedDB with the current version.
 *
 * @param images - Map of filename → RGBA Uint8Array pairs with dimensions
 */
export async function saveImagesToCache(
	images: Map<string, {rgba: Uint8Array; width: number; height: number}>,
): Promise<void> {
	// Convert RGBA data to PNG Blobs via OffscreenCanvas
	const entries = [...images.entries()];
	const blobResults = await Promise.all(
		entries.map(([, img]) => rgbaToBlob(img.rgba, img.width, img.height)),
	);
	const blobs: Record<string, Blob> = {};
	for (let i = 0; i < entries.length; i += 1) {
		const name = entries[i]?.[0];
		const blob = blobResults[i];
		if (name && blob) blobs[name] = blob;
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

// ============================================================================
// RGBA → Blob conversion
// ============================================================================

function rgbaToBlob(
	rgba: Uint8Array,
	width: number,
	height: number,
): Promise<Blob> {
	// OffscreenCanvas is available in modern browsers and workers
	if (typeof OffscreenCanvas !== 'undefined') {
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext('2d');
		if (ctx) {
			// Copy into a fresh ArrayBuffer to satisfy ImageData's type constraint
			const copy = new Uint8ClampedArray(rgba.length);
			copy.set(rgba);
			const imageData = new ImageData(copy, width, height);
			ctx.putImageData(imageData, 0, 0);
			return canvas.convertToBlob({type: 'image/png'});
		}
	}
	// Fallback: store raw RGBA (works but no PNG compression)
	const copy = new Uint8Array(rgba.length);
	copy.set(rgba);
	return Promise.resolve(new Blob([copy], {type: 'application/octet-stream'}));
}
