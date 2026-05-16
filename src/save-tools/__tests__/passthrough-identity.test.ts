/**
 * Byte-perfect passthrough: parseSav → buildSav with no edits must
 * produce a save that is bit-identical to the input across all 65,536
 * bytes — including the unknown fields at 0..3 (previously thought of
 * as a "file CRC") and 0x44..0x47 (previously thought of as a "save
 * count"). Touching either of those caused the game to reject the save
 * as corrupted; this test pins the codec to never regress on that.
 */
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {buildSav, parseSav} from '../save-io';

const FIXTURE_DIR = join(import.meta.dirname, '__fixtures__/sav_name');
const VANILLA_PATH = join(
	import.meta.dirname,
	'../../../public/data/vanilla.sav',
);

const fixtures = [
	{path: VANILLA_PATH, name: 'vanilla.sav (bundled template)'},
	...['pacc_osaka.sav', 'miau_somewhereNEARtokyo.sav'].map(name => ({
		path: join(FIXTURE_DIR, name),
		name,
	})),
];

describe('byte-perfect passthrough', () => {
	for (const {path, name} of fixtures) {
		it(`${name}: parseSav → buildSav is byte-identical`, async () => {
			const input = new Uint8Array(readFileSync(path));
			const parsed = await parseSav(input);
			const output = await buildSav(
				parsed.header,
				parsed.blocks,
				parsed.rawSav,
			);

			const diffs: Array<{off: number; was: number; now: number}> = [];
			for (let i = 0; i < input.length; i++) {
				if (input[i] !== output[i]) {
					diffs.push({off: i, was: input[i]!, now: output[i]!});
				}
			}
			expect(diffs, `${name}: codec must not rewrite any byte`).toEqual([]);
		});
	}
});
