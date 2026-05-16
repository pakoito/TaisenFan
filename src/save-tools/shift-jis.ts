/**
 * Minimal Shift_JIS codec for the player-name field.
 *
 * `TextDecoder('shift-jis')` is universally available (Node + browsers), so
 * decoding is trivial. There is no standard `TextEncoder` for legacy
 * encodings, so on first use we walk every valid 2-byte Shift_JIS sequence
 * once, decode each, and remember the Unicode → bytes mapping.
 *
 * The table is built once and cached at module scope.
 */

const SINGLE_BYTE_MAX = 0x7f;
const NAME_LENGTH_MAX = 12; // bytes the player-name field reserves

/** Lazy lookup: Unicode code point → 1- or 2-byte Shift_JIS sequence. */
let cachedMap: Map<number, readonly number[]> | null = null;

function buildEncoderMap(): Map<number, readonly number[]> {
	const map = new Map<number, readonly number[]>();
	const decoder = new TextDecoder('shift-jis', {fatal: false});

	// ASCII identity range.
	for (let b = 0x20; b <= SINGLE_BYTE_MAX; b++) {
		map.set(b, [b]);
	}
	// Single-byte half-width katakana (0xA1-0xDF).
	for (let b = 0xa1; b <= 0xdf; b++) {
		const ch = decoder.decode(new Uint8Array([b]));
		if (ch && ch !== '�') map.set(ch.codePointAt(0)!, [b]);
	}
	// Double-byte ranges: first byte 0x81-0x9F or 0xE0-0xFC.
	for (let b1 = 0x81; b1 <= 0xfc; b1++) {
		if (b1 > 0x9f && b1 < 0xe0) continue; // single-byte katakana range
		for (let b2 = 0x40; b2 <= 0xfc; b2++) {
			if (b2 === 0x7f) continue; // gap
			const ch = decoder.decode(new Uint8Array([b1, b2]));
			if (!ch || ch === '�' || ch.length === 0) continue;
			const code = ch.codePointAt(0);
			if (code === undefined) continue;
			// First occurrence wins: keeps the canonical mapping when multiple
			// SJIS sequences round-trip to the same code point.
			if (!map.has(code)) map.set(code, [b1, b2]);
		}
	}
	return map;
}

function encoderMap(): Map<number, readonly number[]> {
	if (!cachedMap) cachedMap = buildEncoderMap();
	return cachedMap;
}

/** Decode a Shift_JIS byte sequence; trailing 0x00 padding is stripped. */
export function decodeShiftJis(bytes: Uint8Array): string {
	let end = bytes.length;
	while (end > 0 && bytes[end - 1] === 0) end--;
	const decoder = new TextDecoder('shift-jis', {fatal: false});
	return decoder.decode(bytes.subarray(0, end));
}

/**
 * Encode a string to Shift_JIS, truncating to `maxBytes` and zero-padding
 * the rest. Unsupported code points are replaced with `?` (0x3F).
 */
export function encodeShiftJis(
	text: string,
	maxBytes: number = NAME_LENGTH_MAX,
): Uint8Array {
	const out = new Uint8Array(maxBytes);
	const map = encoderMap();
	let pos = 0;
	for (const ch of text) {
		const code = ch.codePointAt(0);
		if (code === undefined) continue;
		const seq = map.get(code) ?? [0x3f];
		if (pos + seq.length > maxBytes) break;
		for (const b of seq) {
			out[pos++] = b;
		}
	}
	return out;
}
