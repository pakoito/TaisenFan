/**
 * Round-trip tests for upload-style flows.
 *
 * The two regressions these catch:
 *  1. Vanilla template must round-trip byte-perfect (no codec drift).
 *  2. Partial title / event-gallery / episode-completion bitmasks must
 *     survive a write so uploaded mid-game saves don't lose progress.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
	applyPreset,
	defaultProfile,
	extractProfile,
	readProfile,
	replaceSave,
	writeProfile,
} from '@/save-tools';
import {parseSav} from '@/save-tools/save-io';

const VANILLA_TEMPLATE = path.resolve(
	import.meta.dirname,
	'../../../public/data/vanilla.sav',
);

function blockDiffs(a: Uint8Array, b: Uint8Array): number {
	let d = 0;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
	return d;
}

describe('vanilla template round-trip', () => {
	it('parse → write back unchanged keeps every block byte-identical', async () => {
		const original = new Uint8Array(fs.readFileSync(VANILLA_TEMPLATE));
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
			const x = a.blocks.get(name);
			const y = b.blocks.get(name);
			if (!(x && y)) throw new Error(`Missing block ${name}`);
			expect(blockDiffs(x, y)).toBe(0);
		}
	});

	it('extracts vanilla state correctly (no chapters open, no titles, food=100)', async () => {
		const original = new Uint8Array(fs.readFileSync(VANILLA_TEMPLATE));
		const profile = await extractProfile(original);
		expect(profile.stats.food).toBe(100);
		expect(profile.campaign.chapters.chapter1.unlocked).toBe(false);
		expect(profile.training.normalUnlocked).toBe(false);
		expect(profile.achievements.titlesUnlocked).toBe('none');
		expect(profile.achievements.campaignEventsUnlocked).toBe('none');
		expect(profile.achievements.episodeCompletion).toBe('none');
		expect(profile.achievements.titlesRaw).toBeUndefined();
	});
});

describe('partial bitmask preservation', () => {
	/** Build a synthetic profile binary with a "5 titles earned" bitmask. */
	function makePartialTitlesProfile(): Uint8Array {
		const base = writeProfile(defaultProfile());
		// Set 5 individual title bits in the 14-byte region at 0x445-0x452.
		// Pattern: 0x07 in byte 0 (titles 0,1,2) and 0x03 in byte 1 (titles 8,9).
		base[0x4_45] = 0x07;
		base[0x4_46] = 0x03;
		return base;
	}

	function makePartialEventsProfile(): Uint8Array {
		const base = writeProfile(defaultProfile());
		// One byte mid-region — partial state, not 'all' or 'none'.
		base[0x1c] = 0x55;
		return base;
	}

	it('reads a partial title bitmask as "partial" and exposes the raw bytes', () => {
		const profile = readProfile(makePartialTitlesProfile());
		expect(profile.achievements.titlesUnlocked).toBe('partial');
		expect(profile.achievements.titlesRaw).toBeDefined();
		expect(profile.achievements.titlesRaw?.length).toBe(14);
		expect(profile.achievements.titlesRaw?.[0]).toBe(0x07);
		expect(profile.achievements.titlesRaw?.[1]).toBe(0x03);
	});

	it('round-trips a partial title bitmask byte-perfect', () => {
		const before = makePartialTitlesProfile();
		const profile = readProfile(before);
		const after = writeProfile(profile, before);
		for (let i = 0x4_45; i <= 0x4_52; i++) {
			expect(after[i]).toBe(before[i]);
		}
	});

	it('round-trips a partial event-gallery bitmask byte-perfect', () => {
		const before = makePartialEventsProfile();
		const profile = readProfile(before);
		const after = writeProfile(profile, before);
		for (let i = 0x1c; i <= 0x3b; i++) {
			expect(after[i]).toBe(before[i]);
		}
	});

	it('flipping titles to "all" overwrites the raw bits with 0xFF / 0x3F', () => {
		const before = makePartialTitlesProfile();
		const profile = readProfile(before);
		profile.achievements.titlesUnlocked = 'all';
		const after = writeProfile(profile, before);
		for (let i = 0x4_45; i < 0x4_52; i++) expect(after[i]).toBe(0xff);
		expect(after[0x4_52]).toBe(0x3f);
	});

	it('flipping titles back to "partial" restores the raw bits', () => {
		const before = makePartialTitlesProfile();
		const profile = readProfile(before);
		// Simulate the user toggling Switch on, then off again — the raw
		// bytes stay in the profile so we can restore them.
		profile.achievements.titlesUnlocked = 'all';
		profile.achievements.titlesUnlocked = 'partial';
		const after = writeProfile(profile, before);
		for (let i = 0x4_45; i <= 0x4_52; i++) {
			expect(after[i]).toBe(before[i]);
		}
	});
});

describe('preset bitmask semantics', () => {
	it('starter preset leaves every bitmask region zeroed', () => {
		const profile = applyPreset(defaultProfile(), 'starter');
		expect(profile.achievements.titlesUnlocked).toBe('none');
		expect(profile.achievements.campaignEventsUnlocked).toBe('none');
		expect(profile.achievements.episodeCompletion).toBe('none');
	});

	it('full preset sets every bitmask region to "all"', () => {
		const profile = applyPreset(defaultProfile(), 'full');
		expect(profile.achievements.titlesUnlocked).toBe('all');
		expect(profile.achievements.campaignEventsUnlocked).toBe('all');
		expect(profile.achievements.episodeCompletion).toBe('all');
	});

	it('"full" writes the title region as 0xFF...0x3F', () => {
		const profile = applyPreset(defaultProfile(), 'full');
		const buf = writeProfile(profile);
		for (let i = 0x4_45; i < 0x4_52; i++) expect(buf[i]).toBe(0xff);
		expect(buf[0x4_52]).toBe(0x3f);
	});

	it('"none" writes selectedTitle as 0xFFFF (no-title sentinel)', () => {
		const profile = defaultProfile();
		const buf = writeProfile(profile);
		expect(buf[0x4_58]).toBe(0xff);
		expect(buf[0x4_59]).toBe(0xff);
	});
});
