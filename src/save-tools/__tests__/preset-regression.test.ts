/**
 * Locks down the byte-level shape of every preset save the editor can
 * produce, plus the upload round-trip. Each preset matches the same
 * flow the SaveContext uses:
 *
 *   1. Read the bundled vanilla template (real MelonDS fresh save).
 *   2. Extract its canonical profile.
 *   3. Apply the preset overrides.
 *   4. `replaceSave(template, profile)` to write the bytes back.
 *
 * Any byte we accidentally clobber, or any preset that produces a save
 * the game would treat as corrupted, gets caught here before it ships.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
	applyPreset,
	extractProfile,
	type PresetName,
	replaceSave,
} from '@/save-tools';
import {parseSav} from '@/save-tools/save-io';

const VANILLA_PATH = path.resolve(
	import.meta.dirname,
	'../../../public/data/vanilla.sav',
);

const VANILLA = fs.readFileSync(VANILLA_PATH);

async function buildPreset(preset: PresetName): Promise<Uint8Array> {
	const template = new Uint8Array(VANILLA);
	const base = await extractProfile(template);
	const profile = preset === 'fresh' ? base : applyPreset(base, preset);
	return replaceSave(template, profile);
}

function blockDiffs(
	a: Uint8Array,
	b: Uint8Array,
): {count: number; first?: number} {
	let count = 0;
	let first: number | undefined;
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			if (first === undefined) first = i;
			count++;
		}
	}
	return first === undefined ? {count} : {count, first};
}

/* ------------------------------------------------------------------------ */
/* Vanilla preset                                                           */
/* ------------------------------------------------------------------------ */

describe('Vanilla preset (fresh)', () => {
	it('is byte-identical to the bundled vanilla template', async () => {
		const out = await buildPreset('fresh');
		const a = await parseSav(VANILLA);
		const b = await parseSav(out);
		for (const name of [
			'profile',
			'deck_slots',
			'decks',
			'history',
			'footer',
		] as const) {
			expect(
				blockDiffs(a.blocks.get(name)!, b.blocks.get(name)!),
				`Block "${name}" must match vanilla template`,
			).toEqual({count: 0});
		}
	});

	it('preserves the starter sage card byte at 0x18d (Chen Qun owned)', async () => {
		const out = await buildPreset('fresh');
		const parsed = await parseSav(out);
		const profile = parsed.blocks.get('profile')!;
		expect(profile[0x1_8d]).toBe(0x31);
	});

	it('preserves the 0xFFFF "no title selected" sentinel at 0x458', async () => {
		const out = await buildPreset('fresh');
		const parsed = await parseSav(out);
		const profile = parsed.blocks.get('profile')!;
		expect(profile[0x4_58]).toBe(0xff);
		expect(profile[0x4_59]).toBe(0xff);
	});

	it('reads the player name from the unencrypted header', async () => {
		// vanilla.sav was created on a DS where the player named themselves ａａ.
		const template = new Uint8Array(VANILLA);
		const profile = await extractProfile(template);
		expect(profile.playerName).toBe('ａａ');
	});

	it('round-trips a Shift_JIS player name through replaceSave', async () => {
		const template = new Uint8Array(VANILLA);
		const profile = await extractProfile(template);
		profile.playerName = 'くくくくく♪';
		const rebuilt = await replaceSave(template, profile);
		const round = await extractProfile(rebuilt);
		expect(round.playerName).toBe('くくくくく♪');
	});

	it('clamps player names longer than 12 Shift_JIS bytes', async () => {
		const template = new Uint8Array(VANILLA);
		const profile = await extractProfile(template);
		// 7 full-width hiragana × 2 bytes = 14 bytes → last char dropped.
		profile.playerName = 'あいうえおかき';
		const rebuilt = await replaceSave(template, profile);
		const round = await extractProfile(rebuilt);
		expect(round.playerName).toBe('あいうえおか');
	});

	it('exposes Chen Qun as the only owned sage in the SaveProfile', async () => {
		const template = new Uint8Array(VANILLA);
		const profile = await extractProfile(template);
		// JSON-level — readSages should honor the sage-card region byte.
		expect(profile.sages.unlockAll ?? false).toBe(false);
		expect(profile.sages.sages['Chen Qun']?.unlocked).toBe(true);
		for (const otherName of [
			'Guo Jia',
			'Sima Yi',
			'Xun Yu',
			'Xun You',
			'Mi Zhu',
			'Zhuge Liang',
			'Zhou Yu',
			'Jia Xu',
		] as const) {
			expect(
				profile.sages.sages[otherName]?.unlocked,
				`${otherName} should NOT be unlocked in vanilla`,
			).toBe(false);
		}
	});
});

/* ------------------------------------------------------------------------ */
/* Starter preset                                                           */
/* ------------------------------------------------------------------------ */

describe('Starter preset', () => {
	let profile: Uint8Array;
	beforeAll(async () => {
		const out = await buildPreset('starter');
		profile = (await parseSav(out)).blocks.get('profile')!;
	});

	it('unlocks Normal + Hard difficulty (bits 6,7 of 0x455)', () => {
		expect(profile[0x4_55]! & 0xc0).toBe(0xc0);
	});

	it('unlocks all 6 chapters (bits 0-5 of 0x455)', () => {
		expect(profile[0x4_55]! & 0x3f).toBe(0x3f);
	});

	it('records no chapter completions (0x456 = 0)', () => {
		expect(profile[0x4_56]).toBe(0);
	});

	it('all 232 lord card bytes are 0x31 (1 copy each)', () => {
		for (let i = 0x52; i < 0x52 + 232; i++) {
			expect(profile[i], `card byte at 0x${i.toString(16)}`).toBe(0x31);
		}
	});

	it('all 24 sage card bytes are 0x31', () => {
		for (let i = 0x1_89; i < 0x1_89 + 24; i++) {
			expect(profile[i], `sage card byte at 0x${i.toString(16)}`).toBe(0x31);
		}
	});

	it('all 20 sage XP entries are unlocked at level 1', () => {
		for (let s = 1; s <= 20; s++) {
			const base = 0x1_a4 + s * 8;
			const level = profile[base]! | (profile[base + 1]! << 8);
			const flag = profile[base + 4]! | (profile[base + 5]! << 8);
			expect(level, `sage ${s} level`).toBe(1);
			expect(flag, `sage ${s} flag`).toBe(1);
		}
	});

	it('records no DUEL stage completions (0x24C-0x254 all zero)', () => {
		for (let i = 0x2_4c; i <= 0x2_54; i++) {
			expect(profile[i]).toBe(0);
		}
	});

	it('records no DUEL high scores (0x25C-0x2FB all zero)', () => {
		for (let i = 0x2_5c; i <= 0x2_fb; i++) {
			expect(profile[i]).toBe(0);
		}
	});

	it('records no tutorials done (0x42c = 0)', () => {
		expect(profile[0x4_2c]).toBe(0);
	});

	it('records no title bits set (0x445-0x452 all zero)', () => {
		for (let i = 0x4_45; i <= 0x4_52; i++) {
			expect(profile[i]).toBe(0);
		}
	});

	it('records no campaign-event-gallery bits set (0x1C-0x3B all zero)', () => {
		for (let i = 0x1c; i <= 0x3b; i++) {
			expect(profile[i]).toBe(0);
		}
	});

	it('records no Episode-3 completion bits (0x3C-0x43 all zero)', () => {
		for (let i = 0x3c; i <= 0x43; i++) {
			expect(profile[i]).toBe(0);
		}
	});

	it('food remains at the 100 starter currency', () => {
		const food =
			profile[0x18]! |
			(profile[0x19]! << 8) |
			(profile[0x1a]! << 16) |
			(profile[0x1b]! << 24);
		expect(food).toBe(100);
	});

	it('non-profile blocks match the vanilla template', async () => {
		const out = await buildPreset('starter');
		const a = await parseSav(VANILLA);
		const b = await parseSav(out);
		for (const name of ['deck_slots', 'decks', 'history', 'footer'] as const) {
			expect(
				blockDiffs(a.blocks.get(name)!, b.blocks.get(name)!).count,
				`Block "${name}"`,
			).toBe(0);
		}
	});
});

/* ------------------------------------------------------------------------ */
/* Full preset                                                              */
/* ------------------------------------------------------------------------ */

describe('Full preset', () => {
	let profile: Uint8Array;
	beforeAll(async () => {
		const out = await buildPreset('full');
		profile = (await parseSav(out)).blocks.get('profile')!;
	});

	it('sets every difficulty + chapter unlock bit (0x455 = 0xFF)', () => {
		expect(profile[0x4_55]).toBe(0xff);
	});

	it('marks every chapter as completed (0x456 = 0x3F = bits 0-5)', () => {
		expect(profile[0x4_56]).toBe(0x3f);
	});

	it('all 232 lord card bytes are 0x31', () => {
		for (let i = 0x52; i < 0x52 + 232; i++) {
			expect(profile[i]).toBe(0x31);
		}
	});

	it('all 20 sage XP entries are level 20 with flag set', () => {
		for (let s = 1; s <= 20; s++) {
			const base = 0x1_a4 + s * 8;
			const level = profile[base]! | (profile[base + 1]! << 8);
			const flag = profile[base + 4]! | (profile[base + 5]! << 8);
			expect(level, `sage ${s} level`).toBe(20);
			expect(flag, `sage ${s} flag`).toBe(1);
		}
	});

	it('marks all 80 DUEL stages completed (0x24C-0x254)', () => {
		// 80 bits across 3 DWORDs; first 2 fully set, third has 16 bits set.
		expect(profile[0x2_4c]).toBe(0xff);
		expect(profile[0x2_50]).toBe(0xff);
		// Bits 64-79 → second WORD of the third DWORD
		expect(profile[0x2_54]).toBe(0xff);
		expect(profile[0x2_55]).toBe(0xff);
	});

	it('writes 40_000 to every DUEL high score slot', () => {
		for (let deckNo = 2; deckNo <= 81; deckNo++) {
			const off = 0x2_5c + (deckNo - 2) * 2;
			const score = profile[off]! | (profile[off + 1]! << 8);
			expect(score, `DUEL deck ${deckNo} high score`).toBe(40_000);
		}
	});

	it('sets every tutorial complete (0x42c bits 0-3)', () => {
		expect(profile[0x4_2c]! & 0x0f).toBe(0x0f);
	});

	it('floods title bitmask (0x445-0x451 = 0xFF, 0x452 = 0x3F)', () => {
		for (let i = 0x4_45; i <= 0x4_51; i++) expect(profile[i]).toBe(0xff);
		expect(profile[0x4_52]).toBe(0x3f);
	});

	it('floods campaign-event-gallery (0x1C-0x3A = 0xFF, 0x3B = 0x07)', () => {
		for (let i = 0x1c; i <= 0x3a; i++) expect(profile[i]).toBe(0xff);
		expect(profile[0x3b]).toBe(0x07);
	});

	it('floods Episode-3 completion bits (0x3C-0x43 = 0xFF)', () => {
		for (let i = 0x3c; i <= 0x43; i++) expect(profile[i]).toBe(0xff);
	});

	it('caps food at 9999 (0x18-0x1B = little-endian 9999)', () => {
		const food =
			profile[0x18]! |
			(profile[0x19]! << 8) |
			(profile[0x1a]! << 16) |
			(profile[0x1b]! << 24);
		expect(food).toBe(9999);
	});

	it('caps every mastery skill at 999 (0x44-0x52)', () => {
		for (const off of [0x44, 0x46, 0x48, 0x4a, 0x4c, 0x4e, 0x50]) {
			const v = profile[off]! | (profile[off + 1]! << 8);
			expect(v, `mastery at 0x${off.toString(16)}`).toBe(999);
		}
	});
});

/* ------------------------------------------------------------------------ */
/* Upload round-trip                                                        */
/* ------------------------------------------------------------------------ */

describe('Upload round-trip', () => {
	it('parsing and re-writing the vanilla template yields 0 byte diffs', async () => {
		const original = new Uint8Array(VANILLA);
		const profile = await extractProfile(original);
		const rebuilt = await replaceSave(original, profile);
		const a = await parseSav(original);
		const b = await parseSav(rebuilt);
		for (const name of [
			'profile',
			'deck_slots',
			'decks',
			'history',
			'footer',
		] as const) {
			expect(
				blockDiffs(a.blocks.get(name)!, b.blocks.get(name)!).count,
				`Block "${name}"`,
			).toBe(0);
		}
	});

	it('every preset produces a save that re-uploads back to the same profile shape', async () => {
		for (const preset of ['fresh', 'starter', 'full'] as const) {
			const generated = await buildPreset(preset);
			const reExtracted = await extractProfile(generated);
			// At least the easily-comparable scalars must round-trip
			expect(typeof reExtracted.stats.food).toBe('number');
			expect(typeof reExtracted.campaign.chapters.chapter1.unlocked).toBe(
				'boolean',
			);
			expect(typeof reExtracted.training.normalUnlocked).toBe('boolean');
			// Re-running replaceSave on the generated save must converge (no drift)
			const second = await replaceSave(generated, reExtracted);
			const a = await parseSav(generated);
			const b = await parseSav(second);
			for (const name of [
				'profile',
				'deck_slots',
				'decks',
				'history',
				'footer',
			] as const) {
				expect(
					blockDiffs(a.blocks.get(name)!, b.blocks.get(name)!).count,
					`${preset}: block "${name}" must be stable across two writes`,
				).toBe(0);
			}
		}
	});
});
