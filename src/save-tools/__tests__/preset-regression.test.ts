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
			'account',
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
		// vanilla.sav ships with player name Ｓｉｒ. The DS save was created with
		// ａａ; we re-headered it via the codec (refreshing MD5+CRC) so editor
		// new-saves start as 'Sir'.
		const template = new Uint8Array(VANILLA);
		const profile = await extractProfile(template);
		expect(profile.playerName).toBe('Ｓｉｒ');
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

	it('lists 第二章..第六章 and 戦乱 (bits 0-5 of 0x455)', () => {
		expect(profile[0x4_55]! & 0x3f).toBe(0x3f);
	});

	it('offers stage III of every chapter (0x456 bits 0-5)', () => {
		expect(profile[0x4_56]).toBe(0x3f);
	});

	it('writes the pending copies too (0x453 = 0xFF, 0x454 = 0x3F)', () => {
		expect(profile[0x4_53]).toBe(0xff);
		expect(profile[0x4_54]).toBe(0x3f);
	});

	it('opens every scenario in the keep part with 0 clears', async () => {
		const out = await buildPreset('starter');
		const history = (await parseSav(out)).blocks.get('history')!;
		const view = new DataView(history.buffer, history.byteOffset);
		for (let s = 0; s < 20; s++) {
			expect(view.getInt16(0x58_90 + s * 2, true), `scenario ${s}`).toBe(0);
			expect(view.getUint32(0x58_b8 + s * 4, true)).toBe(5000);
		}
		expect(history[0x59_08]).toBe(1);
	});

	it('all 232 lord card bytes are 0x31 (1 copy each)', () => {
		for (let i = 0x52; i < 0x52 + 232; i++) {
			expect(profile[i], `card byte at 0x${i.toString(16)}`).toBe(0x31);
		}
	});

	// Sage i (STAFFCARD record i) owns byte 0x18C + i. Slot 0 is the 軍師
	// placeholder record and 21-23 have no record: they stay as the template
	// has them, like the 3 card slots 0x189..0x18B before them.
	it('the 20 sage card bytes (0x18D..0x1A0) are 0x31, the rest untouched', () => {
		for (let i = 1; i <= 20; i++) {
			const at = 0x1_8c + i;
			expect(profile[at], `sage card byte at 0x${at.toString(16)}`).toBe(0x31);
		}
		for (const at of [0x1_89, 0x1_8a, 0x1_8b, 0x1_8c, 0x1_a1, 0x1_a2, 0x1_a3]) {
			expect(profile[at], `byte at 0x${at.toString(16)}`).toBe(0);
		}
	});

	it('all 20 sage records are unlocked at level 1', () => {
		for (let s = 1; s <= 20; s++) {
			const base = 0x1_a4 + s * 8;
			const level = profile[base]!;
			const battles = new DataView(profile.buffer).getInt32(
				profile.byteOffset + base + 4,
				true,
			);
			expect(level, `sage ${s} level`).toBe(1);
			// The preset gives each sage it unlocks 1 battle (+4, s32). Chen
			// Qun (1) is already owned in the template, so his row is kept.
			expect(battles, `sage ${s} battles`).toBe(s === 1 ? 0 : 1);
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

	it('gold remains at the 100 starter currency (0x14)', () => {
		const gold =
			profile[0x14]! |
			(profile[0x15]! << 8) |
			(profile[0x16]! << 16) |
			(profile[0x17]! << 24);
		expect(gold).toBe(100);
	});

	it('records no DUEL Normal/Hard cleared bits (0x2EC + 0x38C masks zero)', () => {
		for (let i = 0; i < 5; i++) expect(profile[0x2_ec + i]).toBe(0);
		for (let i = 0; i < 3; i++) expect(profile[0x3_8c + i]).toBe(0);
	});

	it('unlocks every troop colour for the starter menu (0x42D = 0xFF)', () => {
		expect(profile[0x4_2d]).toBe(0xff);
		expect(profile[0x4_2e]! & 0x01).toBe(0x01);
	});

	it('non-profile blocks match the vanilla template, but the keep states', async () => {
		const out = await buildPreset('starter');
		const a = await parseSav(VANILLA);
		const b = await parseSav(out);
		for (const name of ['deck_slots', 'account', 'footer'] as const) {
			expect(
				blockDiffs(a.blocks.get(name)!, b.blocks.get(name)!).count,
				`Block "${name}"`,
			).toBe(0);
		}
		// Scenarios 3..18 go from -1 (0xFFFF) to 0: 32 bytes at 0x5896..0x58B5.
		const diff = blockDiffs(a.blocks.get('history')!, b.blocks.get('history')!);
		expect(diff).toEqual({count: 32, first: 0x58_96});
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

	it('offers stage III of every chapter (0x456 = 0x3F = bits 0-5)', () => {
		expect(profile[0x4_56]).toBe(0x3f);
	});

	it('records one clear of every scenario but the prologue', async () => {
		const out = await buildPreset('full');
		const history = (await parseSav(out)).blocks.get('history')!;
		const view = new DataView(history.buffer, history.byteOffset);
		for (let s = 0; s < 19; s++) {
			expect(view.getInt16(0x58_90 + s * 2, true), `scenario ${s}`).toBe(1);
		}
		expect(view.getInt16(0x58_90 + 19 * 2, true)).toBe(0);
	});

	it('all 232 lord card bytes are 0x31', () => {
		for (let i = 0x52; i < 0x52 + 232; i++) {
			expect(profile[i]).toBe(0x31);
		}
	});

	it('all 20 sage records are level 20 with 1 battle, all 20 owned', () => {
		for (let s = 1; s <= 20; s++) {
			const base = 0x1_a4 + s * 8;
			const level = profile[base]!;
			const battles = new DataView(profile.buffer).getInt32(
				profile.byteOffset + base + 4,
				true,
			);
			expect(level, `sage ${s} level`).toBe(20);
			expect(battles, `sage ${s} battles`).toBe(1);
			expect(profile[0x1_8c + s], `sage ${s} card byte`).toBe(0x31);
		}
	});

	it('marks all 20 Easy DUEL stages cleared (0x24C bits 0-19) + copy at 0x254', () => {
		// Easy cleared bitmask: 20 bits at 0x24C, mirrored at +0x08 (0x254).
		expect(profile[0x2_4c]).toBe(0xff);
		expect(profile[0x2_4d]).toBe(0xff);
		expect(profile[0x2_4e]! & 0x0f).toBe(0x0f);
		expect(profile[0x2_54]).toBe(0xff);
		expect(profile[0x2_55]).toBe(0xff);
		expect(profile[0x2_56]! & 0x0f).toBe(0x0f);
	});

	it('marks all 40 Normal DUEL stages cleared (0x2EC bits 0-39) + copy at 0x2F4', () => {
		// Normal cleared bitmask: 40 bits (5 bytes) at 0x2EC, mirrored at 0x2F4.
		for (let i = 0; i < 5; i++) {
			expect(profile[0x2_ec + i], `Normal cleared byte ${i}`).toBe(0xff);
			expect(profile[0x2_f4 + i], `Normal cleared copy byte ${i}`).toBe(0xff);
		}
	});

	it('marks all 20 Hard DUEL stages cleared (0x38C bits 0-19) + copy at 0x394', () => {
		expect(profile[0x3_8c]).toBe(0xff);
		expect(profile[0x3_8d]).toBe(0xff);
		expect(profile[0x3_8e]! & 0x0f).toBe(0x0f);
		expect(profile[0x3_94]).toBe(0xff);
		expect(profile[0x3_95]).toBe(0xff);
		expect(profile[0x3_96]! & 0x0f).toBe(0x0f);
	});

	it('writes 40_000 to every Easy DUEL high score slot (0x25C-0x283)', () => {
		for (let i = 0; i < 20; i++) {
			const off = 0x2_5c + i * 2;
			const score = profile[off]! | (profile[off + 1]! << 8);
			expect(score, `Easy stage ${i + 1} high score`).toBe(40_000);
		}
	});

	it('writes 40_000 to every Normal DUEL high score slot (0x2FC-0x34B)', () => {
		for (let i = 0; i < 40; i++) {
			const off = 0x2_fc + i * 2;
			const score = profile[off]! | (profile[off + 1]! << 8);
			expect(score, `Normal stage ${i + 1} high score`).toBe(40_000);
		}
	});

	it('writes 40_000 to every Hard DUEL high score slot (0x39C-0x3C3)', () => {
		for (let i = 0; i < 20; i++) {
			const off = 0x3_9c + i * 2;
			const score = profile[off]! | (profile[off + 1]! << 8);
			expect(score, `Hard stage ${i + 1} high score`).toBe(40_000);
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

	it('caps gold currency at 9999 (0x14-0x17 = little-endian 9999)', () => {
		const gold =
			profile[0x14]! |
			(profile[0x15]! << 8) |
			(profile[0x16]! << 16) |
			(profile[0x17]! << 24);
		expect(gold).toBe(9999);
	});

	it('unlocks every troop colour (0x42D = 0xFF, 0x42E bit0 = white)', () => {
		expect(profile[0x4_2d]).toBe(0xff);
		expect(profile[0x4_2e]! & 0x01).toBe(0x01);
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
			'account',
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
			expect(typeof reExtracted.campaign.chapters.chapter1.listed).toBe(
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
				'account',
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
