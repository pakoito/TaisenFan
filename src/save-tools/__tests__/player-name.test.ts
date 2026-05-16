/**
 * Player-name codec tests, run against real MelonDS-produced saves the
 * user created with deliberately distinctive nicknames.
 *
 * The fixtures live under __fixtures__/sav_name/ and are git-ignored
 * (game saves aren't shipped with the codebase). The test suite
 * `skipIf`s itself when they're missing, so CI without the fixtures
 * still passes. Local devs with the fixtures get full coverage.
 */

import fs from 'node:fs';
import path from 'node:path';
import {extractProfile, readPlayerName, replaceSave} from '@/save-tools';
import {decodeShiftJis, encodeShiftJis} from '@/save-tools/shift-jis';

const FIXTURE_DIR = path.resolve(import.meta.dirname, '__fixtures__/sav_name');

const CASES: {file: string; expected: string}[] = [
	{file: 'kukukukukusong_osaka.sav', expected: 'くくくくく♪'},
	{file: 'miau_somewhereNEARtokyo.sav', expected: 'ｍｉａｕ'},
	{file: 'pacc_osaka.sav', expected: 'ｐａｃｃ'},
];

const haveFixtures = CASES.every(c =>
	fs.existsSync(path.join(FIXTURE_DIR, c.file)),
);

describe.skipIf(!haveFixtures)('Player name (real MelonDS saves)', () => {
	for (const c of CASES) {
		it(`reads "${c.expected}" from ${c.file}`, async () => {
			const buf = new Uint8Array(
				fs.readFileSync(path.join(FIXTURE_DIR, c.file)),
			);
			expect(readPlayerName(buf)).toBe(c.expected);
			const profile = await extractProfile(buf);
			expect(profile.playerName).toBe(c.expected);
		});

		it(`${c.file} round-trips unchanged through extract+replace`, async () => {
			const buf = new Uint8Array(
				fs.readFileSync(path.join(FIXTURE_DIR, c.file)),
			);
			const profile = await extractProfile(buf);
			const rebuilt = await replaceSave(buf, profile);
			// Header offset 0x0C-0x17 = 12 bytes, must be byte-identical.
			for (let i = 0x0c; i < 0x18; i++) {
				expect(rebuilt[i], `byte 0x${i.toString(16)}`).toBe(buf[i]);
			}
		});
	}

	it('rewrites a save to use a different player name', async () => {
		const k = new Uint8Array(
			fs.readFileSync(path.join(FIXTURE_DIR, 'kukukukukusong_osaka.sav')),
		);
		const profile = await extractProfile(k);
		expect(profile.playerName).toBe('くくくくく♪');
		profile.playerName = 'ｍｉａｕ';
		const rebuilt = await replaceSave(k, profile);
		const round = await extractProfile(rebuilt);
		expect(round.playerName).toBe('ｍｉａｕ');

		// The 0x0C-0x17 bytes should now match the original miau save's name.
		const m = new Uint8Array(
			fs.readFileSync(path.join(FIXTURE_DIR, 'miau_somewhereNEARtokyo.sav')),
		);
		for (let i = 0x0c; i < 0x18; i++) {
			expect(rebuilt[i], `byte 0x${i.toString(16)}`).toBe(m[i]);
		}
	});
});

describe('Shift_JIS codec', () => {
	it('round-trips hiragana, full-width Latin, and the music symbol', () => {
		const inputs = [
			'くくくくく♪',
			'ｍｉａｕ',
			'ｐａｃｃ',
			'ａａ',
			'',
			'あいうえお',
		];
		for (const text of inputs) {
			const bytes = encodeShiftJis(text);
			expect(decodeShiftJis(bytes), `round-trip "${text}"`).toBe(text);
		}
	});

	it('truncates at the byte limit instead of mid-multi-byte', () => {
		// 7 full-width hiragana = 14 bytes; truncated to 12 keeps 6 chars.
		const bytes = encodeShiftJis('あいうえおかき', 12);
		expect(decodeShiftJis(bytes)).toBe('あいうえおか');
	});

	it('substitutes "?" for unsupported code points', () => {
		// Emoji aren't in Shift_JIS.
		const bytes = encodeShiftJis('a🍣b', 12);
		expect(decodeShiftJis(bytes)).toBe('a?b');
	});
});
