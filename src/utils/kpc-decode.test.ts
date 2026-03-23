import fs from 'node:fs'
import path from 'node:path'
import {decodeKpc} from '@/utils/kpc-decode'
import {unpackNfp} from '@/utils/nfp-unpack'

const NFP_FIXTURE = path.resolve(
	import.meta.dirname,
	'__fixtures__/kpcbustup.nfp'
)

const hasFixture = fs.existsSync(NFP_FIXTURE)

describe.skipIf(!hasFixture)('decodeKpc', () => {
	let kpcFiles: {name: string; data: Uint8Array}[]

	beforeAll(() => {
		const nfpData = new Uint8Array(fs.readFileSync(NFP_FIXTURE))
		kpcFiles = unpackNfp(nfpData)
	})

	it('decodes the first KPC file', () => {
		const [first] = kpcFiles
		expect(first).toBeDefined()
		if (!first) return
		const result = decodeKpc(first.data)
		expect(result.width).toBeGreaterThan(0)
		expect(result.height).toBeGreaterThan(0)
		expect(result.rgba.length).toBe(result.width * result.height * 4)
	})

	it('decodes all KPC files without throwing', () => {
		let decoded = 0
		for (const f of kpcFiles) {
			const result = decodeKpc(f.data)
			expect(result.width).toBeGreaterThan(0)
			expect(result.height).toBeGreaterThan(0)
			decoded += 1
		}
		expect(decoded).toBe(kpcFiles.length)
	})

	it('produces reasonable portrait dimensions', () => {
		const [first] = kpcFiles
		expect(first).toBeDefined()
		if (!first) return
		const result = decodeKpc(first.data)
		expect(result.width).toBeGreaterThanOrEqual(32)
		expect(result.width).toBeLessThanOrEqual(512)
		expect(result.height).toBeGreaterThanOrEqual(32)
		expect(result.height).toBeLessThanOrEqual(512)
	})

	it('has non-transparent pixels', () => {
		const [first] = kpcFiles
		expect(first).toBeDefined()
		if (!first) return
		const result = decodeKpc(first.data)
		let hasOpaque = false
		for (let i = 3; i < result.rgba.length; i += 4) {
			if ((result.rgba[i] ?? 0) > 0) {
				hasOpaque = true
				break
			}
		}
		expect(hasOpaque).toBe(true)
	})

	it('throws for non-KPC data', () => {
		const bad = new Uint8Array(256).fill(0)
		expect(() => decodeKpc(bad)).toThrow('Not KPC')
	})
})
