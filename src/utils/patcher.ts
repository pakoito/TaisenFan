/**
 * Browser-based BPS ROM patcher.
 *
 * Implements BPS (Binary Patching System) format directly rather than
 * depending on rom-patcher's npm package, which uses bare global
 * assignments incompatible with Vite's strict-mode CJS interop.
 *
 * Spec: https://www.romhacking.net/documents/746/
 *
 * The patch file is lazily fetched from /data/patch.bps on first use.
 * All processing happens client-side — no data leaves the browser.
 */

const PATCH_URL = `${import.meta.env.BASE_URL}data/patch.bps`
const PATCHED_FILENAME = 'Sangokushi_Taisen_Ten_Japan_EN.nds'

const BPS_MAGIC = 'BPS1'
const ACTION_SOURCE_READ = 0
const ACTION_TARGET_READ = 1
const ACTION_SOURCE_COPY = 2
const ACTION_TARGET_COPY = 3

export interface PatchResult {
	success: boolean
	data?: Uint8Array
	filename?: string
	error?: string
}

// ============================================================================
// BPS parser
// ============================================================================

interface BpsAction {
	type: number
	length: number
	bytes?: number[]
	relativeOffset?: number
}

interface BpsPatch {
	sourceSize: number
	targetSize: number
	actions: BpsAction[]
	sourceChecksum: number
	targetChecksum: number
	patchChecksum: number
}

class BpsReader {
	private readonly view: DataView
	private readonly u8: Uint8Array
	offset = 0

	constructor(buffer: ArrayBuffer) {
		this.view = new DataView(buffer)
		this.u8 = new Uint8Array(buffer)
	}

	get size() {
		return this.u8.length
	}

	readU8(): number {
		const val = this.u8[this.offset] ?? 0
		this.offset += 1
		return val
	}

	readU32(): number {
		const v = this.view.getUint32(this.offset, true)
		this.offset += 4
		return v
	}

	readString(len: number): string {
		let s = ''
		for (let i = 0; i < len; i += 1) {
			s += String.fromCharCode(this.readU8())
		}
		return s
	}

	readBytes(len: number): number[] {
		const bytes: number[] = []
		for (let i = 0; i < len; i += 1) {
			bytes.push(this.readU8())
		}
		return bytes
	}

	readVLV(): number {
		let data = 0
		let shift = 1
		for (;;) {
			const x = this.readU8()
			data += (x & 0x7f) * shift
			if (x & 0x80) break
			shift <<= 7
			data += shift
		}
		return data
	}
}

function parseBps(buffer: ArrayBuffer): BpsPatch {
	const r = new BpsReader(buffer)

	const magic = r.readString(4)
	if (magic !== BPS_MAGIC) throw new Error('Not a BPS patch file')

	const sourceSize = r.readVLV()
	const targetSize = r.readVLV()
	const metaLen = r.readVLV()
	if (metaLen) r.readString(metaLen)

	const actions: BpsAction[] = []
	const endOffset = r.size - 12

	while (r.offset < endOffset) {
		const data = r.readVLV()
		const action: BpsAction = {type: data & 3, length: (data >> 2) + 1}

		if (action.type === ACTION_TARGET_READ) {
			action.bytes = r.readBytes(action.length)
		} else if (
			action.type === ACTION_SOURCE_COPY ||
			action.type === ACTION_TARGET_COPY
		) {
			const v = r.readVLV()
			action.relativeOffset = (v & 1 ? -1 : 1) * (v >> 1)
		}

		actions.push(action)
	}

	return {
		sourceSize,
		targetSize,
		actions,
		sourceChecksum: r.readU32(),
		targetChecksum: r.readU32(),
		patchChecksum: r.readU32()
	}
}

// ============================================================================
// CRC32
// ============================================================================

const crc32Table = (() => {
	const table = new Uint32Array(256)
	for (let i = 0; i < 256; i += 1) {
		let c = i
		for (let j = 0; j < 8; j += 1) {
			c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1
		}
		table[i] = c
	}
	return table
})()

function crc32(data: Uint8Array, start = 0, end = data.length): number {
	let crc = 0xff_ff_ff_ff
	for (let i = start; i < end; i += 1) {
		crc = (crc32Table[(crc ^ (data[i] ?? 0)) & 0xff] ?? 0) ^ (crc >>> 8)
	}
	return (crc ^ 0xff_ff_ff_ff) >>> 0
}

// ============================================================================
// BPS apply
// ============================================================================

function applyBps(sourceData: Uint8Array, patch: BpsPatch): Uint8Array {
	const srcCrc = crc32(sourceData)
	if (srcCrc !== patch.sourceChecksum) {
		throw new Error(
			`ROM checksum mismatch (got ${srcCrc.toString(16)}, expected ${patch.sourceChecksum.toString(16)}). ` +
				'Make sure you are using the correct original Japanese ROM.'
		)
	}

	const target = new Uint8Array(patch.targetSize)
	let tOff = 0
	let srcRel = 0
	let tgtRel = 0

	for (const action of patch.actions) {
		const relOff = action.relativeOffset ?? 0
		switch (action.type) {
			case ACTION_SOURCE_READ:
				for (let i = 0; i < action.length; i += 1) {
					target[tOff] = sourceData[tOff] ?? 0
					tOff += 1
				}
				break

			case ACTION_TARGET_READ:
				for (let i = 0; i < action.length; i += 1) {
					target[tOff] = action.bytes?.[i] ?? 0
					tOff += 1
				}
				break

			case ACTION_SOURCE_COPY:
				srcRel += relOff
				for (let i = 0; i < action.length; i += 1) {
					target[tOff] = sourceData[srcRel] ?? 0
					tOff += 1
					srcRel += 1
				}
				break

			case ACTION_TARGET_COPY:
				tgtRel += relOff
				for (let i = 0; i < action.length; i += 1) {
					target[tOff] = target[tgtRel] ?? 0
					tOff += 1
					tgtRel += 1
				}
				break

			default:
				break
		}
	}

	const tgtCrc = crc32(target)
	if (tgtCrc !== patch.targetChecksum) {
		throw new Error('Patched ROM checksum mismatch — patch may be corrupted.')
	}

	return target
}

// ============================================================================
// Public API
// ============================================================================

let cachedPatch: BpsPatch | null = null

async function fetchPatch(): Promise<BpsPatch> {
	if (cachedPatch) return cachedPatch
	const response = await fetch(PATCH_URL)
	if (!response.ok) {
		throw new Error(`Failed to download patch file: ${response.status}`)
	}
	const buffer = await response.arrayBuffer()
	cachedPatch = parseBps(buffer)
	return cachedPatch
}

export async function applyPatch(romBuffer: ArrayBuffer): Promise<PatchResult> {
	try {
		const patch = await fetchPatch()
		const source = new Uint8Array(romBuffer)
		const patched = applyBps(source, patch)

		return {
			success: true,
			data: patched,
			filename: PATCHED_FILENAME
		}
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Unknown patching error.'
		}
	}
}

export function downloadBlob(data: Uint8Array, filename: string) {
	const blob = new Blob([data.buffer as ArrayBuffer], {
		type: 'application/octet-stream'
	})
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}
