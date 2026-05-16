/**
 * Every codec invariant we care about, run against the real
 * MelonDS-produced saves under __fixtures__/sav_name/.
 *
 * These are genuine game files: encrypted blocks, real game state,
 * actual player names. The suite verifies that the codec doesn't
 * corrupt anything when it doesn't know what it's looking at.
 *
 * The fixture directory is git-ignored. CI skips this suite when the
 * files aren't present; local devs with the fixtures get the full
 * coverage net.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
	applyPreset,
	extractProfile,
	readPlayerName,
	replaceSave,
} from '@/save-tools';
import {parseSav} from '@/save-tools/save-io';

const FIXTURE_DIR = path.resolve(import.meta.dirname, '__fixtures__/sav_name');

const FIXTURES: {file: string; expectedName: string}[] = [
	{file: 'kukukukukusong_osaka.sav', expectedName: 'くくくくく♪'},
	{file: 'miau_somewhereNEARtokyo.sav', expectedName: 'ｍｉａｕ'},
	{file: 'pacc_osaka.sav', expectedName: 'ｐａｃｃ'},
];

const haveFixtures = FIXTURES.every(c =>
	fs.existsSync(path.join(FIXTURE_DIR, c.file)),
);

function loadFixture(name: string): Uint8Array {
	return new Uint8Array(fs.readFileSync(path.join(FIXTURE_DIR, name)));
}

function blockDiffs(a: Uint8Array, b: Uint8Array): number {
	let n = 0;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
	return n;
}

const BLOCK_NAMES = [
	'profile',
	'deck_slots',
	'decks',
	'history',
	'footer',
] as const;

describe.skipIf(!haveFixtures)('Real-save codec invariants', () => {
	for (const f of FIXTURES) {
		describe(f.file, () => {
			it('player name decodes correctly', async () => {
				const buf = loadFixture(f.file);
				expect(readPlayerName(buf)).toBe(f.expectedName);
				const profile = await extractProfile(buf);
				expect(profile.playerName).toBe(f.expectedName);
			});

			it('parseSav decrypts every block (MD5 verified)', async () => {
				const buf = loadFixture(f.file);
				const parsed = await parseSav(buf);
				for (const name of BLOCK_NAMES) {
					expect(parsed.blocks.has(name), `block "${name}"`).toBe(true);
				}
			});

			it('round-trip: extractProfile → replaceSave preserves every byte', async () => {
				const buf = loadFixture(f.file);
				const profile = await extractProfile(buf);
				const rebuilt = await replaceSave(buf, profile);

				const before = await parseSav(buf);
				const after = await parseSav(rebuilt);
				for (const name of BLOCK_NAMES) {
					const a = before.blocks.get(name);
					const b = after.blocks.get(name);
					if (!(a && b)) throw new Error(`missing block ${name}`);
					expect(blockDiffs(a, b), `block "${name}" drift`).toBe(0);
				}

				// Header bytes 0x04-0x4F preserved (CRC at 0x00 and save count
				// at 0x44 are intentionally rewritten by buildSav).
				for (let i = 0x04; i < 0x44; i++) {
					expect(rebuilt[i], `header 0x${i.toString(16)}`).toBe(buf[i]);
				}
				for (let i = 0x48; i < 0x60; i++) {
					expect(rebuilt[i], `header 0x${i.toString(16)}`).toBe(buf[i]);
				}
			});

			it('double-write is stable (no drift on second pass)', async () => {
				const buf = loadFixture(f.file);
				const profile = await extractProfile(buf);
				const first = await replaceSave(buf, profile);
				const profile2 = await extractProfile(first);
				const second = await replaceSave(first, profile2);

				const a = await parseSav(first);
				const b = await parseSav(second);
				for (const name of BLOCK_NAMES) {
					const x = a.blocks.get(name);
					const y = b.blocks.get(name);
					if (!(x && y)) throw new Error(`missing block ${name}`);
					expect(blockDiffs(x, y), `block "${name}" drift`).toBe(0);
				}
			});

			for (const preset of ['fresh', 'starter', 'full'] as const) {
				it(`preset "${preset}" applied to this save still re-extracts cleanly`, async () => {
					const buf = loadFixture(f.file);
					const profile = await extractProfile(buf);
					const transformed =
						preset === 'fresh' ? profile : applyPreset(profile, preset);
					const out = await replaceSave(buf, transformed);
					// Extract again — should not throw, and the player name
					// (which we just edited via applyPreset only via shape
					// not text) should survive.
					const back = await extractProfile(out);
					expect(back.playerName).toBe(f.expectedName);
				});
			}

			it('changing only the player name preserves every other byte', async () => {
				const buf = loadFixture(f.file);
				const profile = await extractProfile(buf);
				profile.playerName = 'ｔｅｓｔ';
				const rebuilt = await replaceSave(buf, profile);

				// All five decrypted blocks should match — only the header
				// changes, and only in the name + CRC + save-count regions.
				const a = await parseSav(buf);
				const b = await parseSav(rebuilt);
				for (const name of BLOCK_NAMES) {
					const x = a.blocks.get(name);
					const y = b.blocks.get(name);
					if (!(x && y)) throw new Error(`missing block ${name}`);
					expect(blockDiffs(x, y), `block "${name}" must not drift`).toBe(0);
				}

				// Header diffs limited to: name region (0x0C-0x17), save
				// count (0x44-0x47), file CRC (0x00-0x03).
				for (let i = 0; i < 0x80; i++) {
					if (i < 0x04) continue; // CRC
					if (i >= 0x0c && i < 0x18) continue; // name
					if (i >= 0x44 && i < 0x48) continue; // save count
					expect(rebuilt[i], `header 0x${i.toString(16)}`).toBe(buf[i]);
				}
			});
		});
	}

	it("cross-save: rewriting save A with save B's name produces matching name bytes", async () => {
		const a = loadFixture('kukukukukusong_osaka.sav');
		const b = loadFixture('miau_somewhereNEARtokyo.sav');
		const profileA = await extractProfile(a);
		const profileB = await extractProfile(b);
		profileA.playerName = profileB.playerName;
		const rebuilt = await replaceSave(a, profileA);
		for (let i = 0x0c; i < 0x18; i++) {
			expect(rebuilt[i], `name byte 0x${i.toString(16)}`).toBe(b[i]);
		}
	});
});

/* ======================================================================== */
/* Per-field bidirectional codec coverage                                   */
/* ======================================================================== */

describe.skipIf(!haveFixtures)('Per-field codec round-trip', () => {
	const BASE_FIXTURE = 'kukukukukusong_osaka.sav';

	async function withMutation(
		recipe: (profile: Awaited<ReturnType<typeof extractProfile>>) => void,
	): Promise<Awaited<ReturnType<typeof extractProfile>>> {
		const buf = loadFixture(BASE_FIXTURE);
		const profile = await extractProfile(buf);
		recipe(profile);
		const rebuilt = await replaceSave(buf, profile);
		return extractProfile(rebuilt);
	}

	it('stats: win/loss/draw counts persist for online + offline', async () => {
		const round = await withMutation(p => {
			p.stats.offline = {wins: 1234, losses: 567, draws: 89};
			p.stats.online = {wins: 4321, losses: 765, draws: 98};
		});
		expect(round.stats.offline).toEqual({wins: 1234, losses: 567, draws: 89});
		expect(round.stats.online).toEqual({wins: 4321, losses: 765, draws: 98});
	});

	it('stats: ranks (offline u32, online u16) persist', async () => {
		const round = await withMutation(p => {
			p.stats.offlineRank = 75_000;
			p.stats.onlineRank = 9876;
		});
		expect(round.stats.offlineRank).toBe(75_000);
		expect(round.stats.onlineRank).toBe(9876);
	});

	it('stats: food (u32) persists', async () => {
		const round = await withMutation(p => {
			p.stats.food = 5432;
		});
		expect(round.stats.food).toBe(5432);
	});

	it('stats: every mastery skill (0–999) persists', async () => {
		const target = {
			cavalry: 111,
			spear: 222,
			bow: 333,
			defeat: 444,
			siege: 555,
			defense: 666,
			duel: 777,
		};
		const round = await withMutation(p => {
			p.stats.mastery = target;
		});
		expect(round.stats.mastery).toEqual(target);
	});

	it('training: normal/hard unlocks persist independently', async () => {
		const onlyNormal = await withMutation(p => {
			p.training.normalUnlocked = true;
			p.training.hardUnlocked = false;
		});
		expect(onlyNormal.training.normalUnlocked).toBe(true);
		expect(onlyNormal.training.hardUnlocked).toBe(false);

		const onlyHard = await withMutation(p => {
			p.training.normalUnlocked = false;
			p.training.hardUnlocked = true;
		});
		expect(onlyHard.training.normalUnlocked).toBe(false);
		expect(onlyHard.training.hardUnlocked).toBe(true);
	});

	it('training: tutorial bits 1-4 persist independently', async () => {
		const round = await withMutation(p => {
			p.training.tutorials = {
				tutorial1: true,
				tutorial2: false,
				tutorial3: true,
				tutorial4: false,
			};
		});
		expect(round.training.tutorials).toEqual({
			tutorial1: true,
			tutorial2: false,
			tutorial3: true,
			tutorial4: false,
		});
	});

	it('training: DUEL stage completion + high score persists for a specific stage', async () => {
		const round = await withMutation(p => {
			p.training.stages['Easy-01'] = {completed: true, highScore: 32_768};
			p.training.stages['Hard-20'] = {completed: true, highScore: 40_000};
		});
		expect(round.training.stages['Easy-01']).toEqual({
			completed: true,
			highScore: 32_768,
		});
		expect(round.training.stages['Hard-20']).toEqual({
			completed: true,
			highScore: 40_000,
		});
	});

	it('campaign: chapter unlock + completion bits persist', async () => {
		const round = await withMutation(p => {
			p.campaign.chapters.chapter1.unlocked = true;
			p.campaign.chapters.chapter1.stage1Completed = true;
			p.campaign.chapters.chapter1.stage2Completed = true;
			p.campaign.chapters.chapter1.stage3Completed = true;
			p.campaign.chapters.chapter1.rewardCardObtained = true;
			p.campaign.chapters.chapter4.unlocked = true;
			p.campaign.chapters.chapter6.unlocked = true;
		});
		expect(round.campaign.chapters.chapter1.unlocked).toBe(true);
		expect(round.campaign.chapters.chapter1.stage1Completed).toBe(true);
		expect(round.campaign.chapters.chapter4.unlocked).toBe(true);
		expect(round.campaign.chapters.chapter6.unlocked).toBe(true);
		expect(round.campaign.chapters.chapter2.unlocked).toBe(false);
		expect(round.campaign.chapters.chapter3.unlocked).toBe(false);
	});

	it('cards: setting quantities round-trips at byte level', async () => {
		const round = await withMutation(p => {
			p.cards = {
				cards: {
					'Wei-008': {quantity: 3, name: 'Xiahou Yuan'},
					'Shu-001': {quantity: 7, name: 'Yu Jin'},
				},
			};
		});
		expect(round.cards.unlockAll ?? false).toBe(false);
		expect(round.cards.cards['Wei-008']?.quantity).toBe(3);
		expect(round.cards.cards['Shu-001']?.quantity).toBe(7);
	});

	it('cards: unlockAll shorthand persists and the card region reflects it', async () => {
		const round = await withMutation(p => {
			p.cards = {unlockAll: true, cards: {}};
		});
		expect(round.cards.unlockAll).toBe(true);
	});

	it('sages: per-sage level + unlocked state persists', async () => {
		const round = await withMutation(p => {
			p.sages = {
				sages: {
					'Chen Qun': {unlocked: true, level: 12},
					'Guo Jia': {unlocked: true, level: 20},
					'Sima Yi': {unlocked: false, level: 1},
					'Xun Yu': {unlocked: false, level: 1},
					'Xun You': {unlocked: false, level: 1},
					'Mi Zhu': {unlocked: false, level: 1},
					'Zhuge Liang': {unlocked: false, level: 1},
					'Pang Tong': {unlocked: false, level: 1},
					'Ma Su': {unlocked: false, level: 1},
					'Fa Zheng': {unlocked: false, level: 1},
					'Zhou Yu': {unlocked: false, level: 1},
					'Zhang Zhao': {unlocked: false, level: 1},
					'Lu Meng': {unlocked: false, level: 1},
					'Lu Su': {unlocked: false, level: 1},
					'Lu Xun': {unlocked: false, level: 1},
					'Mi Heng': {unlocked: false, level: 1},
					'Jia Xu': {unlocked: false, level: 1},
					'Zhang Jiao': {unlocked: false, level: 1},
					'Chen Gong': {unlocked: false, level: 1},
					'Li Ru': {unlocked: false, level: 1},
				},
			};
		});
		expect(round.sages.sages['Chen Qun']?.level).toBe(12);
		expect(round.sages.sages['Chen Qun']?.unlocked).toBe(true);
		expect(round.sages.sages['Guo Jia']?.level).toBe(20);
		expect(round.sages.sages['Sima Yi']?.unlocked).toBe(false);
	});

	it('achievements: titlesUnlocked all/none transitions', async () => {
		const allOn = await withMutation(p => {
			p.achievements.titlesUnlocked = 'all';
		});
		expect(allOn.achievements.titlesUnlocked).toBe('all');

		const allOff = await withMutation(p => {
			p.achievements.titlesUnlocked = 'none';
		});
		expect(allOff.achievements.titlesUnlocked).toBe('none');
	});

	it('achievements: campaignEventsUnlocked + episodeCompletion are independent', async () => {
		const both = await withMutation(p => {
			p.achievements.campaignEventsUnlocked = 'all';
			p.achievements.episodeCompletion = 'all';
		});
		expect(both.achievements.campaignEventsUnlocked).toBe('all');
		expect(both.achievements.episodeCompletion).toBe('all');

		const eventsOnly = await withMutation(p => {
			p.achievements.campaignEventsUnlocked = 'all';
			p.achievements.episodeCompletion = 'none';
		});
		expect(eventsOnly.achievements.campaignEventsUnlocked).toBe('all');
		expect(eventsOnly.achievements.episodeCompletion).toBe('none');
	});

	it('achievements: selectedTitle index persists (1-110 UI / 0-109 internal)', async () => {
		const round = await withMutation(p => {
			p.achievements.titlesUnlocked = 'all';
			p.achievements.selectedTitle = 42;
		});
		expect(round.achievements.selectedTitle).toBe(42);
	});
});
