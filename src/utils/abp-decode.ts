/**
 * ABP image decoder.
 *
 * Decodes ALPHA-UNIT's ABP sprite format into RGBA pixel data.
 * Supports 4bpp (16 colors) and 8bpp (256 colors), tiled and bitmap modes.
 *
 * Format:
 *   0x00-0x0F: Magic "ABP(c)ALPHA©UNIT"
 *   0x14: BPP type (4 = 4bpp, 5 = 8bpp)
 *   0x15: flags (1 = 8×8 tiled, 0 = linear bitmap)
 *   0x18: stride width
 *   0x1C: pixel data size in bytes
 *   0x20: image width
 *   0x24: image height
 *   0x2C: data offset (always 0x30 = 48)
 *   Then: palette (RGB555), followed by pixel data
 */

const HEADER_SIZE = 48;
const TILE_SIZE = 8;

type DecodedAbp = {
	rgba: Uint8Array;
	width: number;
	height: number;
};

type AbpHeader = {
	bppType: number;
	flags: number;
	pixelDataSize: number;
	width: number;
	height: number;
};

function parseHeader(buf: Uint8Array): AbpHeader {
	const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

	// Validate magic
	const magic = String.fromCharCode(
		buf[0] ?? 0,
		buf[1] ?? 0,
		buf[2] ?? 0,
		buf[3] ?? 0,
		buf[4] ?? 0,
		buf[5] ?? 0,
		buf[6] ?? 0,
		buf[7] ?? 0,
		buf[8] ?? 0,
		buf[9] ?? 0,
		buf[10] ?? 0,
	);
	if (!magic.startsWith('ABP(c)ALPHA')) {
		throw new Error('Not an ABP file: bad magic');
	}

	return {
		bppType: buf[0x14] ?? 0,
		flags: buf[0x15] ?? 0,
		pixelDataSize: view.getUint32(0x1c, true),
		width: view.getUint16(0x20, true),
		height: view.getUint16(0x24, true),
	};
}

function decodePalette(
	buf: Uint8Array,
	offset: number,
	count: number,
): Uint8Array {
	const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
	const palette = new Uint8Array(count * 4);
	for (let i = 0; i < count; i++) {
		const val = view.getUint16(offset + i * 2, true);
		palette[i * 4] = (val & 0x1f) << 3;
		palette[i * 4 + 1] = ((val >> 5) & 0x1f) << 3;
		palette[i * 4 + 2] = ((val >> 10) & 0x1f) << 3;
		palette[i * 4 + 3] = i === 0 ? 0 : 255; // color 0 = transparent
	}
	return palette;
}

function detile(
	pixelData: Uint8Array,
	width: number,
	height: number,
	bpp: number,
	palette: Uint8Array,
): Uint8Array {
	const rgba = new Uint8Array(width * height * 4);
	const tilesX = width / TILE_SIZE;
	const tilesY = height / TILE_SIZE;
	const bytesPerTile = bpp === 4 ? 32 : 64;

	let tileIdx = 0;
	for (let ty = 0; ty < tilesY; ty++) {
		for (let tx = 0; tx < tilesX; tx++) {
			const tileOffset = tileIdx * bytesPerTile;

			for (let py = 0; py < TILE_SIZE; py++) {
				for (let px = 0; px < TILE_SIZE; px++) {
					let colorIdx: number;
					if (bpp === 4) {
						const byteOff = tileOffset + py * 4 + (px >> 1);
						const byte = pixelData[byteOff] ?? 0;
						colorIdx = px % 2 === 0 ? byte & 0x0f : (byte >> 4) & 0x0f;
					} else {
						colorIdx = pixelData[tileOffset + py * 8 + px] ?? 0;
					}

					const imgX = tx * TILE_SIZE + px;
					const imgY = ty * TILE_SIZE + py;
					const outIdx = (imgY * width + imgX) * 4;

					if (colorIdx < palette.length / 4) {
						rgba[outIdx] = palette[colorIdx * 4] ?? 0;
						rgba[outIdx + 1] = palette[colorIdx * 4 + 1] ?? 0;
						rgba[outIdx + 2] = palette[colorIdx * 4 + 2] ?? 0;
						rgba[outIdx + 3] = palette[colorIdx * 4 + 3] ?? 0;
					}
				}
			}
			tileIdx++;
		}
	}
	return rgba;
}

function decodeBitmap(
	pixelData: Uint8Array,
	width: number,
	height: number,
	bpp: number,
	palette: Uint8Array,
): Uint8Array {
	const rgba = new Uint8Array(width * height * 4);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let colorIdx: number;
			if (bpp === 4) {
				const byteOff = (y * width + x) >> 1;
				const byte = pixelData[byteOff] ?? 0;
				colorIdx = x % 2 === 0 ? byte & 0x0f : (byte >> 4) & 0x0f;
			} else {
				colorIdx = pixelData[y * width + x] ?? 0;
			}

			const outIdx = (y * width + x) * 4;
			if (colorIdx < palette.length / 4) {
				rgba[outIdx] = palette[colorIdx * 4] ?? 0;
				rgba[outIdx + 1] = palette[colorIdx * 4 + 1] ?? 0;
				rgba[outIdx + 2] = palette[colorIdx * 4 + 2] ?? 0;
				rgba[outIdx + 3] = palette[colorIdx * 4 + 3] ?? 0;
			}
		}
	}
	return rgba;
}

/**
 * Decode an ABP file into RGBA pixel data.
 *
 * @param buf - Raw ABP file bytes
 * @param crop - If true, auto-crop to non-transparent bounding box (default: false)
 */
export function decodeAbp(buf: Uint8Array, crop = false): DecodedAbp {
	const header = parseHeader(buf);

	const bpp = header.bppType <= 4 ? 4 : 8;
	const paletteSize = buf.length - HEADER_SIZE - header.pixelDataSize;
	const paletteEntries = paletteSize / 2;
	const paletteOffset = HEADER_SIZE;
	const pixelOffset = HEADER_SIZE + paletteSize;

	if (paletteEntries <= 0) {
		throw new Error('ABP file has no embedded palette');
	}

	const palette = decodePalette(buf, paletteOffset, paletteEntries);
	const pixelData = buf.subarray(
		pixelOffset,
		pixelOffset + header.pixelDataSize,
	);

	// flags=1 → 8×8 tiled (sprites), flags=0 → linear bitmap (backgrounds)
	const isTiled = header.flags === 1;
	const rgba = isTiled
		? detile(pixelData, header.width, header.height, bpp, palette)
		: decodeBitmap(pixelData, header.width, header.height, bpp, palette);

	if (crop) {
		return autoCrop(rgba, header.width, header.height);
	}
	return {rgba, width: header.width, height: header.height};
}

function autoCrop(rgba: Uint8Array, imgW: number, imgH: number): DecodedAbp {
	let minX = imgW;
	let minY = imgH;
	let maxX = 0;
	let maxY = 0;
	for (let y = 0; y < imgH; y += 1) {
		for (let x = 0; x < imgW; x += 1) {
			if ((rgba[(y * imgW + x) * 4 + 3] ?? 0) > 0) {
				if (x < minX) minX = x;
				if (x > maxX) maxX = x;
				if (y < minY) minY = y;
				if (y > maxY) maxY = y;
			}
		}
	}
	if (maxX < minX) return {rgba: new Uint8Array(4), width: 1, height: 1};

	const cw = maxX - minX + 1;
	const ch = maxY - minY + 1;
	const cropped = new Uint8Array(cw * ch * 4);
	for (let y = 0; y < ch; y += 1) {
		for (let x = 0; x < cw; x += 1) {
			const si = ((minY + y) * imgW + (minX + x)) * 4;
			const di = (y * cw + x) * 4;
			cropped[di] = rgba[si] ?? 0;
			cropped[di + 1] = rgba[si + 1] ?? 0;
			cropped[di + 2] = rgba[si + 2] ?? 0;
			cropped[di + 3] = rgba[si + 3] ?? 0;
		}
	}
	return {rgba: cropped, width: cw, height: ch};
}
