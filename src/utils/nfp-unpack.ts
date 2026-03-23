/**
 * NFP archive unpacker.
 *
 * Handles XOR deobfuscation and LZ10 decompression of files within
 * SEGA's NFP archive format used by Sangokushi Taisen DS.
 */

export type NfpFile = {
	name: string;
	data: Uint8Array;
};

/** Copy a slice into a fresh Uint8Array backed by a plain ArrayBuffer */
function copySlice(src: Uint8Array, start: number, end: number): Uint8Array {
	const len = end - start;
	const copy = new Uint8Array(len);
	for (let i = 0; i < len; i += 1) copy[i] = src[start + i] ?? 0;
	return copy;
}

// ============================================================================
// 32-bit math helpers (BigInt for correctness on large multiplies)
// ============================================================================

const M32 = 0xff_ff_ff_ffn;

function mul32(a: number, b: number): number {
	return Number((BigInt(a >>> 0) * BigInt(b >>> 0)) & M32);
}

function add32(a: number, b: number): number {
	return Number((BigInt(a >>> 0) + BigInt(b >>> 0)) & M32);
}

function hasCarry(a: number, b: number): boolean {
	return BigInt(a >>> 0) + BigInt(b >>> 0) > M32;
}

function mul64(a: number, b: number): {high: number; low: number} {
	const r = BigInt(a >>> 0) * BigInt(b >>> 0);
	return {high: Number((r >> 32n) & M32), low: Number(r & M32)};
}

// ============================================================================
// XOR deobfuscation
// ============================================================================

export function deobfuscate(
	data: Uint8Array,
	seed0: number,
	seed1: number,
): Uint8Array {
	const result = new Uint8Array(data);
	const view = new DataView(
		result.buffer,
		result.byteOffset,
		result.byteLength,
	);
	const seeds = new Uint32Array(9);
	seeds[0] = seed0 >>> 0;
	seeds[1] = seed1 >>> 0;
	seeds[2] = seed0 >>> 0;
	seeds[3] = seed1 >>> 0;
	seeds[4] = 0x6c_07_89_65;
	seeds[5] = 0x5d_58_8b_65;
	seeds[6] = 0x00_26_9e_c3;
	seeds[7] = 0;
	seeds[8] = 4;

	const s4 = seeds[4] ?? 0;
	const s5 = seeds[5] ?? 0;
	const s6 = seeds[6] ?? 0;
	const s7 = seeds[7] ?? 0;

	let {high: smh, low: sml} = mul64(s4, seeds[2] ?? 0);
	let s2 = add32(mul32(s4, seeds[3] ?? 0), smh);
	let s3 = add32(mul32(s5, seeds[2] ?? 0), s2);
	let cf = hasCarry(s6, sml);
	seeds[2] = add32(s6, sml);
	seeds[3] = add32(add32(s7, s3), cf ? 1 : 0);

	const s3b = new Uint8Array(4);
	new DataView(s3b.buffer).setUint32(0, s3, true);
	const skipBytes = seeds[8] ?? 4;
	for (let i = 4 - skipBytes; i < 4 && i < result.length; i += 1) {
		const ri = result[i];
		if (ri !== undefined) result[i] = ri ^ (s3b[i] ?? 0);
	}

	let mainEnd = result.length & ~3;
	if (mainEnd < 4) mainEnd = 4;
	for (let i = 4; i < mainEnd; i += 4) {
		({high: smh, low: sml} = mul64(s4, seeds[2] ?? 0));
		s2 = add32(mul32(s4, seeds[3] ?? 0), smh);
		cf = hasCarry(s6, sml);
		s3 = add32(add32(mul32(s5, seeds[2] ?? 0), s2), cf ? 1 : 0);
		seeds[2] = add32(s6, sml);
		seeds[3] = add32(s7, s3);
		const val = view.getUint32(i, true);
		view.setUint32(i, (val ^ s3) >>> 0, true);
	}

	const tail = result.length - mainEnd;
	if (tail > 0) {
		({high: smh, low: sml} = mul64(s4, seeds[2] ?? 0));
		s2 = add32(mul32(s4, seeds[3] ?? 0), smh);
		cf = hasCarry(s6, sml);
		s3 = add32(add32(mul32(s5, seeds[2] ?? 0), s2), cf ? 1 : 0);
		seeds[2] = add32(s6, sml);
		seeds[3] = add32(s7, s3);
		new DataView(s3b.buffer).setUint32(0, s3, true);
		for (let i = 0; i < tail; i += 1) {
			const ri = result[mainEnd + i];
			if (ri !== undefined) result[mainEnd + i] = ri ^ (s3b[i] ?? 0);
		}
	}

	return result;
}

// ============================================================================
// CRC32 seed from file table entry
// ============================================================================

function calcFileSeed(entry: Uint8Array): number {
	let seed = 0xff_ff_ff_ff;
	for (let j = 0; j < entry.length; j += 1) {
		seed ^= entry[j]!;
		for (let k = 0; k < 8; k += 1) {
			seed = seed & 1 ? 0xed_b8_83_20 ^ (seed >>> 1) : seed >>> 1;
		}
	}
	return ~seed >>> 0;
}

// ============================================================================
// LZ10 decompression
// ============================================================================

export function lz10Decompress(src: Uint8Array, offset = 0): Uint8Array | null {
	if (src[offset] !== 0x10) return null;
	const decompSize =
		(src[offset + 1] ?? 0) |
		((src[offset + 2] ?? 0) << 8) |
		((src[offset + 3] ?? 0) << 16);
	if (decompSize === 0 || decompSize > 0x20_00_00) return null;

	const out = new Uint8Array(decompSize);
	let si = offset + 4;
	let di = 0;

	while (di < decompSize && si < src.length) {
		const flags = src[si]!;
		si += 1;
		for (let i = 0; i < 8 && di < decompSize && si < src.length; i += 1) {
			if (flags & (0x80 >> i)) {
				if (si + 1 >= src.length) break;
				const b1 = src[si]!;
				const b2 = src[si + 1]!;
				si += 2;
				const len = ((b1 >> 4) & 0xf) + 3;
				const disp = ((b1 & 0xf) << 8) | b2;
				const sp = di - disp - 1;
				if (sp < 0) break;
				for (let j = 0; j < len && di < decompSize; j += 1) {
					out[di] = out[sp + j]!;
					di += 1;
				}
			} else {
				out[di] = src[si]!;
				di += 1;
				si += 1;
			}
		}
	}
	return out;
}

// ============================================================================
// NFP unpacker
// ============================================================================

/**
 * Unpack an NFP archive into its constituent files.
 *
 * @param buf - The raw NFP archive bytes
 */
export function unpackNfp(buf: Uint8Array): NfpFile[] {
	const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
	const copyright = new TextDecoder().decode(buf.slice(0, 0x20));
	if (!copyright.startsWith('Copyright')) throw new Error('Not an NFP file');

	const numFiles = view.getInt32(0x34, true);
	const tableOff = view.getInt32(0x38, true);
	const firstOff = view.getInt32(0x3c, true);
	const seed0 = view.getUint32(0x40, true);
	const seed1 = view.getUint32(0x44, true);

	const tableRaw = new Uint8Array(buf.slice(tableOff, firstOff));
	const table = deobfuscate(tableRaw, seed0, seed1);
	const tableView = new DataView(
		table.buffer,
		table.byteOffset,
		table.byteLength,
	);

	type Entry = {
		name: string;
		offset: number;
		determinant: number;
		entryBytes: Uint8Array;
	};
	const entries: Entry[] = [];
	const decoder = new TextDecoder();

	for (let i = 0; i < numFiles; i += 1) {
		const off = i * 0x18;
		const nameBytes = table.slice(off, off + 0x10);
		let end = nameBytes.indexOf(0);
		if (end === -1) end = 0x10;
		const name = decoder.decode(nameBytes.slice(0, end));
		entries.push({
			name,
			offset: tableView.getUint32(off + 0x10, true),
			determinant: tableView.getUint32(off + 0x14, true),
			entryBytes: new Uint8Array(table.slice(off, off + 0x18)),
		});
	}

	const files: NfpFile[] = [];
	for (let i = 0; i < entries.length; i += 1) {
		const e = entries[i]!;
		const nextOff =
			i < entries.length - 1
				? (entries[i + 1]?.offset ?? buf.length)
				: buf.length;
		let data = copySlice(buf, e.offset, nextOff);

		const isObf = ((e.determinant >> 1) & 1) === 1;
		if (isObf) {
			const seed = calcFileSeed(e.entryBytes);
			data = deobfuscate(data, seed, 0);
			if (data[0] === 0x10) {
				const dec = lz10Decompress(data);
				if (dec) data = copySlice(dec, 0, dec.length);
			}
		}
		files.push({name: e.name, data});
	}
	return files;
}
