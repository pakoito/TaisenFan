/**
 * ROM Context — global state for ROM loading, image extraction, and patching.
 *
 * State machine:
 *   empty      → no ROM, no cache
 *   stale      → cached images from an older CACHE_VERSION
 *   cached     → cached images at current CACHE_VERSION, no ROM in memory
 *   loading    → reading ROM file
 *   extracting → worker is parsing/decoding
 *   loaded     → ROM in worker memory + current images
 */

import {
	type PropsWithChildren,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	type PatchProgress,
	RomContext,
	type RomContextValue,
	type RomProgress,
	type RomStatus,
} from '@/contexts/rom-types';
import {
	clearImageCache,
	loadCachedImages,
	saveImagesToCache,
} from '@/utils/image-cache';
import {RomWorkerClient} from '@/workers/rom-worker-client';

/** Fire-and-forget cache save */
function backgroundCacheSave(
	cacheMap: Map<string, {rgba: Uint8Array; width: number; height: number}>,
): void {
	saveImagesToCache(cacheMap).catch((err: unknown) => {
		console.warn('[RomContext] Cache save failed:', err);
	});
}

/** Fire-and-forget cache clear */
function backgroundCacheClear(): void {
	clearImageCache().catch((err: unknown) => {
		console.warn('[RomContext] Cache clear failed:', err);
	});
}

// ============================================================================
// Helpers
// ============================================================================

function downloadArrayBuffer(data: ArrayBuffer, filename: string): void {
	const blob = new Blob([data], {type: 'application/octet-stream'});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function imagesToBlobs(
	extractedImages: {
		name: string;
		rgba: Uint8Array;
		width: number;
		height: number;
	}[],
): {
	blobMap: Map<string, string>;
	cacheMap: Map<string, {rgba: Uint8Array; width: number; height: number}>;
} {
	const blobMap = new Map<string, string>();
	const cacheMap = new Map<
		string,
		{rgba: Uint8Array; width: number; height: number}
	>();

	for (const img of extractedImages) {
		const copy = new Uint8Array(img.rgba.length);
		copy.set(img.rgba);
		const blob = new Blob([copy], {type: 'application/octet-stream'});
		blobMap.set(img.name, URL.createObjectURL(blob));
		cacheMap.set(img.name, {
			rgba: img.rgba,
			width: img.width,
			height: img.height,
		});
	}

	return {blobMap, cacheMap};
}

// ============================================================================
// Provider
// ============================================================================

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: context provider manages full state machine
export function RomProvider({children}: PropsWithChildren) {
	const [status, setStatus] = useState<RomStatus>('empty');
	const [progress, setProgress] = useState<RomProgress | null>(null);
	const [patchProgress, setPatchProgress] = useState<PatchProgress | null>(
		null,
	);
	const [isPatching, setIsPatching] = useState(false);
	const [images, setImages] = useState<Map<string, string>>(new Map());
	const [error, setError] = useState<string | null>(null);
	const workerRef = useRef<RomWorkerClient | null>(null);

	// Check IndexedDB cache on mount
	useEffect(() => {
		loadCachedImages()
			.then(result => {
				if (result === null) return;
				setImages(result.images);
				setStatus(result.current ? 'cached' : 'stale');
			})
			.catch((err: unknown) => {
				console.warn('[RomContext] IndexedDB unavailable:', err);
			});
	}, []);

	// Clean up worker on unmount
	useEffect(
		() => () => {
			workerRef.current?.dispose();
		},
		[],
	);

	const getWorker = useCallback((): RomWorkerClient => {
		if (!workerRef.current) {
			workerRef.current = new RomWorkerClient();
		}
		return workerRef.current;
	}, []);

	// loadRom
	const loadRom = useCallback(
		(file: File) => {
			setError(null);
			setStatus('loading');
			setProgress(null);

			file
				.arrayBuffer()
				.then(buffer => {
					setStatus('extracting');
					const worker = getWorker();
					worker.setCallbacks({
						onProgress(phase, current, total) {
							setProgress({phase, current, total});
						},
						onExtracted(extractedImages) {
							const {blobMap, cacheMap} = imagesToBlobs(extractedImages);
							setImages(blobMap);
							setStatus('loaded');
							setProgress(null);
							backgroundCacheSave(cacheMap);
						},
						onExtractError(msg) {
							setError(msg);
							setStatus('empty');
							setProgress(null);
						},
					});
					worker.extract(buffer);
				})
				.catch((_err: unknown) => {
					setError('Failed to read ROM file.');
					setStatus('empty');
				});
		},
		[getWorker],
	);

	// patchAndDownload
	const patchAndDownload = useCallback(() => {
		if (status !== 'loaded') return;
		setError(null);
		setIsPatching(true);
		setPatchProgress(null);

		const worker = getWorker();
		worker.setCallbacks({
			onPatchProgress(step) {
				setPatchProgress({step});
			},
			onPatched(data, filename) {
				setIsPatching(false);
				setPatchProgress(null);
				downloadArrayBuffer(data, filename);
			},
			onPatchError(msg) {
				setError(msg);
				setIsPatching(false);
				setPatchProgress(null);
			},
		});
		worker.patch(import.meta.env.BASE_URL);
	}, [status, getWorker]);

	// eject — drop ROM from worker, keep cached images
	const eject = useCallback(() => {
		workerRef.current?.eject();
		if (status === 'loaded') {
			setStatus('cached');
		}
		setProgress(null);
		setPatchProgress(null);
		setIsPatching(false);
		setError(null);
	}, [status]);

	// clearAll — drop ROM + clear IndexedDB + revoke blob URLs
	const clearAll = useCallback(() => {
		workerRef.current?.eject();
		for (const url of images.values()) {
			URL.revokeObjectURL(url);
		}
		setImages(new Map());
		setStatus('empty');
		setProgress(null);
		setPatchProgress(null);
		setIsPatching(false);
		setError(null);
		backgroundCacheClear();
	}, [images]);

	const hasImages = images.size > 0;

	const value = useMemo<RomContextValue>(
		() => ({
			status,
			progress,
			patchProgress,
			isPatching,
			images,
			hasImages,
			loadRom,
			patchAndDownload,
			eject,
			clearAll,
			error,
		}),
		[
			status,
			progress,
			patchProgress,
			isPatching,
			images,
			hasImages,
			loadRom,
			patchAndDownload,
			eject,
			clearAll,
			error,
		],
	);

	return <RomContext.Provider value={value}>{children}</RomContext.Provider>;
}
