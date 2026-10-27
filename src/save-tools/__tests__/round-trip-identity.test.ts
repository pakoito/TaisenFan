/**
 * An untouched load → save is byte-identical, for every save on disk.
 *
 * The path is the editor's own (SaveContext): extractProfile, the profile
 * through IndexedDB (a structured clone), then replaceSave against the
 * uploaded bytes. All 65,536 bytes must come back as they were (a .dsv is
 * compared with the raw save inside it).
 *
 * The saves: the bundled vanilla template (always), the git-ignored real
 * saves in __fixtures__/sav_name/, and, when TaisenFan is checked out inside
 * the sgst-explo repo, its sample saves under workbench/saves/ (git-ignored
 * there too; a file there that is not a save file is left out). The
 * round trip used to rewrite the 軍師 rows' battle counts (0x1B0..0x248),
 * the selected title's 0xFFFF, the DUEL cleared-mask copies, a 軍師 card
 * byte (sage_ptong.sav) and a wrong block CRC.
 */

import fs from 'node:fs';
import path from 'node:path';
import {extractProfile, replaceSave} from '@/save-tools';
import {extractRawSav, parseSav} from '@/save-tools/save-io';

const HERE = import.meta.dirname;
const VANILLA = path.resolve(HERE, '../../../public/data/vanilla.sav');
const FIXTURES = path.join(HERE, '__fixtures__/sav_name');
const MONOREPO_SAVES = path.resolve(HERE, '../../../../workbench/saves');

function savesUnder(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir, {recursive: true, withFileTypes: true})
		.filter(e => e.isFile() && /\.(?:sav|dsv)$/iu.test(e.name))
		.map(e => path.join(e.parentPath, e.name))
		.sort();
}

function diffOffsets(a: Uint8Array, b: Uint8Array): string[] {
	const out: string[] = [];
	if (a.length !== b.length) out.push(`length ${a.length} → ${b.length}`);
	for (let i = 0; i < Math.min(a.length, b.length); i++) {
		if (a[i] !== b[i]) {
			out.push(`0x${i.toString(16)}: ${a[i]} → ${b[i]}`);
			if (out.length >= 20) break;
		}
	}
	return out;
}

async function roundTrip(file: string): Promise<string[]> {
	const input = new Uint8Array(fs.readFileSync(file));
	const raw = (await parseSav(input)).rawSav;
	const profile = structuredClone(await extractProfile(input));
	return diffOffsets(raw, await replaceSave(input, profile));
}

describe('untouched load → save is byte-identical', () => {
	for (const file of [VANILLA, ...savesUnder(FIXTURES)]) {
		it(path.basename(file), async () => {
			expect(await roundTrip(file)).toEqual([]);
		});
	}

	const sampleSaves = savesUnder(MONOREPO_SAVES).filter(
		file => extractRawSav(new Uint8Array(fs.readFileSync(file))) !== null,
	);
	for (const file of sampleSaves) {
		it(`workbench/saves/${path.relative(MONOREPO_SAVES, file)}`, async () => {
			expect(await roundTrip(file)).toEqual([]);
		});
	}
});
