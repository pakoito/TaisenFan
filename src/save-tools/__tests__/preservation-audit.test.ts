/**
 * Region preservation audit.
 *
 * Builds a synthetic profile with non-zero bytes salted into every
 * "we don't model this" position (padding gaps, unused bits of bytes
 * we partially own, XP and trailing pad of every sage XP entry, the
 * unused upper 16 bits of the DUEL completion bitmask, etc.). A full
 * extract → replaceSave round-trip must preserve every salted byte.
 *
 * Each cell in `WHOLE_BYTE_WATCH` is a (offset, why-we-care) pair. Add
 * one any time a new "we don't model this" region is discovered, so
 * a future codec change that clobbers it trips a failure here.
 */

import fs from 'node:fs';
import path from 'node:path';
import {extractProfile, replaceSave} from '@/save-tools';
import {buildSav, parseSav} from '@/save-tools/save-io';

const VANILLA = new Uint8Array(
	fs.readFileSync(
		path.resolve(import.meta.dirname, '../../../public/data/vanilla.sav'),
	),
);

const WHOLE_BYTE_WATCH: {off: number; note: string}[] = [
	// onlineRank (0x10 u32) high word + currency_gold (0x14 u32) high bytes —
	// modeled as full u32s now, so they read-then-write verbatim.
	{off: 0x12, note: 'high word of onlineRank u32 (0x10)'},
	{off: 0x15, note: 'byte of currency_gold u32 (0x14)'},
	{off: 0x17, note: 'high byte of currency_gold u32 (0x14)'},
	// Sage card region: per-faction trailing slot has no card mapped
	{off: 0x1_8e, note: 'Wei reserved slot in sage card region'},
	{off: 0x1_94, note: 'Shu reserved slot in sage card region'},
	{off: 0x1_9a, note: 'Wu reserved slot in sage card region'},
	{off: 0x1_a0, note: 'Han reserved slot in sage card region'},
	// Padding between sage card region and sage XP entries
	{off: 0x1_a1, note: 'pad after sage card region'},
	{off: 0x1_a3, note: 'pad before sage XP base'},
	// DUEL Easy struct reserved gaps the codec never touches: 0x250-0x253
	// (between cleared mask and its copy) and 0x258-0x25B (after the copy,
	// before the 0x25C score array).
	{off: 0x2_50, note: 'Easy DUEL reserved gap (between mask and copy)'},
	{off: 0x2_53, note: 'Easy DUEL reserved gap (between mask and copy)'},
	{off: 0x2_58, note: 'Easy DUEL reserved gap (after copy, before scores)'},
	{off: 0x2_5b, note: 'Easy DUEL reserved gap (after copy, before scores)'},
	// Normal DUEL score region start (modeled as a u16; reads-then-writes
	// verbatim) and the padding region before the tutorial byte.
	{off: 0x2_fc, note: 'Normal DUEL score slot 0 (read/write verbatim)'},
	{off: 0x4_00, note: 'pad block middle (pre tutorial byte)'},
	{off: 0x4_2b, note: 'pad immediately before tutorial byte'},
	// Troop-colour bytes (0x42D/0x42E) are modeled bit-fields; the upper bit of
	// 0x42E is preserved. 0x40 is real padding before titles.
	{off: 0x4_40, note: 'pad before titles bitmask'},
	{off: 0x4_44, note: 'pad before titles bitmask'},
	// Padding between titles and mode-unlock byte
	{off: 0x4_53, note: 'pad between titles and mode-unlock'},
	{off: 0x4_54, note: 'pad between titles and mode-unlock'},
	// Padding after selected-title field
	{off: 0x4_5a, note: 'pad after selected title'},
	{off: 0x4_5b, note: 'pad after selected title'},
];

describe('Region preservation', () => {
	it('round-trips every byte we do not explicitly model', async () => {
		const parsed = await parseSav(VANILLA);
		const profile = new Uint8Array(parsed.blocks.get('profile')!);

		// Poke whole-byte watch positions with a recognisable pattern.
		const POKE = 0xa5;
		for (const {off} of WHOLE_BYTE_WATCH) profile[off] = POKE;

		// Tutorial byte: bits 0-3 owned; bits 4-7 must survive.
		profile[0x4_2c] = (profile[0x4_2c]! & 0x0f) | 0xf0;
		// Chapter-3 completion byte: bits 0-5 owned; bits 6-7 must survive.
		profile[0x4_56] = (profile[0x4_56]! & 0x3f) | 0xc0;

		// Sage XP entry for Chen Qun (sage index 1, base 0x1AC): we own +0
		// (level) and +4 (flag); +2 (XP) and +6 (padding) must survive.
		profile[0x1_ae] = 0x12;
		profile[0x1_af] = 0x34;
		profile[0x1_b2] = 0x56;
		profile[0x1_b3] = 0x78;

		// Roll the synthetic profile back into the encrypted save shell.
		parsed.blocks.set('profile', profile);
		const synthetic = await buildSav(
			parsed.header,
			parsed.blocks,
			parsed.rawSav,
		);

		// Round-trip: extract → write back unchanged.
		const extracted = await extractProfile(synthetic);
		const rebuilt = await replaceSave(synthetic, extracted);
		const after = (await parseSav(rebuilt)).blocks.get('profile')!;

		for (const {off, note} of WHOLE_BYTE_WATCH) {
			expect(after[off], `byte 0x${off.toString(16)} (${note})`).toBe(POKE);
		}
		expect(after[0x4_2c]! & 0xf0).toBe(0xf0);
		expect(after[0x4_56]! & 0xc0).toBe(0xc0);
		expect(after[0x1_ae]).toBe(0x12);
		expect(after[0x1_af]).toBe(0x34);
		expect(after[0x1_b2]).toBe(0x56);
		expect(after[0x1_b3]).toBe(0x78);
	});
});
