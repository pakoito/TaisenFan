/**
 * BPS (Binary Patching System) parser and applier.
 *
 * Self-contained — no imports from patcher.ts (which uses import.meta.env).
 * Used by the ROM worker for off-main-thread patching.
 */

const BPS_MAGIC = 'BPS1';

interface BpsAction {
	type: number;
	length: number;
	bytes?: number[];
	relativeOffset?: number;
}

export interface BpsPatch {
	sourceSize: number;
	targetSize: number;
	actions: BpsAction[];
	sourceChecksum: number;
	targetChecksum: number;
}

function readVlv(u8: Uint8Array, offset: {v: number}): number {
	let data = 0;
	let shift = 1;
	for (;;) {
		const x = u8[offset.v] ?? 0;
		offset.v += 1;
		data += (x & 0x7f) * shift;
		if (x & 0x80) break;
		shift <<= 7;
		data += shift;
	}
	return data;
}

export function parseBps(buffer: ArrayBuffer): BpsPatch {
	const u8 = new Uint8Array(buffer);
	const view = new DataView(buffer);
	const magic = String.fromCharCode(
		u8[0] ?? 0,
		u8[1] ?? 0,
		u8[2] ?? 0,
		u8[3] ?? 0,
	);
	if (magic !== BPS_MAGIC) throw new Error('Not a BPS patch file');

	const pos = {v: 4};
	const sourceSize = readVlv(u8, pos);
	const targetSize = readVlv(u8, pos);
	const metaLen = readVlv(u8, pos);
	pos.v += metaLen;

	const actions: BpsAction[] = [];
	const endOffset = u8.length - 12;

	while (pos.v < endOffset) {
		const data = readVlv(u8, pos);
		const action: BpsAction = {type: data & 3, length: (data >> 2) + 1};

		if (action.type === 1) {
			action.bytes = [];
			for (let i = 0; i < action.length; i += 1) {
				action.bytes.push(u8[pos.v] ?? 0);
				pos.v += 1;
			}
		} else if (action.type === 2 || action.type === 3) {
			const v = readVlv(u8, pos);
			action.relativeOffset = (v & 1 ? -1 : 1) * (v >> 1);
		}
		actions.push(action);
	}

	return {
		sourceSize,
		targetSize,
		actions,
		sourceChecksum: view.getUint32(u8.length - 12, true),
		targetChecksum: view.getUint32(u8.length - 8, true),
	};
}

const crc32Table = (() => {
	const table = new Uint32Array(256);
	for (let i = 0; i < 256; i += 1) {
		let c = i;
		for (let j = 0; j < 8; j += 1) {
			c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1;
		}
		table[i] = c;
	}
	return table;
})();

export function crc32(data: Uint8Array): number {
	let crc = 0xff_ff_ff_ff;
	for (let i = 0; i < data.length; i += 1) {
		crc = (crc32Table[(crc ^ (data[i] ?? 0)) & 0xff] ?? 0) ^ (crc >>> 8);
	}
	return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

export function applyBps(source: Uint8Array, patch: BpsPatch): Uint8Array {
	const srcCrc = crc32(source);
	if (srcCrc !== patch.sourceChecksum) {
		throw new Error(
			`ROM checksum mismatch (got 0x${srcCrc.toString(16)}, expected 0x${patch.sourceChecksum.toString(16)}). ` +
				'Make sure you are using the correct original Japanese ROM.',
		);
	}

	const target = new Uint8Array(patch.targetSize);
	let tOff = 0;
	let srcRel = 0;
	let tgtRel = 0;

	for (const action of patch.actions) {
		const relOff = action.relativeOffset ?? 0;
		switch (action.type) {
			case 0:
				for (let i = 0; i < action.length; i += 1) {
					target[tOff] = source[tOff] ?? 0;
					tOff += 1;
				}
				break;
			case 1:
				for (let i = 0; i < action.length; i += 1) {
					target[tOff] = action.bytes?.[i] ?? 0;
					tOff += 1;
				}
				break;
			case 2:
				srcRel += relOff;
				for (let i = 0; i < action.length; i += 1) {
					target[tOff] = source[srcRel] ?? 0;
					tOff += 1;
					srcRel += 1;
				}
				break;
			case 3:
				tgtRel += relOff;
				for (let i = 0; i < action.length; i += 1) {
					target[tOff] = target[tgtRel] ?? 0;
					tOff += 1;
					tgtRel += 1;
				}
				break;
			default:
				break;
		}
	}

	const tgtCrc = crc32(target);
	if (tgtCrc !== patch.targetChecksum) {
		throw new Error('Patched ROM checksum mismatch — patch may be corrupted.');
	}

	return target;
}
