/**
 * KPC image decoder.
 *
 * Decodes SEGA's KPC tile-based image format into RGBA pixel data.
 * Supports 4bpp and 8bpp tiles with palette, tilemap flipping,
 * and auto-cropping to non-transparent content.
 */

import {lz10Decompress} from '@/utils/nfp-unpack'

export interface DecodedImage {
	/** RGBA pixel data */
	rgba: Uint8Array
	/** Width after auto-crop */
	width: number
	/** Height after auto-crop */
	height: number
}

// ============================================================================
// Helpers
// ============================================================================

function readBlock(
	buf: Uint8Array,
	offset: number,
	rawSize: number
): Uint8Array {
	if (buf[offset] === 0x10) {
		const dec = lz10Decompress(buf, offset)
		if (dec) return dec
	}
	return new Uint8Array(buf.buffer, buf.byteOffset + offset, rawSize)
}

// ============================================================================
// KPC decoder
// ============================================================================

/**
 * Decode a KPC file into RGBA pixel data, auto-cropped.
 *
 * @param buf - Raw KPC file bytes
 */
export function decodeKpc(buf: Uint8Array): DecodedImage {
	const magic = String.fromCharCode(
		buf[0] ?? 0,
		buf[1] ?? 0,
		buf[2] ?? 0,
		buf[3] ?? 0
	)
	if (magic !== '2CPK') throw new Error(`Not KPC: ${magic}`)
	const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)

	const mapW = view.getUint16(0x0c, true)
	const mapH = view.getUint16(0x0e, true)
	const tilemapSize = view.getUint32(0x10, true)
	const dataStart = view.getUint32(0x14, true)
	const tileDataSize = view.getUint32(0x5c, true)
	const tileDataOff = view.getUint32(0x60, true)
	const palSize = view.getUint32(0x80, true)
	const palOff = view.getUint32(0x84, true)

	// Read tilemap and tile data — LZ10 compressed or raw
	const tilemapDec = readBlock(buf, dataStart, tilemapSize)
	const tilemap = new Uint16Array(
		tilemapDec.buffer,
		tilemapDec.byteOffset,
		tilemapDec.length / 2
	)
	const tileDec = readBlock(buf, tileDataOff, tileDataSize)

	// Detect 4bpp vs 8bpp
	let maxTile = 0
	for (let i = 0; i < tilemap.length; i += 1) {
		const t = (tilemap[i] ?? 0) & 0x3_ff
		if (t > maxTile) maxTile = t
	}
	const bpt = maxTile > 0 ? Math.round(tileDec.length / (maxTile + 1)) : 32
	const bpp = bpt >= 48 ? 8 : 4
	const bytesPerTile = bpp === 4 ? 32 : 64

	// Parse RGB555 palette
	const palEntries = palSize / 2
	const pal = new Uint8Array(palEntries * 4)
	for (let i = 0; i < palEntries; i += 1) {
		const v = view.getUint16(palOff + i * 2, true)
		const transp = bpp === 4 ? i % 16 === 0 : i === 0
		pal[i * 4] = (v & 0x1f) << 3
		pal[i * 4 + 1] = ((v >> 5) & 0x1f) << 3
		pal[i * 4 + 2] = ((v >> 10) & 0x1f) << 3
		pal[i * 4 + 3] = transp ? 0 : 255
	}

	// Render tilemap → RGBA
	const imgW = mapW * 8
	const imgH = mapH * 8
	const rgba = new Uint8Array(imgW * imgH * 4)

	for (let my = 0; my < mapH; my += 1) {
		for (let mx = 0; mx < mapW; mx += 1) {
			const entry = tilemap[my * mapW + mx] ?? 0
			const tileNum = entry & 0x3_ff
			const hflip = (entry >> 10) & 1
			const vflip = (entry >> 11) & 1
			const palNum = (entry >> 12) & 0xf
			const palBase = palNum * 16
			const tOff = tileNum * bytesPerTile
			if (tOff + bytesPerTile > tileDec.length) continue

			for (let py = 0; py < 8; py += 1) {
				for (let px = 0; px < 8; px += 1) {
					const srcPx = hflip ? 7 - px : px
					const srcPy = vflip ? 7 - py : py
					let ci: number
					if (bpp === 4) {
						const b = tileDec[tOff + srcPy * 4 + (srcPx >> 1)] ?? 0
						ci = srcPx & 1 ? (b >> 4) & 0xf : b & 0xf
					} else {
						ci = tileDec[tOff + srcPy * 8 + srcPx] ?? 0
					}
					if (ci === 0) continue
					const pi = bpp === 4 ? palBase + ci : ci
					const oi = ((my * 8 + py) * imgW + (mx * 8 + px)) * 4
					rgba[oi] = pal[pi * 4] ?? 0
					rgba[oi + 1] = pal[pi * 4 + 1] ?? 0
					rgba[oi + 2] = pal[pi * 4 + 2] ?? 0
					rgba[oi + 3] = pal[pi * 4 + 3] ?? 0
				}
			}
		}
	}

	// Auto-crop to non-transparent content
	return autoCrop(rgba, imgW, imgH)
}

function autoCrop(rgba: Uint8Array, imgW: number, imgH: number): DecodedImage {
	let minX = imgW
	let minY = imgH
	let maxX = 0
	let maxY = 0
	for (let y = 0; y < imgH; y += 1) {
		for (let x = 0; x < imgW; x += 1) {
			if ((rgba[(y * imgW + x) * 4 + 3] ?? 0) > 0) {
				if (x < minX) minX = x
				if (x > maxX) maxX = x
				if (y < minY) minY = y
				if (y > maxY) maxY = y
			}
		}
	}
	if (maxX < minX) return {rgba: new Uint8Array(4), width: 1, height: 1}

	const cw = maxX - minX + 1
	const ch = maxY - minY + 1
	const cropped = new Uint8Array(cw * ch * 4)
	for (let y = 0; y < ch; y += 1) {
		for (let x = 0; x < cw; x += 1) {
			const si = ((minY + y) * imgW + (minX + x)) * 4
			const di = (y * cw + x) * 4
			cropped[di] = rgba[si] ?? 0
			cropped[di + 1] = rgba[si + 1] ?? 0
			cropped[di + 2] = rgba[si + 2] ?? 0
			cropped[di + 3] = rgba[si + 3] ?? 0
		}
	}
	return {rgba: cropped, width: cw, height: ch}
}
