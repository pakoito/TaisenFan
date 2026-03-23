/**
 * ROM Web Worker — runs extraction and patching off the main thread.
 *
 * Holds the ROM ArrayBuffer in memory between commands so the user
 * only transfers it once. Extraction and patching share the same ROM ref.
 */

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
// Extract
// ============================================================================

function handleExtract(rom: ArrayBuffer): void {
	try {
		romData = new Uint8Array(rom);

		// Phase 1: Parse NDS filesystem
		post({type: 'progress', phase: 'parsing', current: 0, total: 1});
		const nds = parseNds(romData);

		// Phase 2: Find and unpack kpcbustup.NFP
		const bustupEntry = nds.files.find(
			f => f.name.toLowerCase() === 'kpcbustup.nfp',
		);
		if (!bustupEntry) {
			post({type: 'extract-error', error: 'kpcbustup.NFP not found in ROM'});
			return;
		}

		post({type: 'progress', phase: 'unpacking', current: 0, total: 1});
		const nfpSlice = sliceFile(romData, bustupEntry);
		const nfpFiles = unpackNfp(nfpSlice);

		// Phase 3: Decode each KPC image
		const kpcFiles = nfpFiles.filter(f =>
			f.name.toUpperCase().endsWith('.KPC'),
		);
		const images: ExtractedImage[] = [];
		const transferBuffers: ArrayBuffer[] = [];

		for (let i = 0; i < kpcFiles.length; i += 1) {
			const f = kpcFiles[i];
			if (!f) continue;

			post({
				type: 'progress',
				phase: 'decoding',
				current: i,
				total: kpcFiles.length,
			});

			try {
				const decoded = decodeKpc(f.data);
				const buf = new ArrayBuffer(decoded.rgba.byteLength);
				new Uint8Array(buf).set(decoded.rgba);
				images.push({
					name: f.name,
					rgba: buf,
					width: decoded.width,
					height: decoded.height,
				});
				transferBuffers.push(buf);
			} catch {
				// Skip individual decode failures
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
