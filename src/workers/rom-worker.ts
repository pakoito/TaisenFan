/**
 * ROM Web Worker — runs extraction and patching off the main thread.
 *
 * Holds the ROM ArrayBuffer in memory between commands so the user
 * only transfers it once. Extraction and patching share the same ROM ref.
 *
 * Extraction is driven by the image catalog — it unpacks each unique NFP
 * and decodes files based on their extension (KPC or ABP).
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

// ============================================================================
// Build a set of wanted files per NFP from the catalog
// ============================================================================

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

// ============================================================================
// Decode a file based on its extension
// ============================================================================

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

// ============================================================================
// Extract
// ============================================================================

function handleExtract(rom: ArrayBuffer): void {
	try {
		romData = new Uint8Array(rom);

		// Phase 1: Parse NDS filesystem
		post({type: 'progress', phase: 'parsing', current: 0, total: 1});
		const nds = parseNds(romData);

		// Phase 2: Unpack each NFP in the extraction plan
		const plan = buildExtractionPlan();
		const images: ExtractedImage[] = [];
		const transferBuffers: ArrayBuffer[] = [];
		let totalFiles = 0;
		for (const wantedFiles of plan.values()) {
			totalFiles += wantedFiles.size;
		}
		let decoded = 0;

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
			const nfpSlice = sliceFile(romData, nfpEntry);
			const nfpFiles = unpackNfp(nfpSlice);

			// Phase 3: Decode wanted files
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
						const key = `${nfpName}:${f.name}`;
						const buf = new ArrayBuffer(result.rgba.byteLength);
						new Uint8Array(buf).set(result.rgba);
						images.push({
							name: key,
							rgba: buf,
							width: result.width,
							height: result.height,
						});
						transferBuffers.push(buf);
					}
				} catch {
					// Skip individual decode failures
				}
				decoded += 1;
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
// Eject
// ============================================================================

function handleEject(): void {
	romData = null;
}

// ============================================================================
// Message handler
// ============================================================================

globalThis.onmessage = (e: MessageEvent<WorkerCommand>) => {
	const cmd = e.data;
	switch (cmd.type) {
		case 'extract':
			handleExtract(cmd.rom);
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
