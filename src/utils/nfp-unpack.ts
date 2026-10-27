/**
 * NFP archive unpacker.
 *
 * Handles XOR deobfuscation and LZ10 / LZ11 decompression of files within
 * SEGA's NFP archive format used by Sangokushi Taisen DS.
 *
 * Files are decoded the way the ROM loads them (arm9 02016724); the
 * evidence is in sgst-explo nfp-tools/NFP_FORMAT.md. Each file table entry
 * ends in a u32 `det`:
 *   det = decodedSize << 2 | bit 1 (XOR-obfuscated) | bit 0 (LZ-compressed)
 *   - bit 1 alone selects the XOR (0x02016778);
 *   - bit 0 alone selects the LZ decoder (0x0201675c), whatever the first
 *     byte is; the LZ type is the header's low nibble (0x02046f90):
 *     0 = LZ10, anything else = LZ11;
 *   - a file without bit 0 is the first det >> 2 stored bytes.
 * Nothing is decided by file name or by sniffing the data.
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

/** A file's XOR seed0 is the CRC32 of its own 24-byte table entry (02016b0c). */
export function calcFileSeed(entry: Uint8Array): number {
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
// LZ10 / LZ11 decompression
// ============================================================================

export type LzType = 0x10 | 0x11;

/** `det` bit 0: the file is LZ-compressed. */
export const DET_LZ = 1;
/** `det` bit 1: the file is XOR-obfuscated. */
export const DET_OBF = 2;

/**
 * The LZ type the ROM picks for a header byte: a non-zero low nibble selects
 * LZ11 (0x02046f90..0x02046fa0), anything else LZ10. The type byte itself is
 * never checked.
 */
export function lzType(headerByte: number): LzType {
	return (headerByte & 0x0f) === 0 ? 0x10 : 0x11;
}

type Backref = {len: number; disp: number; size: number};

/** Reads one back-reference token at `si`; null if the input ends first. */
function readBackref(
	src: Uint8Array,
	si: number,
	type: LzType,
): Backref | null {
	const b0 = src[si];
	const b1 = src[si + 1];
	if (b0 === undefined || b1 === undefined) return null;
	if (type === 0x10) {
		return {
			disp: (((b0 & 0x0f) << 8) | b1) + 1,
			len: (b0 >> 4) + 3,
			size: 2,
		};
	}
	const ind = b0 >> 4;
	if (ind > 1) {
		return {disp: (((b0 & 0x0f) << 8) | b1) + 1, len: ind + 1, size: 2};
	}
	const b2 = src[si + 2];
	if (b2 === undefined) return null;
	if (ind === 0) {
		return {
			disp: (((b1 & 0x0f) << 8) | b2) + 1,
			len: (((b0 & 0x0f) << 4) | (b1 >> 4)) + 0x11,
			size: 3,
		};
	}
	const b3 = src[si + 3];
	if (b3 === undefined) return null;
	return {
		disp: (((b2 & 0x0f) << 8) | b3) + 1,
		len: (((b0 & 0x0f) << 12) | (b1 << 4) | (b2 >> 4)) + 0x1_11,
		size: 4,
	};
}

/**
 * Decode an LZ10 or LZ11 stream like the SDK decoder (02046ff0). The output
 * size is the header's 24-bit field; `type` defaults to what the ROM picks
 * from the header byte. Returns null if the stream ends early or copies from
 * before the start of the output.
 */
export function lzDecompress(
	src: Uint8Array,
	offset = 0,
	type: LzType = lzType(src[offset] ?? 0),
): Uint8Array | null {
	if (offset + 4 > src.length) return null;
	const size =
		src[offset + 1]! | (src[offset + 2]! << 8) | (src[offset + 3]! << 16);
	const out = new Uint8Array(size);
	let si = offset + 4;
	let di = 0;

	while (di < size) {
		const flags = src[si];
		if (flags === undefined) return null;
		si += 1;
		for (let bit = 0; bit < 8 && di < size; bit += 1) {
			if ((flags & (0x80 >> bit)) === 0) {
				const lit = src[si];
				if (lit === undefined) return null;
				out[di] = lit;
				di += 1;
				si += 1;
				continue;
			}
			const ref = readBackref(src, si, type);
			if (!ref || ref.disp > di) return null;
			si += ref.size;
			// Stop at the decoded size; the SDK decoder does not check it
			// inside a copy (0x02047108), so a longer copy would overrun.
			for (let j = 0; j < ref.len && di < size; j += 1) {
				out[di] = out[di - ref.disp]!;
				di += 1;
			}
		}
	}
	return out;
}

/**
 * Decode an LZ10 stream. Returns null unless the header byte is 0x10 and the
 * size is 1..2 MiB. KPC blocks use this; NFP files use `lzDecompress`.
 */
export function lz10Decompress(src: Uint8Array, offset = 0): Uint8Array | null {
	if (src[offset] !== 0x10) return null;
	const decompSize =
		(src[offset + 1] ?? 0) |
		((src[offset + 2] ?? 0) << 8) |
		((src[offset + 3] ?? 0) << 16);
	if (decompSize === 0 || decompSize > 0x20_00_00) return null;
	return lzDecompress(src, offset, 0x10);
}

/**
 * LZ-decode a file whose `det` has bit 0 set. One shipped file,
 * SENRYAKUMODE.NFP `JID_TOB.YCE`, has an LZ11 header byte (0x11) over an LZ10
 * stream: the ROM decodes it as LZ11 and reads a back-reference from before
 * the buffer. As in sgst-explo's nfp-unpack.ts, a stream that does not decode
 * as its header's type is decoded as the other type; if neither works the
 * stored bytes are kept.
 */
function decodeLzFile(plain: Uint8Array): Uint8Array {
	const type = lzType(plain[0] ?? 0);
	const other: LzType = type === 0x10 ? 0x11 : 0x10;
	return lzDecompress(plain, 0, type) ?? lzDecompress(plain, 0, other) ?? plain;
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
	// Header +0x48: the table is obfuscated (0x02016274); 1 in every shipped NFP.
	const tableObfuscated = buf[0x48] !== 0;

	const tableRaw = new Uint8Array(buf.slice(tableOff, firstOff));
	const table = tableObfuscated
		? deobfuscate(tableRaw, seed0, seed1)
		: tableRaw;
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
		// No stored-size field: a file runs to the next entry's offset, the
		// last one to the archive's end (0x02016488).
		const nextOff =
			i < entries.length - 1
				? (entries[i + 1]?.offset ?? buf.length)
				: buf.length;
		let data = copySlice(buf, e.offset, nextOff);

		if (e.determinant & DET_OBF) {
			data = deobfuscate(data, calcFileSeed(e.entryBytes), 0);
		}
		if (e.determinant & DET_LZ) {
			data = decodeLzFile(data);
		} else {
			// The ROM reads det >> 2 bytes; the rest is alignment padding.
			data = copySlice(data, 0, Math.min(data.length, e.determinant >>> 2));
		}
		files.push({name: e.name, data});
	}
	return files;
}
