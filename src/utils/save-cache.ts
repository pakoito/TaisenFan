/**
 * IndexedDB cache for the in-progress savegame editor state.
 *
 * Persists the user's current save profile + raw bytes across page
 * navigations and reloads. Keyed by a single record so eject/discard
 * just deletes the row.
 */

import type {SaveProfile} from '@/save-tools';

const DB_NAME = 'taisen-fan-save';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const RECORD_KEY = 'current';

export type SaveStatus = 'empty' | 'new' | 'uploaded';

export type PersistedSave = {
	status: Exclude<SaveStatus, 'empty'>;
	filename: string | null;
	rawSav: Uint8Array | null;
	profile: SaveProfile;
};

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
		const req = tx.objectStore(STORE_NAME).get(key);
		req.onsuccess = () => {
			resolve(req.result as T | undefined);
		};
		req.onerror = () => {
			reject(req.error);
		};
	});
}

function txPut(
	db: IDBDatabase,
	key: string,
	value: PersistedSave,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const req = tx.objectStore(STORE_NAME).put(value, key);
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
		const req = tx.objectStore(STORE_NAME).delete(key);
		req.onsuccess = () => {
			resolve();
		};
		req.onerror = () => {
			reject(req.error);
		};
	});
}

/**
 * Whether a persisted profile matches the SaveProfile shape the current code
 * expects. The codec field map changes between releases (e.g. the 0x14 field
 * was renamed `currencyGold` → `food`, and `troopColors` / `regionCode` were
 * added).
 * A cached profile written by an older deploy is missing those fields, which
 * makes the editor throw at render time (`Object.values(profile.troopColors)`
 * etc.). We do NOT migrate stale state — we detect it and drop it.
 */
function isProfileShapeCurrent(profile: unknown): profile is SaveProfile {
	if (typeof profile !== 'object' || profile === null) return false;
	const p = profile as {
		troopColors?: unknown;
		regionCode?: unknown;
		stats?: {food?: unknown};
	};
	if (typeof p.troopColors !== 'object' || p.troopColors === null) return false;
	if (typeof p.regionCode !== 'number') return false;
	if (typeof p.stats?.food !== 'number') return false;
	return true;
}

export async function loadPersistedSave(): Promise<PersistedSave | null> {
	try {
		const db = await openDb();
		const record = await txGet<PersistedSave>(db, RECORD_KEY);
		// Drop incompatible state written by an older deploy rather than
		// rehydrating a stale-shaped profile that crashes the editor on render.
		if (record && !isProfileShapeCurrent(record.profile)) {
			await txDelete(db, RECORD_KEY);
			db.close();
			console.warn(
				'[save-cache] Discarded incompatible cached save (old format).',
			);
			return null;
		}
		db.close();
		return record ?? null;
	} catch (err) {
		console.warn('[save-cache] Load failed:', err);
		return null;
	}
}

export async function persistSave(record: PersistedSave): Promise<void> {
	try {
		const db = await openDb();
		await txPut(db, RECORD_KEY, record);
		db.close();
	} catch (err) {
		console.warn('[save-cache] Persist failed:', err);
	}
}

export async function clearPersistedSave(): Promise<void> {
	try {
		const db = await openDb();
		await txDelete(db, RECORD_KEY);
		db.close();
	} catch (err) {
		console.warn('[save-cache] Clear failed:', err);
	}
}
