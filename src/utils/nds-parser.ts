/**
 * NDS ROM → NitroFS parser.
 *
 * Parses the NDS header to locate the File Name Table (FNT) and File
 * Allocation Table (FAT), then walks the directory tree to produce a
 * flat list of files with their ROM offsets and sizes.
 */

export type NdsFile = {
	/** Filename without path */
	name: string;
	/** Full path including parent directories */
	path: string;
	/** File ID from the FAT */
	fileId: number;
	/** Absolute byte offset within the ROM */
	offset: number;
	/** File size in bytes */
	size: number;
};

export type NdsRom = {
	/** Game title from the NDS header (first 12 bytes, null-trimmed) */
	title: string;
	/** All files in the NitroFS filesystem */
	files: NdsFile[];
};

const NULL_CHAR = /\0/gu;

/**
 * Parse an NDS ROM and return its NitroFS file listing.
 *
 * @param rom - Full ROM as a Uint8Array
 */
export function parseNds(rom: Uint8Array): NdsRom {
	const view = new DataView(rom.buffer, rom.byteOffset, rom.byteLength);

	const titleBytes = rom.slice(0, 12);
	const title = new TextDecoder().decode(titleBytes).replace(NULL_CHAR, '');

	const fntOff = view.getUint32(0x40, true);
	const fntSize = view.getUint32(0x44, true);
	const fatOff = view.getUint32(0x48, true);
	const numDirs = view.getUint16(fntOff + 6, true);

	// Parse FNT directory table
	type DirEntry = {
		subtableOff: number;
		firstFileId: number;
	};
	const dirs: DirEntry[] = [];
	for (let i = 0; i < numDirs; i += 1) {
		const base = fntOff + i * 8;
		dirs.push({
			subtableOff: view.getUint32(base, true),
			firstFileId: view.getUint16(base + 4, true),
		});
	}

	// Walk directory tree recursively
	const files: NdsFile[] = [];
	const decoder = new TextDecoder();

	function walkDir(dirIdx: number, prefix: string): void {
		const dir = dirs[dirIdx];
		if (!dir) return;
		let pos = fntOff + dir.subtableOff;
		let fileId = dir.firstFileId;

		while (pos < fntOff + fntSize) {
			const type = rom[pos] ?? 0;
			pos += 1;
			if (type === 0) break;

			const nameLen = type & 0x7f;
			const isDir = (type & 0x80) !== 0;
			const name = decoder.decode(rom.slice(pos, pos + nameLen));
			pos += nameLen;

			if (isDir) {
				const subDirId = view.getUint16(pos, true) & 0xf_ff;
				pos += 2;
				walkDir(subDirId, `${prefix}${name}/`);
			} else {
				const fatBase = fatOff + fileId * 8;
				const startOff = view.getUint32(fatBase, true);
				const endOff = view.getUint32(fatBase + 4, true);
				files.push({
					name,
					path: `${prefix}${name}`,
					fileId,
					offset: startOff,
					size: endOff - startOff,
				});
				fileId += 1;
			}
		}
	}

	walkDir(0, '');
	return {title, files};
}

/**
 * Slice a file's bytes from the ROM.
 */
export function sliceFile(rom: Uint8Array, file: NdsFile): Uint8Array {
	return new Uint8Array(rom.buffer, rom.byteOffset + file.offset, file.size);
}
