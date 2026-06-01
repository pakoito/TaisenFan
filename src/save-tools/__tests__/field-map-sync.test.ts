/**
 * Drift guard: assert the WEBSITE profile codec stays in sync with the
 * canonical field map (src/save-tools/save-field-map.json).
 *
 * save-field-map.json is the SOURCE OF TRUTH for the save layout (each entry
 * gives off/len/name/kind for a field inside its block; every block tiles
 * 0..size-1 with no gaps). It is SYNCED verbatim FROM the main repo's
 * canonical copy at `save-tools/save-field-map.json` — keep the two byte-for-
 * byte identical (this file mirrors that repo's `save-tools/verify-field-map.ts`
 * guard for the website codec).
 *
 * The website codec (profile-codec.ts) carries a hand-maintained `OFF`
 * constants table; crypto.ts carries per-block sizes (BLOCKS). This test proves
 * the two agree, so an offset bug — e.g. the Hard-score 0x34C-vs-0x39C
 * regression — cannot silently ship in the browser save editor: it fails CI
 * (`npm run test:ci`) instead.
 */

import fs from 'node:fs';
import path from 'node:path';
import {BLOCKS} from '@/save-tools/crypto';
import {OFF, PROFILE_SIZE} from '@/save-tools/profile-codec';

type MapEntry = {
	off: number;
	len: number;
	name: string;
	kind: string;
};
type FieldMap = Record<string, MapEntry[] | string>;

const MAP = JSON.parse(
	fs.readFileSync(
		path.resolve(import.meta.dirname, '../save-field-map.json'),
		'utf8',
	),
) as FieldMap;

function block(name: string): MapEntry[] {
	const b = MAP[name];
	if (!Array.isArray(b)) throw new Error(`map is missing block "${name}"`);
	return b;
}

function find(
	entries: MapEntry[],
	blockName: string,
	fieldName: string,
): MapEntry {
	const e = entries.find(x => x.name === fieldName);
	if (!e)
		throw new Error(`map block "${blockName}" has no field "${fieldName}"`);
	return e;
}

function blockSize(name: string): number {
	const b = BLOCKS.find(x => x.name === name);
	if (!b) throw new Error(`codec has no crypto block "${name}"`);
	return b.size;
}

const PR = block('player_records');
const f = (name: string) => find(PR, 'player_records', name);

describe('save-field-map drift guard (website codec ↔ canonical map)', () => {
	// =========================================================================
	// 1. Per-block SIZE agreement (crypto BLOCKS vs map block totals)
	// =========================================================================
	//
	// The field-map block names differ from the codec's crypto block names. Map
	// each map block to the codec block whose plaintext it describes:
	//   header         -> the 0x80 unencrypted header
	//   player_records -> profile     (PROFILE_SIZE)
	//   deck_presets   -> deck_slots
	//   jtnc_container -> account
	//   campaign       -> history
	//   footer         -> footer
	const BLOCK_SIZE: Record<string, number> = {
		header: 0x80, // unencrypted header
		player_records: PROFILE_SIZE,
		deck_presets: blockSize('deck_slots'),
		jtnc_container: blockSize('account'),
		campaign: blockSize('history'),
		footer: blockSize('footer'),
	};

	for (const [mapBlock, codecSize] of Object.entries(BLOCK_SIZE)) {
		it(`block "${mapBlock}" tiles 0..size-1 contiguously and totals codec size 0x${codecSize.toString(16)}`, () => {
			const entries = block(mapBlock);
			expect(entries.length).toBeGreaterThan(0);
			// Map blocks must tile 0..size-1 with no gaps; the block size is the
			// end offset of the last entry. Verify tiling while computing it.
			let cursor = 0;
			for (const e of entries) {
				expect(e.off, `block "${mapBlock}" not contiguous at "${e.name}"`).toBe(
					cursor,
				);
				cursor = e.off + e.len;
			}
			expect(
				cursor,
				`block "${mapBlock}" map total 0x${cursor.toString(16)} != codec 0x${codecSize.toString(16)}`,
			).toBe(codecSize);
		});
	}

	// =========================================================================
	// 2. player_records field offsets/lengths (the codec's OFF table)
	// =========================================================================
	//
	// Explicit name->map correspondence for every field the codec actually
	// models. Unmodeled reserved/pad runs are not required to match 1:1 — only
	// what the codec encodes is gated.

	it('Win/Loss/Draw records (offline + online, u16 each)', () => {
		expect(OFF.OFFLINE_WINS).toBe(f('offline_wins').off);
		expect(f('offline_wins').len).toBe(2);
		expect(OFF.OFFLINE_LOSSES).toBe(f('offline_losses').off);
		expect(f('offline_losses').len).toBe(2);
		expect(OFF.OFFLINE_DRAWS).toBe(f('offline_draws').off);
		expect(f('offline_draws').len).toBe(2);
		expect(OFF.ONLINE_WINS).toBe(
			f('online_wins_gates_troop_colours_black20_white50_pink100').off,
		);
		expect(
			f('online_wins_gates_troop_colours_black20_white50_pink100').len,
		).toBe(2);
		expect(OFF.ONLINE_LOSSES).toBe(f('online_losses').off);
		expect(f('online_losses').len).toBe(2);
		expect(OFF.ONLINE_DRAWS).toBe(f('online_draws').off);
		expect(f('online_draws').len).toBe(2);
	});

	it('Ranks / currency / XP (u32 each)', () => {
		expect(OFF.OFFLINE_RANK).toBe(f('offline_rank_xp').off);
		expect(f('offline_rank_xp').len).toBe(4);
		expect(OFF.ONLINE_RANK).toBe(f('online_rank_xp').off);
		expect(f('online_rank_xp').len).toBe(4);
		expect(OFF.FOOD).toBe(f('food').off);
		expect(f('food').len).toBe(4);
		expect(OFF.XP_TRACKING).toBe(f('xp_tracking_counter_tracks_0x0C').off);
		expect(f('xp_tracking_counter_tracks_0x0C').len).toBe(4);
	});

	it('Campaign event GALLERY bitmask span (0x1C..0x3B inclusive)', () => {
		const eventGallery = f(
			'campaign_event_gallery_bitmask_251bits_bit0_ch1s1e1_prologue',
		);
		expect(OFF.CAMPAIGN_EVENTS).toBe(eventGallery.off);
		// Codec iterates CAMPAIGN_EVENTS..CAMPAIGN_EVENTS_END inclusive.
		expect(OFF.CAMPAIGN_EVENTS_END - OFF.CAMPAIGN_EVENTS + 1).toBe(
			eventGallery.len,
		);
	});

	it('Mastery skills (7 × u16)', () => {
		expect(OFF.SKILL_CAVALRY).toBe(f('skill_cavalry_kihei').off);
		expect(OFF.SKILL_SPEAR).toBe(f('skill_spear_souhei').off);
		expect(OFF.SKILL_BOW).toBe(f('skill_bow_kyuuhei').off);
		expect(OFF.SKILL_DEFEAT).toBe(f('skill_defeat_gekiha').off);
		expect(OFF.SKILL_SIEGE).toBe(f('skill_siege_koujou').off);
		expect(OFF.SKILL_DEFENSE).toBe(f('skill_defense_bouei').off);
		expect(OFF.SKILL_DUEL).toBe(f('skill_duel_ikkiuchi').off);
	});

	it('Card ownership region (byte-per-card, base 0x52)', () => {
		expect(OFF.CARD_BASE).toBe(
			f('card_ownership_byte_per_card_indexed_by_CARDLIB_No_qty_ascii_31to39')
				.off,
		);
	});

	// === DUEL difficulty array — the field that regressed (Hard 0x34C bug) ===
	// cleared bitmask + cleared-copy + best-score offsets per difficulty.
	it('DUEL Easy cleared + copy + score (20 × u16)', () => {
		expect(OFF.DUEL_EASY_CLEARED).toBe(f('duel_easy_cleared_bitmask').off);
		expect(OFF.DUEL_EASY_CLEARED_COPY).toBe(
			f('duel_easy_cleared_bitmask_copy').off,
		);
		const e = f('duel_easy_best_scores_u16x20');
		expect(OFF.DUEL_SCORE_EASY).toBe(e.off);
		expect(e.len).toBe(20 * 2); // codec writes 20 stages × u16
	});

	it('DUEL Normal cleared + copy + score (40 × u16)', () => {
		expect(OFF.DUEL_NORMAL_CLEARED).toBe(f('duel_normal_cleared_bitmask').off);
		expect(OFF.DUEL_NORMAL_CLEARED_COPY).toBe(
			f('duel_normal_cleared_bitmask_copy').off,
		);
		const e = f('duel_normal_best_scores_u16x40');
		expect(OFF.DUEL_SCORE_NORMAL).toBe(e.off);
		expect(e.len).toBe(40 * 2); // 40 stages × u16
	});

	it('DUEL Hard cleared + copy + score (20 × u16) — must be 0x39C, NOT 0x34C', () => {
		expect(OFF.DUEL_HARD_CLEARED).toBe(f('duel_hard_cleared_bitmask').off);
		expect(OFF.DUEL_HARD_CLEARED_COPY).toBe(
			f('duel_hard_cleared_bitmask_copy').off,
		);
		const e = f('duel_hard_best_scores_u16x20');
		// The regressed offset — map says 0x39C; if the codec ever drifts back to
		// 0x34C (the tail after Normal's 40-stage array) this assertion fails.
		expect(OFF.DUEL_SCORE_HARD).toBe(e.off);
		expect(e.off).toBe(0x3_9c);
		expect(e.len).toBe(20 * 2); // 20 stages × u16
	});

	it('Tutorial-progress bitmask', () => {
		expect(OFF.TUTORIAL).toBe(
			f('tutorial_progress_bitmask_00_09_08_0F_across_milestones').off,
		);
	});

	it('Troop-colour unlock bitmask (0x42D lo, 0x42E hi)', () => {
		expect(OFF.TROOP_COLOR).toBe(
			f(
				'troop_color_unlock_bitmask_def07_b3purple_b4black_b5yellow_b6pink_b7cyan',
			).off,
		);
		expect(OFF.TROOP_COLOR_HI).toBe(
			f('troop_color_unlock_hi_bit0_white_rest_reserved').off,
		);
	});

	it('Title unlock bitmask span (0x445..0x452 inclusive)', () => {
		const titleUnlock = f(
			'title_unlock_bitmask_which_shougou_selectable_zeroing_left_displayed_title',
		);
		expect(OFF.TITLE_BASE).toBe(titleUnlock.off);
		expect(OFF.TITLE_END - OFF.TITLE_BASE + 1).toBe(titleUnlock.len);
	});

	it('Mode-unlock (0x455) + chapter-completion (0x456) bytes', () => {
		expect(OFF.MODE_UNLOCK).toBe(
			f(
				'mode_unlock_bitmask_bit7_hard_geki_bit6_normal_nan_bits0to5_chapter_unlock',
			).off,
		);
		// Website codec calls 0x456 CHAPTER3_UNLOCK; the map calls it
		// chapter_completion_flags. Same offset.
		expect(OFF.CHAPTER3_UNLOCK).toBe(
			f(
				'chapter_completion_flags_NOT_chapter_list_visibility_zeroing_left_list_unchanged',
			).off,
		);
	});

	it('Selected/displayed lord title (u16, stores idx+19) at 0x458', () => {
		expect(OFF.SELECTED_TITLE).toBe(
			f(
				'selected_displayed_lord_title_left_badge_idx_plus_19_0x14_to_0_falls_to_default_jukyuu',
			).off,
		);
	});
});
