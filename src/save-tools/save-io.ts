/**
 * Save file I/O: format detection, reading, and building .sav files.
 *
 * Supports:
 * - .sav (raw 64KB EEPROM)
 * - .dsv (DeSmuME format with footer)
 *
 * No Node-specific APIs — works in browsers too.
 */

import {crc32} from './crc32';
import {BLOCKS, encryptBlock, verifyBlock} from './crypto';
import {decodeShiftJis, encodeShiftJis} from './shift-jis';

// === Constants ===

export const SAV_SIZE = 65_536;
const MAGIC = '3GOKUTEN';
const MAGIC_OFFSET = 4;
const VERSION = 0x00_00_81_82;
const VERSION_OFFSET = 0x0c;
const SAVE_COUNT_OFFSET = 0x44;
const HEADER_SIZE = 0x80;

const DSV_FOOTER = '|-DESMUME SAVE-|';
const DSV_SNIP = '|<--Snip above here to create a raw sav';

/**
 * The player name lives in the unencrypted header at offset 0x0C, encoded
 * in Shift_JIS. The game allocates 12 bytes for it (6 full-width characters
 * or 12 half-width), trailed by 0x00 padding. The DS firmware nickname is
 * NOT what's stored — the game prompts for a name on first launch.
 */
const NAME_OFFSET = 0x0c;
const NAME_LENGTH = 12;

// Default footer block content (observed in all saves)
const DEFAULT_FOOTER = new Uint8Array([
	0x00, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
]);

// === Format detection ===

function textAt(data: Uint8Array, offset: number, length: number): string {
	let s = '';
	for (let i = 0; i < length; i++) s += String.fromCharCode(data[offset + i]!);
	return s;
}

function findBytes(data: Uint8Array, needle: string): number {
	const encoded = new TextEncoder().encode(needle);
	outer: for (let i = 0; i <= data.length - encoded.length; i++) {
		for (let j = 0; j < encoded.length; j++) {
			if (data[i + j] !== encoded[j]) continue outer;
		}
		return i;
	}
	return -1;
}

/**
 * Extract a raw 64KB .sav buffer from any supported format.
 * Returns null if the format is unrecognized.
 */
export function extractRawSav(data: Uint8Array): Uint8Array | null {
	// Check for raw .sav
	if (data.length === SAV_SIZE) {
		if (textAt(data, MAGIC_OFFSET, MAGIC.length) === MAGIC) return data;
		return null;
	}

	// Check for .dsv (DeSmuME) — can be any size with footer marker
	if (data.length > 16) {
		const footer = textAt(data, data.length - 16, 16);
		if (footer !== DSV_FOOTER) return null;

		const snipIdx = findBytes(data, DSV_SNIP);
		if (snipIdx === -1) return null;

		const raw = new Uint8Array(SAV_SIZE).fill(0xff);
		raw.set(data.slice(0, Math.min(snipIdx, SAV_SIZE)));

		if (textAt(raw, MAGIC_OFFSET, MAGIC.length) === MAGIC) return raw;
		return null;
	}

	return null;
}

// === Parsed save structure ===

export type ParsedSave = {
	header: Uint8Array; // 128 bytes (unencrypted)
	blocks: Map<string, Uint8Array>; // block name → decrypted payload
	/** Original raw .sav buffer for non-modified blocks */
	rawSav: Uint8Array;
};

/**
 * Parse and decrypt a .sav buffer into its constituent blocks.
 */
export async function parseSav(data: Uint8Array): Promise<ParsedSave> {
	const raw = extractRawSav(data);
	if (!raw) throw new Error('Unrecognized save file format');

	const header = raw.slice(0, HEADER_SIZE);
	const blocks = new Map<string, Uint8Array>();

	for (const block of BLOCKS) {
		const {valid, decrypted} = await verifyBlock(block, raw);
		if (!valid)
			throw new Error(`Block "${block.name}" failed MD5 verification`);
		blocks.set(block.name, decrypted);
	}

	return {header, blocks, rawSav: raw};
}

/**
 * Build a .sav buffer from header + decrypted blocks.
 *
 * Blocks not in the map are taken from `baseSav` if provided,
 * otherwise zeroed blocks are used.
 */
export async function buildSav(
	header: Uint8Array,
	blocks: Map<string, Uint8Array>,
	baseSav?: Uint8Array,
): Promise<Uint8Array> {
	const sav = new Uint8Array(SAV_SIZE).fill(0xff);

	// Write header
	sav.set(header.slice(0, HEADER_SIZE));

	// Increment save count
	const count =
		(sav[SAVE_COUNT_OFFSET]! |
			(sav[SAVE_COUNT_OFFSET + 1]! << 8) |
			(sav[SAVE_COUNT_OFFSET + 2]! << 16) |
			(sav[SAVE_COUNT_OFFSET + 3]! << 24)) >>>
		0;
	const newCount = count + 1;
	sav[SAVE_COUNT_OFFSET] = newCount & 0xff;
	sav[SAVE_COUNT_OFFSET + 1] = (newCount >>> 8) & 0xff;
	sav[SAVE_COUNT_OFFSET + 2] = (newCount >>> 16) & 0xff;
	sav[SAVE_COUNT_OFFSET + 3] = (newCount >>> 24) & 0xff;

	// Encrypt and write each block
	for (const block of BLOCKS) {
		let plaintext = blocks.get(block.name);

		if (!plaintext) {
			if (baseSav) {
				// Decrypt from base save
				const {decrypted} = await verifyBlock(block, baseSav);
				plaintext = decrypted;
			} else if (block.name === 'footer') {
				plaintext = new Uint8Array(DEFAULT_FOOTER);
			} else {
				// Zeroed block
				plaintext = new Uint8Array(block.size);
			}
		}

		const fullBlock = await encryptBlock(block, plaintext);
		sav.set(fullBlock, block.offset);
	}

	// Recompute file-level CRC32 (offset 0x00, computed with field zeroed)
	sav[0] = 0;
	sav[1] = 0;
	sav[2] = 0;
	sav[3] = 0;
	const fileCrc = crc32(sav);
	sav[0] = fileCrc & 0xff;
	sav[1] = (fileCrc >>> 8) & 0xff;
	sav[2] = (fileCrc >>> 16) & 0xff;
	sav[3] = (fileCrc >>> 24) & 0xff;

	return sav;
}

/**
 * Decode the player name from a raw 64KB .sav header (or any buffer
 * whose first ≥0x18 bytes mirror the header). Trailing 0x00 padding
 * is stripped.
 */
export function readPlayerName(savOrHeader: Uint8Array): string {
	return decodeShiftJis(
		savOrHeader.slice(NAME_OFFSET, NAME_OFFSET + NAME_LENGTH),
	);
}

/**
 * Write the player name into a header buffer in place. The string is
 * encoded via Shift_JIS (the encoding the game uses) and clamped to
 * NAME_LENGTH bytes. Any unused trailing bytes are zeroed. The 20-byte
 * value at 0x50 is NOT recomputed — its derivation is unknown, and
 * the game accepts edited saves so it appears to not be a strict
 * integrity check.
 */
export function writePlayerName(header: Uint8Array, name: string): void {
	const encoded = encodeShiftJis(name, NAME_LENGTH);
	header.set(encoded, NAME_OFFSET);
}

/**
 * Wrap a raw 64KB .sav into a DeSmuME .dsv by appending the 122-byte
 * DeSmuME 0.9.x footer. The footer encodes:
 *   - the snip marker (so the file can be unwrapped back to .sav)
 *   - emulator metadata (save type / size: 64KB EEPROM)
 *   - the "|-DESMUME SAVE-|" terminator
 *
 * Verified against DeSmuME and melonDS — both accept this template.
 */
export function wrapDsv(rawSav: Uint8Array): Uint8Array {
	if (rawSav.length !== SAV_SIZE) {
		throw new Error(`Expected ${SAV_SIZE}-byte raw save, got ${rawSav.length}`);
	}
	// 122 bytes: snip marker text + 16 bytes save metadata + 16 bytes padding/terminator.
	// Captured verbatim from a real DeSmuME-produced .dsv for this game.
	const FOOTER_HEX =
		'7c3c2d2d536e69702061626f7665206865726520746f20637265617465206120' +
		'72617720736176206279206578636c7564696e672074686973204465536d754d' +
		'45207361766564617461' +
		'20666f6f7465723a' +
		'012000000080000004000000020000000000800000000000' +
		'7c2d4445534d554d4520534156452d7c';
	const footer = new Uint8Array(FOOTER_HEX.length / 2);
	for (let i = 0; i < footer.length; i++) {
		footer[i] = Number.parseInt(FOOTER_HEX.slice(i * 2, i * 2 + 2), 16);
	}
	const out = new Uint8Array(rawSav.length + footer.length);
	out.set(rawSav, 0);
	out.set(footer, rawSav.length);
	return out;
}

/**
 * Build a fresh header (for createSave without a base).
 */
export function freshHeader(): Uint8Array {
	const header = new Uint8Array(HEADER_SIZE);

	// Magic
	const magic = new TextEncoder().encode(MAGIC);
	header.set(magic, MAGIC_OFFSET);

	// Version (little-endian)
	header[VERSION_OFFSET] = VERSION & 0xff;
	header[VERSION_OFFSET + 1] = (VERSION >>> 8) & 0xff;
	header[VERSION_OFFSET + 2] = (VERSION >>> 16) & 0xff;
	header[VERSION_OFFSET + 3] = (VERSION >>> 24) & 0xff;

	// Save count = 1
	header[SAVE_COUNT_OFFSET] = 1;

	return header;
}
