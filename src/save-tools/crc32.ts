/**
 * CRC32 (standard polynomial 0xEDB88320).
 * Pure JavaScript, no dependencies.
 */

const POLY = 0xed_b8_83_20;

// Pre-compute lookup table for performance
const TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
	let crc = i;
	for (let j = 0; j < 8; j++) {
		crc = crc & 1 ? POLY ^ (crc >>> 1) : crc >>> 1;
	}
	TABLE[i] = crc >>> 0;
}

export function crc32(data: Uint8Array): number {
	let crc = 0xff_ff_ff_ff;
	for (let i = 0; i < data.length; i++) {
		crc = (TABLE[(crc ^ data[i]!) & 0xff]! ^ (crc >>> 8)) >>> 0;
	}
	return ~crc >>> 0;
}
