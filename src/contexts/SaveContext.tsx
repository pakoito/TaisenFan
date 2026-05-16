/**
 * Save Context — global state for the savegame editor.
 *
 * Holds the in-progress SaveProfile and (when uploaded) the original raw
 * .sav buffer so non-profile blocks survive a round-trip. Persists to
 * IndexedDB so the editor's state survives page navigation and reloads.
 */

import {
	type PropsWithChildren,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';
import {
	SaveContext,
	type SaveContextValue,
	type SaveFormat,
	type SaveStatus,
} from '@/contexts/save-types';
import {
	applyPreset,
	createSave,
	defaultProfile,
	extractProfile,
	replaceSave,
	type SaveProfile,
	wrapDsv,
} from '@/save-tools';
import {parseSav} from '@/save-tools/save-io';
import {downloadBinary} from '@/utils/download';
import {
	clearPersistedSave,
	loadPersistedSave,
	type PersistedSave,
	persistSave,
} from '@/utils/save-cache';

const PERSIST_DEBOUNCE_MS = 200;
const SAVE_EXT_RE = /\.(sav|dsv)$/iu;

type SnapshotState = {
	status: SaveStatus;
	filename: string | null;
	rawSav: Uint8Array | null;
	profile: SaveProfile | null;
	isDirty: boolean;
	error: string | null;
};

type SetState = React.Dispatch<React.SetStateAction<SnapshotState>>;
type LastRef = React.RefObject<PersistedSave | null>;

const EMPTY_STATE: SnapshotState = {
	status: 'empty',
	filename: null,
	rawSav: null,
	profile: null,
	isDirty: false,
	error: null,
};

/**
 * Debounced IndexedDB writer. `schedule(record)` fires after
 * PERSIST_DEBOUNCE_MS of quiet; `cancel()` aborts any pending write.
 */
function usePersistence(): {
	schedule: (record: PersistedSave) => void;
	last: LastRef;
	cancel: () => void;
} {
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const last = useRef<PersistedSave | null>(null);

	const schedule = useCallback((record: PersistedSave) => {
		last.current = record;
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			persistSave(record).catch((err: unknown) => {
				console.warn('[SaveContext] Persist failed:', err);
			});
		}, PERSIST_DEBOUNCE_MS);
	}, []);

	const cancel = useCallback(() => {
		if (timer.current) clearTimeout(timer.current);
		last.current = null;
	}, []);

	return {schedule, last, cancel};
}

/** Hydrate state from IndexedDB on mount. */
function useHydrate(setState: SetState, last: LastRef): void {
	useEffect(() => {
		loadPersistedSave()
			.then(record => {
				if (record === null) return;
				last.current = record;
				setState({
					status: record.status,
					filename: record.filename,
					rawSav: record.rawSav,
					profile: record.profile,
					isDirty: false,
					error: null,
				});
			})
			.catch((err: unknown) => {
				console.warn('[SaveContext] Hydrate failed:', err);
			});
	}, [setState, last]);
}

async function readUploadedFile(
	file: File,
): Promise<{rawSav: Uint8Array; profile: SaveProfile}> {
	const bytes = new Uint8Array(await file.arrayBuffer());
	const parsed = await parseSav(bytes);
	const profile = await extractProfile(bytes);
	return {rawSav: parsed.rawSav, profile};
}

function buildBytes(
	rawSav: Uint8Array | null,
	profile: SaveProfile,
): Promise<Uint8Array> {
	return rawSav ? replaceSave(rawSav, profile) : createSave(profile);
}

async function buildAndDownload(
	state: SnapshotState,
	format: SaveFormat,
): Promise<void> {
	if (!state.profile) return;
	const raw = await buildBytes(state.rawSav, state.profile);
	const bytes = format === 'dsv' ? wrapDsv(raw) : raw;
	const base = (state.filename ?? `taisen_${stamp()}`).replace(SAVE_EXT_RE, '');
	downloadBinary(bytes, `${base}.${format}`);
}

/** Compose the action callbacks the editor exposes through context. */
function useActions(
	state: SnapshotState,
	setState: SetState,
	last: LastRef,
	schedule: (record: PersistedSave) => void,
	cancel: () => void,
) {
	const newStarter = useCallback(() => {
		const fresh = applyPreset(defaultProfile(), 'starter');
		const record: PersistedSave = {
			status: 'new',
			filename: null,
			rawSav: null,
			profile: fresh,
		};
		setState({...record, isDirty: true, error: null});
		schedule(record);
	}, [schedule, setState]);

	const loadFile = useCallback(
		async (file: File) => {
			try {
				const {rawSav, profile} = await readUploadedFile(file);
				const record: PersistedSave = {
					status: 'uploaded',
					filename: file.name,
					rawSav,
					profile,
				};
				setState({...record, isDirty: false, error: null});
				schedule(record);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				setState(s => ({...s, error: message}));
			}
		},
		[schedule, setState],
	);

	const mutate = useCallback(
		(recipe: (draft: SaveProfile) => void) => {
			setState(prev => {
				if (!prev.profile) return prev;
				const draft = structuredClone(prev.profile);
				recipe(draft);
				if (last.current) schedule({...last.current, profile: draft});
				return {...prev, profile: draft, isDirty: true};
			});
		},
		[last, schedule, setState],
	);

	const download = useCallback(
		async (format: SaveFormat) => {
			await buildAndDownload(state, format);
			setState(s => ({...s, isDirty: false}));
		},
		[state, setState],
	);

	const clear = useCallback(async () => {
		cancel();
		setState(EMPTY_STATE);
		await clearPersistedSave();
	}, [cancel, setState]);

	return {newStarter, loadFile, mutate, download, clear};
}

export function SaveProvider({children}: PropsWithChildren) {
	const [state, setState] = useState<SnapshotState>(EMPTY_STATE);
	const {schedule, last, cancel} = usePersistence();
	useHydrate(setState, last);
	const actions = useActions(state, setState, last, schedule, cancel);

	const value: SaveContextValue = {
		status: state.status,
		filename: state.filename,
		profile: state.profile,
		isDirty: state.isDirty,
		error: state.error,
		...actions,
	};

	return <SaveContext value={value}>{children}</SaveContext>;
}

function pad2(n: number): string {
	return String(n).padStart(2, '0');
}

function stamp(): string {
	const d = new Date();
	return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}_${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}
