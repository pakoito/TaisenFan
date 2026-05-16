/**
 * End-to-end smoke test for the rename feature.
 *
 * Take vanilla.sav (player name Ｓｉｒ), change name to くくくくく♪ via the
 * codec, and assert:
 *   - The output's name region is the new shift-jis bytes.
 *   - The output's header MD5+CRC at 0x50..0x63 matches a fresh
 *     recomputation over the new payload (i.e., the footer was
 *     refreshed by buildSav). Without this refresh the game treats
 *     the resulting save as corrupted at boot.
 */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {crc32} from '../crc32';
import {extractProfile, replaceSave} from '../index';

const VANILLA_PATH = join(
	import.meta.dirname,
	'../../../public/data/vanilla.sav',
);

describe('rename smoke', () => {
	it('renames vanilla → くくくくく♪ and refreshes header MD5+CRC', async () => {
		const template = new Uint8Array(readFileSync(VANILLA_PATH));
		const profile = await extractProfile(template);
		profile.playerName = 'くくくくく♪';
		const rebuilt = await replaceSave(template, profile);

		// Name region: shift-jis bytes for くくくくく♪
		const expectedName = Uint8Array.from([
			0x82, 0xad, 0x82, 0xad, 0x82, 0xad, 0x82, 0xad, 0x82, 0xad, 0x81, 0xf4,
		]);
		for (let i = 0; i < 12; i++) {
			expect(rebuilt[0x0c + i], `name byte ${i}`).toBe(expectedName[i]);
		}

		// Header MD5+CRC footer at 0x50..0x63 must match a fresh
		// recomputation over bytes 0..0x4F.
		const md5 = new Uint8Array(
			createHash('md5')
				.update(Buffer.from(rebuilt.slice(0, 0x50)))
				.digest(),
		);
		for (let i = 0; i < 16; i++) {
			expect(rebuilt[0x50 + i], `MD5 byte ${i}`).toBe(md5[i]);
		}
		const padded = new Uint8Array(rebuilt.slice(0, 0x80));
		padded[0x60] = 0;
		padded[0x61] = 0;
		padded[0x62] = 0;
		padded[0x63] = 0;
		const c = crc32(padded) >>> 0;
		expect(rebuilt[0x60]).toBe(c & 0xff);
		expect(rebuilt[0x61]).toBe((c >>> 8) & 0xff);
		expect(rebuilt[0x62]).toBe((c >>> 16) & 0xff);
		expect(rebuilt[0x63]).toBe((c >>> 24) & 0xff);
	});
});
