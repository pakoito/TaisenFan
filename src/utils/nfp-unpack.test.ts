import fs from 'node:fs'
import path from 'node:path'
import {deobfuscate, lz10Decompress, unpackNfp} from '@/utils/nfp-unpack'

const NFP_FIXTURE = path.resolve(
	import.meta.dirname,
	'__fixtures__/kpcbustup.nfp'
)

const hasFixture = fs.existsSync(NFP_FIXTURE)
const KPC_EXT = /\.KPC$/u

describe('lz10Decompress', () => {
	it('returns null for non-LZ10 data', () => {
		const data = new Uint8Array([0x00, 0x01, 0x02, 0x03])
		expect(lz10Decompress(data)).toBeNull()
	})

	it('returns null for zero decompressed size', () => {
		const data = new Uint8Array([0x10, 0x00, 0x00, 0x00])
		expect(lz10Decompress(data)).toBeNull()
	})

	it('decompresses a simple literal-only LZ10 stream', () => {
		// LZ10 header: magic=0x10, size=4 (LE 24-bit)
		// flags byte 0x00 = 8 literals
		// Then 4 literal bytes
		const data = new Uint8Array([
			0x10, 0x04, 0x00, 0x00, 0x00, 0xaa, 0xbb, 0xcc, 0xdd
		])
		const result = lz10Decompress(data)
		expect(result).not.toBeNull()
		expect(result?.length).toBe(4)
		expect(result?.[0]).toBe(0xaa)
		expect(result?.[1]).toBe(0xbb)
		expect(result?.[2]).toBe(0xcc)
		expect(result?.[3]).toBe(0xdd)
	})
})

describe('deobfuscate', () => {
	it('returns a Uint8Array of the same length', () => {
		const data = new Uint8Array(32).fill(0x42)
		const result = deobfuscate(data, 0x12_34, 0x56_78)
		expect(result.length).toBe(data.length)
	})

	it('is deterministic with same seeds', () => {
		const data = new Uint8Array(64).fill(0xab)
		const r1 = deobfuscate(data, 0x11_11, 0x22_22)
		const r2 = deobfuscate(data, 0x11_11, 0x22_22)
		expect(r1).toEqual(r2)
	})

	it('produces different output with different seeds', () => {
		const data = new Uint8Array(64).fill(0xab)
		const r1 = deobfuscate(data, 0x11_11, 0x22_22)
		const r2 = deobfuscate(data, 0x33_33, 0x44_44)
		expect(r1).not.toEqual(r2)
	})
})

describe.skipIf(!hasFixture)('unpackNfp', () => {
	let nfpData: Uint8Array

	beforeAll(() => {
		nfpData = new Uint8Array(fs.readFileSync(NFP_FIXTURE))
	})

	it('unpacks kpcbustup.NFP into files', () => {
		const files = unpackNfp(nfpData)
		expect(files.length).toBeGreaterThan(0)
	})

	it('all files have KPC extension', () => {
		const files = unpackNfp(nfpData)
		for (const f of files) {
			expect(f.name.toUpperCase()).toMatch(KPC_EXT)
		}
	})

	it('all files have non-empty data', () => {
		const files = unpackNfp(nfpData)
		for (const f of files) {
			expect(f.data.length).toBeGreaterThan(0)
		}
	})

	it('all files start with KPC magic (2CPK)', () => {
		const files = unpackNfp(nfpData)
		for (const f of files) {
			const magic = String.fromCharCode(
				f.data[0] ?? 0,
				f.data[1] ?? 0,
				f.data[2] ?? 0,
				f.data[3] ?? 0
			)
			expect(magic).toBe('2CPK')
		}
	})

	it('throws for non-NFP data', () => {
		const bad = new Uint8Array(64).fill(0)
		expect(() => unpackNfp(bad)).toThrow('Not an NFP file')
	})
})
