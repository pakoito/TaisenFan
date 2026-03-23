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
	savePngBlobsToCache,
} from '@/utils/image-cache';
import type {ImageKey} from '@/utils/image-catalog';
import {RomWorkerClient} from '@/workers/rom-worker-client';

/** Fire-and-forget cache save (receives pre-encoded PNG blobs) */
function backgroundCacheSavePngs(pngMap: Map<ImageKey, Blob>): void {
	savePngBlobsToCache(pngMap).catch((err: unknown) => {
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

/** Create blob URLs from PNG ArrayBuffers (already encoded by the worker) */
function pngsToBlobUrls(images: {name: string; png: ArrayBuffer}[]): {
	blobMap: Map<ImageKey, string>;
	pngMap: Map<ImageKey, Blob>;
} {
	const blobMap = new Map<ImageKey, string>();
	const pngMap = new Map<ImageKey, Blob>();

	for (const img of images) {
		const key = img.name as ImageKey;
		const blob = new Blob([img.png], {type: 'image/png'});
		blobMap.set(key, URL.createObjectURL(blob));
		pngMap.set(key, blob);
	}

	return {blobMap, pngMap};
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
	const [images, setImages] = useState<Map<ImageKey, string>>(new Map());
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
							const {blobMap, pngMap} = pngsToBlobUrls(extractedImages);
							setImages(blobMap);
							setStatus('loaded');
							setProgress(null);
							backgroundCacheSavePngs(pngMap);
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
