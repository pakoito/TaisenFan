/**
 * Save file block encryption/decryption.
 *
 * Uses Web Crypto API for HMAC-SHA1 (works in both Node and browsers).
 * Uses pure JS for MD5 and CRC32 (not available in Web Crypto).
 *
 * Algorithm: Xorshift128 PRNG + HMAC-SHA1 stream cipher. Per-block keys
 * + xorshift seeds are precomputed below — these are byte-for-byte
 * verified against captured saves and live in version control.
 */

import {crc32} from './crc32';
import {md5} from './md5';

// === Block definitions ===

export type BlockInfo = {
	name: string;
	size: number;
	offset: number;
	allocSize: number;
};

export const BLOCKS: BlockInfo[] = [
	{name: 'profile', size: 0x4_5c, offset: 0x80, allocSize: 0x4_80},
	{name: 'deck_slots', size: 0x3_58, offset: 0x5_00, allocSize: 0x3_80},
	// 2164 bytes once called the "decks" block. Most of it is an
	// account-level header (constants + JTNC magic + two 4-byte per-save
	// hashes that include the prefecture choice). 12-byte entries appear
	// at +0x40 but their purpose is unclear and none of our sample saves
	// populate them. Renamed to "account" to stop pretending it's decks.
	{name: 'account', size: 0x8_74, offset: 0x8_80, allocSize: 0x9_00},
	{name: 'history', size: 0x59_1c, offset: 0x11_80, allocSize: 0x59_80},
	{name: 'footer', size: 0x8, offset: 0x6b_00, allocSize: 0x80},
];

export function getBlock(name: string): BlockInfo {
	const block = BLOCKS.find(b => b.name === name);
	if (!block) throw new Error(`Unknown block: ${name}`);
	return block;
}

// === Precomputed keys and xorshift states (verified against real saves) ===

const PRECOMPUTED_KEYS: Record<string, Uint8Array> = {
	profile: hex('79F139A7A6AF433BF3F5E6007FC3026226395A6B'),
	deck_slots: hex('64C324956FFDEC09D6C13C47D1450DB60023B7C0'),
	account: hex('B0CEF09849FEC1040334DD86FE71BF907ED52404'),
	history: hex('F394B3C26E773B5E5A0DF308514AD37C7115655E'),
	footer: hex('8AE9CABFD1EF7A2385848C4B136B10573BB5D7AB'),
};

type XorshiftState = {
	s0: number;
	s1: number;
	s2: number;
	s3: number;
};

const PRECOMPUTED_STATES: Record<string, XorshiftState> = {
	profile: {
		s0: 0x4a_e0_84_37,
		s1: 0xc8_14_e6_06,
		s2: 0xd3_3a_93_65,
		s3: 0x89_78_35_7a,
	},
	deck_slots: {
		s0: 0x97_a6_78_98,
		s1: 0x40_14_8e_ef,
		s2: 0x6c_a7_49_7b,
		s3: 0xa2_0e_45_58,
	},
	account: {
		s0: 0x29_b9_50_70,
		s1: 0x87_ef_81_50,
		s2: 0xcb_27_42_a1,
		s3: 0xa4_65_59_0a,
	},
	history: {
		s0: 0x56_1e_a1_42,
		s1: 0xcb_1c_1f_79,
		s2: 0x25_2d_de_09,
		s3: 0xa1_61_1c_6d,
	},
	footer: {
		s0: 0x62_1f_bc_a3,
		s1: 0x08_76_93_df,
		s2: 0x9b_3d_45_bd,
		s3: 0x65_e0_3b_33,
	},
};

// === HMAC-SHA1 via Web Crypto API ===

async function hmacSha1(
	key: Uint8Array,
	data: Uint8Array,
): Promise<Uint8Array> {
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		key as BufferSource,
		{name: 'HMAC', hash: 'SHA-1'},
		false,
		['sign'],
	);
	const sig = await crypto.subtle.sign('HMAC', cryptoKey, data as BufferSource);
	return new Uint8Array(sig);
}

function getKey(name: string): Uint8Array {
	const key = PRECOMPUTED_KEYS[name];
	if (!key) throw new Error(`No precomputed key for block: ${name}`);
	return key;
}

function getState(name: string): XorshiftState {
	const state = PRECOMPUTED_STATES[name];
	if (!state) throw new Error(`No precomputed state for block: ${name}`);
	return {s0: state.s0, s1: state.s1, s2: state.s2, s3: state.s3};
}

// === Xorshift step (shared by encrypt/decrypt) ===

function xorshiftStep(state: XorshiftState): number {
	let t = (state.s3 ^ (state.s3 << 11)) >>> 0;
	const tmp = state.s1;
	state.s3 = state.s2;
	state.s1 = state.s0;
	state.s2 = tmp;
	t = (t ^ (t >>> 8)) >>> 0;
	state.s0 = (state.s0 ^ (state.s0 >>> 19) ^ t) >>> 0;
	return state.s0;
}

// === Block decrypt ===

export async function decryptBlock(
	block: BlockInfo,
	encrypted: Uint8Array,
): Promise<Uint8Array> {
	const xorKey = getKey(block.name);
	const metadata = encrypted.slice(block.size, block.size + 16); // stored MD5

	const hmacDigest = new Uint8Array(await hmacSha1(xorKey, metadata));
	const state = getState(block.name);
	const output = new Uint8Array(block.size);

	let mod = 0;
	for (let i = 0; i < block.size; i++) {
		// Decrypt: XOR then SUB
		const xored = encrypted[i]! ^ hmacDigest[mod]!;
		output[i] = (xored - hmacDigest[19 - mod]!) & 0xff;

		// Xorshift feedback
		const s0 = xorshiftStep(state);
		hmacDigest[mod] = (hmacDigest[mod]! + s0) & 0xff;

		mod = mod < 19 ? mod + 1 : 0;
	}

	return output;
}

// === Block encrypt ===

export async function encryptBlock(
	block: BlockInfo,
	plaintext: Uint8Array,
): Promise<Uint8Array> {
	const xorKey = getKey(block.name);
	const plainMd5 = md5(plaintext);
	const hmacDigest = new Uint8Array(await hmacSha1(xorKey, plainMd5));
	const state = getState(block.name);
	const encrypted = new Uint8Array(block.size);

	let mod = 0;
	for (let i = 0; i < block.size; i++) {
		// Encrypt: ADD then XOR (inverse of decrypt)
		const temp = (plaintext[i]! + hmacDigest[19 - mod]!) & 0xff;
		encrypted[i] = temp ^ hmacDigest[mod]!;

		// Xorshift feedback (same as decrypt)
		const s0 = xorshiftStep(state);
		hmacDigest[mod] = (hmacDigest[mod]! + s0) & 0xff;

		mod = mod < 19 ? mod + 1 : 0;
	}

	// Build full padded block: [encrypted][MD5 16B][CRC32 4B][padding]
	const fullBlock = new Uint8Array(block.allocSize);
	fullBlock.set(encrypted, 0);
	fullBlock.set(plainMd5, block.size);

	// CRC32 over entire block (with CRC field zeroed, which it already is)
	const checksum = crc32(fullBlock);
	const crcOffset = block.size + 16;
	fullBlock[crcOffset] = checksum & 0xff;
	fullBlock[crcOffset + 1] = (checksum >>> 8) & 0xff;
	fullBlock[crcOffset + 2] = (checksum >>> 16) & 0xff;
	fullBlock[crcOffset + 3] = (checksum >>> 24) & 0xff;

	return fullBlock;
}

// === Verify block MD5 ===

export async function verifyBlock(
	block: BlockInfo,
	sav: Uint8Array,
): Promise<{valid: boolean; decrypted: Uint8Array}> {
	const blockData = sav.slice(block.offset, block.offset + block.allocSize);
	const storedMd5 = blockData.slice(block.size, block.size + 16);

	const decrypted = await decryptBlock(block, blockData);
	const calcMd5 = md5(decrypted);

	const valid = storedMd5.every((b, i) => b === calcMd5[i]);
	return {valid, decrypted};
}

// === Helpers ===

function hex(s: string): Uint8Array {
	const bytes = new Uint8Array(s.length / 2);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(s.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}
