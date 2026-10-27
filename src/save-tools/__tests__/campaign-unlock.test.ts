/**
 * 戦略ノ章 progress: what the scenario select reads (sgst-port
 * docs/modding/campaign-save.md §3, keep part) and how the editor writes it.
 *
 *  - The chapter list: profile 0x455 bits 0..5 (第二章..第六章, 戦乱), with
 *    the pending copy 0x453 the game's unlock notice copies from.
 *  - Stage III of chapter n: profile 0x456 bit n−1, pending copy 0x454.
 *  - Clear counts and best scores: the campaign block's keep part,
 *    H+0x5890 (s16[20], −1 never opened) and H+0x58B8 (u32[20]).
 */

import fs from 'node:fs';
import path from 'node:path';
import {
	CAMPAIGN,
	extractProfile,
	patchSave,
	readCampaign,
	replaceSave,
	setCampaignEntryListed,
} from '@/save-tools';
import {
	writeCampaignHistory,
	writeCampaignProfile,
} from '@/save-tools/campaign-codec';
import {crc32} from '@/save-tools/crc32';
import {getBlock} from '@/save-tools/crypto';
import {parseSav} from '@/save-tools/save-io';

const VANILLA = new Uint8Array(
	fs.readFileSync(
		path.resolve(import.meta.dirname, '../../../public/data/vanilla.sav'),
	),
);

const PROFILE_SIZE = getBlock('profile').size;
const HISTORY_SIZE = getBlock('history').size;

/** A keep part as the game initialises it (ov001 0x020F34D4). */
function freshHistory(): Uint8Array {
	const h = new Uint8Array(HISTORY_SIZE);
	const v = new DataView(h.buffer);
	for (let s = 0; s < 20; s++) {
		const open = s < 3 || s === 19;
		v.setInt16(CAMPAIGN.KEEP_STATE + s * 2, open ? 0 : -1, true);
		v.setUint32(CAMPAIGN.KEEP_BEST + s * 4, 5000, true);
	}
	h[CAMPAIGN.KEEP_INIT] = 1;
	return h;
}

function state(history: Uint8Array, s: number): number {
	return new DataView(history.buffer, history.byteOffset).getInt16(
		CAMPAIGN.KEEP_STATE + s * 2,
		true,
	);
}

function diffs(a: Uint8Array, b: Uint8Array): number[] {
	const out: number[] = [];
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) out.push(i);
	return out;
}

describe('readCampaign', () => {
	it('reads a fresh save: 第一章 listed, the rest locked', () => {
		const c = readCampaign(new Uint8Array(PROFILE_SIZE), freshHistory());
		expect(c.chapters.chapter1.listed).toBe(true);
		expect(c.chapters.chapter2.listed).toBe(false);
		expect(c.warringStates.listed).toBe(false);
		expect(c.chapters.chapter1.stage3).toBe(false);
		expect(c.chapters.chapter1.stages[2]).toEqual({
			clears: 0,
			bestScore: 5000,
		});
		expect(c.chapters.chapter2.stages[0]).toEqual({
			clears: null,
			bestScore: 5000,
		});
	});

	it('maps 0x455 bit c to 第(c+2)章 (bit 5: 戦乱) and 0x456 bit c to stage III of 第(c+1)章', () => {
		const p = new Uint8Array(PROFILE_SIZE);
		p[0x4_55] = 0b0010_0010; // 第三章, 戦乱
		p[0x4_56] = 0b0000_0100; // 第三章 stage III
		const c = readCampaign(p, freshHistory());
		expect(c.chapters.chapter2.listed).toBe(false);
		expect(c.chapters.chapter3.listed).toBe(true);
		expect(c.warringStates.listed).toBe(true);
		expect(c.chapters.chapter3.stage3).toBe(true);
		expect(c.chapters.chapter2.stage3).toBe(false);
	});

	it('ignores the DUEL bits 6/7 and the pending copies', () => {
		const p = new Uint8Array(PROFILE_SIZE);
		p[0x4_55] = 0xc0;
		p[0x4_53] = 0xff;
		p[0x4_54] = 0xff;
		const c = readCampaign(p, freshHistory());
		expect(c.warringStates.listed).toBe(false);
		expect(c.chapters.chapter6.listed).toBe(false);
		expect(c.chapters.chapter1.stage3).toBe(false);
	});

	it('reads the keep part as the game will use it when its init flag is 0', () => {
		const c = readCampaign(
			new Uint8Array(PROFILE_SIZE),
			new Uint8Array(HISTORY_SIZE),
		);
		expect(c.chapters.chapter1.stages[0]).toEqual({
			clears: 0,
			bestScore: 5000,
		});
		expect(c.chapters.chapter6.stages[0].clears).toBeNull();
	});
});

describe('setCampaignEntryListed', () => {
	it('lists every entry up to the one listed and opens their scenarios', () => {
		const c = readCampaign(new Uint8Array(PROFILE_SIZE), freshHistory());
		setCampaignEntryListed(c, 'chapter4', true);
		expect(c.chapters.chapter2.listed).toBe(true);
		expect(c.chapters.chapter3.listed).toBe(true);
		expect(c.chapters.chapter4.listed).toBe(true);
		expect(c.chapters.chapter5.listed).toBe(false);
		expect(c.chapters.chapter4.stages.map(s => s.clears)).toEqual([0, 0, 0]);
		expect(c.chapters.chapter5.stages[0].clears).toBeNull();
	});

	it('unlists every entry from the one unlisted on, as before its unlock', () => {
		const c = readCampaign(new Uint8Array(PROFILE_SIZE), freshHistory());
		setCampaignEntryListed(c, 'warringStates', true);
		c.chapters.chapter5.stage3 = true;
		c.chapters.chapter5.stages[0].clears = 4;
		c.chapters.chapter5.stages[0].bestScore = 9000;
		setCampaignEntryListed(c, 'chapter5', false);
		expect(c.chapters.chapter4.listed).toBe(true);
		expect(c.chapters.chapter5.listed).toBe(false);
		expect(c.chapters.chapter6.listed).toBe(false);
		expect(c.warringStates.listed).toBe(false);
		expect(c.chapters.chapter5.stage3).toBe(false);
		expect(c.chapters.chapter5.stages[0]).toEqual({
			clears: null,
			bestScore: 9000,
		});
		expect(c.warringStates.record.clears).toBeNull();
	});

	it('keeps 第一章 listed and its clears', () => {
		const c = readCampaign(new Uint8Array(PROFILE_SIZE), freshHistory());
		c.chapters.chapter1.stages[0].clears = 2;
		setCampaignEntryListed(c, 'chapter1', false);
		expect(c.chapters.chapter1.listed).toBe(true);
		expect(c.chapters.chapter1.stages[0].clears).toBe(2);
		expect(c.chapters.chapter2.listed).toBe(false);
	});
});

describe('writeCampaignProfile', () => {
	it('writes nothing for an untouched campaign', () => {
		const p = new Uint8Array(PROFILE_SIZE);
		p[0x4_53] = 0x05; // pending bits the notice has not shown yet
		p[0x4_55] = 0x41;
		p[0x4_56] = 0x80; // unused bit 15 of the array
		const before = new Uint8Array(p);
		writeCampaignProfile(p, readCampaign(p, freshHistory()));
		expect(diffs(before, p)).toEqual([]);
	});

	it('writes a changed list flag to 0x455 and its pending copy 0x453', () => {
		const p = new Uint8Array(PROFILE_SIZE);
		p[0x4_55] = 0xc0; // DUEL tabs stay
		const c = readCampaign(p, freshHistory());
		setCampaignEntryListed(c, 'chapter3', true);
		writeCampaignProfile(p, c);
		expect(p[0x4_55]).toBe(0xc3);
		expect(p[0x4_53]).toBe(0x03);

		setCampaignEntryListed(c, 'chapter2', false);
		writeCampaignProfile(p, c);
		expect(p[0x4_55]).toBe(0xc0);
		expect(p[0x4_53]).toBe(0x00);
	});

	it('writes stage III to 0x456 and its pending copy 0x454', () => {
		const p = new Uint8Array(PROFILE_SIZE);
		const c = readCampaign(p, freshHistory());
		c.chapters.chapter1.stage3 = true;
		c.chapters.chapter6.stage3 = true;
		writeCampaignProfile(p, c);
		expect(p[0x4_56]).toBe(0x21);
		expect(p[0x4_54]).toBe(0x21);
		expect(p[0x4_55]).toBe(0);
	});
});

describe('writeCampaignHistory', () => {
	it('writes nothing for untouched records', () => {
		const h = freshHistory();
		const before = new Uint8Array(h);
		writeCampaignHistory(h, readCampaign(new Uint8Array(PROFILE_SIZE), h));
		expect(diffs(before, h)).toEqual([]);
	});

	it('keeps a record the editor reads but cannot model (−2) when untouched', () => {
		const h = freshHistory();
		new DataView(h.buffer).setInt16(CAMPAIGN.KEEP_STATE + 10 * 2, -2, true);
		const before = new Uint8Array(h);
		writeCampaignHistory(h, readCampaign(new Uint8Array(PROFILE_SIZE), h));
		expect(diffs(before, h)).toEqual([]);
	});

	it('writes only the records that change', () => {
		const h = freshHistory();
		const c = readCampaign(new Uint8Array(PROFILE_SIZE), h);
		setCampaignEntryListed(c, 'chapter2', true);
		c.chapters.chapter1.stages[1].clears = 3;
		c.warringStates.record.bestScore = 70_000;
		const before = new Uint8Array(h);
		writeCampaignHistory(h, c);
		expect([0, 1, 3, 4, 5, 18].map(s => state(h, s))).toEqual([
			0, 3, 0, 0, 0, -1,
		]);
		expect(
			new DataView(h.buffer).getUint32(CAMPAIGN.KEEP_BEST + 18 * 4, true),
		).toBe(70_000);
		// s1 (1 byte: 0 → 3), s3..s5 (6 bytes: 0xFFFF → 0), best 18 (3 bytes:
		// 0x1388 → 0x11170).
		expect(diffs(before, h).length).toBe(10);
	});

	it('initialises a blank keep part (init flag 0) the way the game does', () => {
		const h = new Uint8Array(HISTORY_SIZE);
		const c = readCampaign(new Uint8Array(PROFILE_SIZE), h);
		c.chapters.chapter1.stages[0].clears = 1;
		writeCampaignHistory(h, c);
		expect(h[CAMPAIGN.KEEP_INIT]).toBe(1);
		expect(state(h, 0)).toBe(1);
		expect(state(h, 1)).toBe(0);
		expect(state(h, 3)).toBe(-1);
		expect(state(h, 19)).toBe(0);
		expect(
			new DataView(h.buffer).getUint32(CAMPAIGN.KEEP_BEST + 7 * 4, true),
		).toBe(5000);
	});

	it('leaves a blank keep part blank when nothing changes', () => {
		const h = new Uint8Array(HISTORY_SIZE);
		writeCampaignHistory(h, readCampaign(new Uint8Array(PROFILE_SIZE), h));
		expect(h.every(b => b === 0)).toBe(true);
	});
});

describe('a save edited through replaceSave', () => {
	it('lists a chapter in the profile and opens it in the campaign block, re-encrypted', async () => {
		const profile = await extractProfile(VANILLA);
		setCampaignEntryListed(profile.campaign, 'chapter2', true);
		profile.campaign.chapters.chapter2.stages[0].clears = 5;
		const out = await replaceSave(VANILLA, profile);

		const a = await parseSav(VANILLA);
		const b = await parseSav(out); // throws on a bad MD5
		const profileDiff = diffs(
			a.blocks.get('profile')!,
			b.blocks.get('profile')!,
		);
		expect(profileDiff).toEqual([0x4_53, 0x4_55]);
		const historyDiff = diffs(
			a.blocks.get('history')!,
			b.blocks.get('history')!,
		);
		// Scenarios 3, 4, 5: −1 → 5, 0, 0.
		expect(historyDiff).toEqual([
			0x58_96, 0x58_97, 0x58_98, 0x58_99, 0x58_9a, 0x58_9b,
		]);
		const history = b.blocks.get('history')!;
		expect([3, 4, 5].map(s => state(history, s))).toEqual([5, 0, 0]);

		// The block's CRC32 is over the whole padded block with its CRC zeroed.
		const block = getBlock('history');
		const raw = out.slice(block.offset, block.offset + block.allocSize);
		const crcAt = block.size + 16;
		const stored = new DataView(raw.buffer).getUint32(crcAt, true);
		raw.fill(0, crcAt, crcAt + 4);
		expect(crc32(raw) >>> 0).toBe(stored);

		// The other blocks keep their bytes.
		for (const name of ['deck_slots', 'account', 'footer'] as const) {
			const blk = getBlock(name);
			expect(
				diffs(
					VANILLA.slice(blk.offset, blk.offset + blk.allocSize),
					out.slice(blk.offset, blk.offset + blk.allocSize),
				),
			).toEqual([]);
		}

		const round = await extractProfile(out);
		expect(round.campaign).toEqual(profile.campaign);
	});

	it('patchSave writes keep-part records', async () => {
		const out = await patchSave(VANILLA, {
			campaign: {warringStates: {record: {clears: 0, bestScore: 12_345}}},
		});
		const round = await extractProfile(out);
		expect(round.campaign.warringStates.record).toEqual({
			clears: 0,
			bestScore: 12_345,
		});
		// The record alone does not list 戦乱: that is the profile flag.
		expect(round.campaign.warringStates.listed).toBe(false);
	});
});
