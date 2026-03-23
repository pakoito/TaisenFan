/**
 * ROM Web Worker — runs extraction and patching off the main thread.
 *
 * Holds the ROM ArrayBuffer in memory between commands so the user
 * only transfers it once. Extraction and patching share the same ROM ref.
 *
 * Extraction is driven by the image catalog — it unpacks each unique NFP
 * and decodes files based on their extension (KPC or ABP).
 * Decoded RGBA is batch-converted to PNG via OffscreenCanvas before sending.
 */

import {decodeAbp} from '@/utils/abp-decode';
import {EXTRACTION_NFPS, IMAGE_CATALOG} from '@/utils/image-catalog';
import {decodeKpc} from '@/utils/kpc-decode';
import {parseNds, sliceFile} from '@/utils/nds-parser';
import {unpackNfp} from '@/utils/nfp-unpack';
import {applyBps, parseBps} from '@/workers/bps-patch';
import type {
	ExtractedImage,
	WorkerCommand,
	WorkerResponse,
} from '@/workers/rom-worker-types';

let romData: Uint8Array | null = null;

function post(msg: WorkerResponse, transfer?: Transferable[]): void {
	if (transfer) {
		globalThis.postMessage(msg, {transfer});
	} else {
		globalThis.postMessage(msg);
	}
}

function buildExtractionPlan(): Map<string, Set<string>> {
	const plan = new Map<string, Set<string>>();
	for (const entry of Object.values(IMAGE_CATALOG)) {
		const existing = plan.get(entry.nfp);
		if (existing) {
			existing.add(entry.file);
		} else {
			plan.set(entry.nfp, new Set([entry.file]));
		}
	}
	return plan;
}

function decodeFile(
	data: Uint8Array,
	filename: string,
): {rgba: Uint8Array; width: number; height: number} | null {
	const ext = filename.split('.').pop()?.toUpperCase();
	switch (ext) {
		case 'KPC':
			return decodeKpc(data);
		case 'ABP':
			return decodeAbp(data);
		default:
			return null;
	}
}

function rgbaToPng(
	rgba: Uint8Array,
	width: number,
	height: number,
): Promise<ArrayBuffer> {
	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext('2d')!;
	const clamped = new Uint8ClampedArray(rgba.length);
	clamped.set(rgba);
	ctx.putImageData(new ImageData(clamped, width, height), 0, 0);
	return canvas
		.convertToBlob({type: 'image/png'})
		.then(blob => blob.arrayBuffer());
}

// ============================================================================
// Extract: decode all images, then batch-convert to PNG
// ============================================================================

type DecodedEntry = {
	key: string;
	rgba: Uint8Array;
	width: number;
	height: number;
};

function decodeAllImages(
	nds: ReturnType<typeof parseNds>,
	rom: Uint8Array,
): DecodedEntry[] {
	const plan = buildExtractionPlan();
	let totalFiles = 0;
	for (const wantedFiles of plan.values()) {
		totalFiles += wantedFiles.size;
	}
	let decoded = 0;
	const results: DecodedEntry[] = [];

	for (const nfpName of EXTRACTION_NFPS) {
		const wantedFiles = plan.get(nfpName);
		if (!wantedFiles) continue;

		const nfpEntry = nds.files.find(
			f => f.name.toLowerCase() === `${nfpName}.nfp`,
		);
		if (!nfpEntry) {
			console.warn(`[worker] NFP not found in ROM: ${nfpName}.NFP`);
			continue;
		}

		post({
			type: 'progress',
			phase: 'unpacking',
			current: decoded,
			total: totalFiles,
		});
		const nfpSlice = sliceFile(rom, nfpEntry);
		const nfpFiles = unpackNfp(nfpSlice);

		for (const f of nfpFiles) {
			if (!wantedFiles.has(f.name)) continue;
			post({
				type: 'progress',
				phase: 'decoding',
				current: decoded,
				total: totalFiles,
			});
			try {
				const result = decodeFile(f.data, f.name);
				if (result) {
					results.push({key: `${nfpName}:${f.name}`, ...result});
				}
			} catch {
				// Skip individual decode failures
			}
			decoded += 1;
		}
	}
	return results;
}

async function handleExtract(rom: ArrayBuffer): Promise<void> {
	try {
		romData = new Uint8Array(rom);

		post({type: 'progress', phase: 'parsing', current: 0, total: 1});
		const nds = parseNds(romData);

		// Decode all images (sync, with progress)
		const decoded = decodeAllImages(nds, romData);

		// Batch convert RGBA → PNG (parallel, single await)
		const pngBuffers = await Promise.all(
			decoded.map(d => rgbaToPng(d.rgba, d.width, d.height)),
		);

		const images: ExtractedImage[] = [];
		const transferBuffers: ArrayBuffer[] = [];
		for (let i = 0; i < decoded.length; i += 1) {
			const buf = pngBuffers[i];
			if (buf) {
				images.push({name: decoded[i]!.key, png: buf});
				transferBuffers.push(buf);
			}
		}

		post({type: 'extract-done', images}, transferBuffers);
	} catch (err) {
		post({
			type: 'extract-error',
			error: err instanceof Error ? err.message : 'Extraction failed',
		});
	}
}

// ============================================================================
// Patch
// ============================================================================

async function handlePatch(baseUrl: string): Promise<void> {
	try {
		if (!romData) {
			post({type: 'patch-error', error: 'No ROM loaded. Load a ROM first.'});
			return;
		}

		post({type: 'patch-progress', step: 'fetching'});
		const response = await fetch(`${baseUrl}data/patch.bps`);
		if (!response.ok) {
			post({
				type: 'patch-error',
				error: `Failed to download patch: ${String(response.status)}`,
			});
			return;
		}
		const patchBuffer = await response.arrayBuffer();
		const patch = parseBps(patchBuffer);

		post({type: 'patch-progress', step: 'verifying'});
		post({type: 'patch-progress', step: 'patching'});
		const patched = applyBps(romData, patch);

		const buf = new ArrayBuffer(patched.byteLength);
		new Uint8Array(buf).set(patched);
		post(
			{
				type: 'patch-done',
				data: buf,
				filename: 'Sangokushi_Taisen_Ten_Japan_EN.nds',
			},
			[buf],
		);
	} catch (err) {
		post({
			type: 'patch-error',
			error: err instanceof Error ? err.message : 'Patching failed',
		});
	}
}

// ============================================================================
// Message handler
// ============================================================================

function handleEject(): void {
	romData = null;
}

globalThis.onmessage = (e: MessageEvent<WorkerCommand>) => {
	const cmd = e.data;
	switch (cmd.type) {
		case 'extract':
			handleExtract(cmd.rom).catch(() => {
				post({type: 'extract-error', error: 'Unexpected extraction error'});
			});
			break;
		case 'patch':
			handlePatch(cmd.baseUrl).catch(() => {
				post({type: 'patch-error', error: 'Unexpected patching error'});
			});
			break;
		case 'eject':
			handleEject();
			break;
		default:
			break;
	}
};
