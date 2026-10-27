/**
 * The card ownership byte is a bit field (arm9 0x02034FE0..0x020350A8):
 * bits 0-3 = copies, bit 4 = obtained (set with any count > 0, never
 * cleared), bit 5 = set by the post-drill draw and the deck editor. The
 * game's own 0x31..0x39 are 0x30 | n; a byte 0x10 | n is n copies as well.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
	CARD_ID_TO_NO,
	CARD_TABLE,
	extractProfile,
	readProfile,
	replaceSave,
	SAGE_CARD_OFFSET,
	writeProfile,
} from '@/save-tools';
import {buildSav, parseSav} from '@/save-tools/save-io';

const VANILLA = new Uint8Array(
	fs.readFileSync(
		path.resolve(import.meta.dirname, '../../../public/data/vanilla.sav'),
	),
);

const CARD_BASE = 0x52;
const SAGE_CARD_BASE = 0x1_8c;

async function vanillaProfileBytes(): Promise<Uint8Array> {
	const parsed = await parseSav(VANILLA);
	const block = parsed.blocks.get('profile');
	if (!block) throw new Error('no profile block');
	return new Uint8Array(block);
}

function cardAt(id: string): number {
	const no = CARD_ID_TO_NO[id];
	if (no === undefined) throw new Error(`no card ${id}`);
	return CARD_BASE + no;
}

describe('card ownership byte', () => {
	it('reads the count from the low nibble and keeps the flags', async () => {
		const buf = await vanillaProfileBytes();
		buf[cardAt('Wei-001')] = 0x13;
		buf[cardAt('Wei-002')] = 0x32;
		buf[cardAt('Wei-003')] = 0x10;
		const {cards} = readProfile(buf).cards;
		expect(cards['Wei-001']).toMatchObject({flags: 0x10, quantity: 3});
		expect(cards['Wei-002']).toMatchObject({flags: 0x30, quantity: 2});
		// 0 copies, still obtained: listed with quantity 0.
		expect(cards['Wei-003']).toMatchObject({flags: 0x10, quantity: 0});
	});

	it('changes only the count and keeps the flag bits', async () => {
		const buf = await vanillaProfileBytes();
		buf[cardAt('Wei-001')] = 0x13;
		buf[cardAt('Wei-002')] = 0x31;
		const profile = readProfile(buf);
		const cards = profile.cards.cards;
		if (!(cards['Wei-001'] && cards['Wei-002'])) throw new Error('missing');
		cards['Wei-001'].quantity = 5;
		cards['Wei-002'].quantity = 0;
		const out = writeProfile(profile, buf);
		expect(out[cardAt('Wei-001')]).toBe(0x15);
		expect(out[cardAt('Wei-002')]).toBe(0x30);
	});

	it('keeps the flags of a card the profile drops (0 copies)', async () => {
		const buf = await vanillaProfileBytes();
		buf[cardAt('Wei-001')] = 0x12;
		const profile = readProfile(buf);
		const entries = Object.entries(profile.cards.cards);
		profile.cards = {
			cards: Object.fromEntries(entries.filter(([id]) => id !== 'Wei-001')),
		};
		expect(writeProfile(profile, buf)[cardAt('Wei-001')]).toBe(0x10);
	});

	it('writes a new card as 0x30 | n, like a draw', async () => {
		const buf = await vanillaProfileBytes();
		expect(buf[cardAt('Wei-004')]).toBe(0x00);
		const profile = readProfile(buf);
		profile.cards.cards['Wei-004'] = {quantity: 2};
		expect(writeProfile(profile, buf)[cardAt('Wei-004')]).toBe(0x32);
	});

	it('round-trips 0x1n / 0x3n / flag-only bytes byte for byte', async () => {
		const parsed = await parseSav(VANILLA);
		const block = parsed.blocks.get('profile');
		if (!block) throw new Error('no profile block');
		const bytes = [0x11, 0x19, 0x32, 0x10, 0x30, 0x20];
		for (const [i, b] of bytes.entries()) {
			const card = CARD_TABLE[10 + i];
			if (card) block[CARD_BASE + card.no] = b;
		}
		const sav = await buildSav(parsed.header, parsed.blocks, parsed.rawSav);
		const rebuilt = await replaceSave(sav, await extractProfile(sav));
		const after = (await parseSav(rebuilt)).blocks.get('profile');
		expect(after).toEqual(block);
	});

	it('keeps the unlockAll shorthand for an all-0x31 region only', async () => {
		const buf = await vanillaProfileBytes();
		for (const card of CARD_TABLE) buf[CARD_BASE + card.no] = 0x31;
		expect(readProfile(buf).cards.unlockAll).toBe(true);
		// One card with 2 copies: explicit, so its count is shown and kept.
		buf[cardAt('Wei-001')] = 0x32;
		const cards = readProfile(buf).cards;
		expect(cards.unlockAll ?? false).toBe(false);
		expect(cards.cards['Wei-001']?.quantity).toBe(2);
		expect(writeProfile(readProfile(buf), buf)).toEqual(buf);
	});

	it('reads a sage card byte 0x10 | n as owned', async () => {
		const buf = await vanillaProfileBytes();
		const off = SAGE_CARD_OFFSET['Guo Jia'];
		if (off === undefined) throw new Error('no offset');
		expect(readProfile(buf).sages.sages['Guo Jia']?.unlocked).toBe(false);
		buf[SAGE_CARD_BASE + off] = 0x11;
		const profile = readProfile(buf);
		expect(profile.sages.sages['Guo Jia']?.unlocked).toBe(true);
		// Writing it back unchanged keeps the byte.
		expect(writeProfile(profile, buf)[SAGE_CARD_BASE + off]).toBe(0x11);
	});
});
