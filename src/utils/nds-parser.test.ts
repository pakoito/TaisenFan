import fs from 'node:fs';
import path from 'node:path';
import {parseNds} from '@/utils/nds-parser';

const FIXTURE_PATH = path.resolve(
	import.meta.dirname,
	'__fixtures__/nds-fs.bin',
);

const hasFixture = fs.existsSync(FIXTURE_PATH);

describe.skipIf(!hasFixture)('parseNds', () => {
	let rom: Uint8Array;

	beforeAll(() => {
		rom = new Uint8Array(fs.readFileSync(FIXTURE_PATH));
	});

	it('parses the game title', () => {
		const result = parseNds(rom);
		expect(result.title).toBe('3594-T-TEN');
	});

	it('finds all NitroFS files', () => {
		const result = parseNds(rom);
		expect(result.files.length).toBeGreaterThan(0);
	});

	it('includes kpcbustup.NFP in the file list', () => {
		const result = parseNds(rom);
		const bustup = result.files.find(
			f => f.name.toLowerCase() === 'kpcbustup.nfp',
		);
		expect(bustup).toBeDefined();
		expect(bustup?.size).toBeGreaterThan(0);
	});

	it('includes NFP archive files', () => {
		const result = parseNds(rom);
		const nfpFiles = result.files.filter(f =>
			f.name.toUpperCase().endsWith('.NFP'),
		);
		expect(nfpFiles.length).toBeGreaterThan(10);
	});

	it('all files have valid offsets and sizes', () => {
		const result = parseNds(rom);
		for (const file of result.files) {
			expect(file.offset).toBeGreaterThanOrEqual(0);
			expect(file.size).toBeGreaterThan(0);
		}
	});
});
