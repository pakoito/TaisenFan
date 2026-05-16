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

export async function loadPersistedSave(): Promise<PersistedSave | null> {
	try {
		const db = await openDb();
		const record = await txGet<PersistedSave>(db, RECORD_KEY);
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
