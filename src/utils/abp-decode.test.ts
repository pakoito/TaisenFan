import fs from 'node:fs';
import path from 'node:path';
import {decodeAbp} from '@/utils/abp-decode';
import {unpackNfp} from '@/utils/nfp-unpack';

const NFP_FIXTURE = path.resolve(import.meta.dirname, '__fixtures__/face.nfp');

const hasFixture = fs.existsSync(NFP_FIXTURE);

describe.skipIf(!hasFixture)('decodeAbp', () => {
	let abpFiles: {name: string; data: Uint8Array}[];

	beforeAll(() => {
		const nfpData = new Uint8Array(fs.readFileSync(NFP_FIXTURE));
		abpFiles = unpackNfp(nfpData);
	});

	it('decodes the first ABP file', () => {
		const [first] = abpFiles;
		expect(first).toBeDefined();
		if (!first) return;
		const result = decodeAbp(first.data);
		expect(result.width).toBeGreaterThan(0);
		expect(result.height).toBeGreaterThan(0);
		expect(result.rgba.length).toBe(result.width * result.height * 4);
	});

	it('decodes all ABP files without throwing', () => {
		let decoded = 0;
		for (const f of abpFiles) {
			const result = decodeAbp(f.data);
			expect(result.width).toBeGreaterThan(0);
			expect(result.height).toBeGreaterThan(0);
			decoded += 1;
		}
		expect(decoded).toBe(abpFiles.length);
	});

	it('produces small face dimensions (16x16 or 32x32 range)', () => {
		const [first] = abpFiles;
		expect(first).toBeDefined();
		if (!first) return;
		const result = decodeAbp(first.data);
		expect(result.width).toBeGreaterThanOrEqual(8);
		expect(result.width).toBeLessThanOrEqual(64);
		expect(result.height).toBeGreaterThanOrEqual(8);
		expect(result.height).toBeLessThanOrEqual(64);
	});

	it('has non-transparent pixels', () => {
		const [first] = abpFiles;
		expect(first).toBeDefined();
		if (!first) return;
		const result = decodeAbp(first.data);
		let hasOpaque = false;
		for (let i = 3; i < result.rgba.length; i += 4) {
			if ((result.rgba[i] ?? 0) > 0) {
				hasOpaque = true;
				break;
			}
		}
		expect(hasOpaque).toBe(true);
	});

	it('throws for non-ABP data', () => {
		const bad = new Uint8Array(256).fill(0);
		expect(() => decodeAbp(bad)).toThrow('Not an ABP');
	});
});
