/**
 * Profile binary ↔ SaveProfile JSON codec.
 *
 * Converts between the binary profile format (1116 bytes) and the
 * user-friendly SaveProfile JSON structure.
 */

import {
	defaultCampaign,
	openWholeCampaign,
	readCampaign,
	writeCampaignProfile,
} from './campaign-codec';
import {CARD_TABLE, CARD_TOTAL_SLOTS} from './card-table';
import {
	ALL_SAGE_NAMES,
	SAGE_COUNT,
	SAGE_INDEX_TO_NAME,
	SAGE_TABLE,
} from './sage-table';
import {
	DECKNO_TO_STAGE_ID,
	STAGE_ID_TO_DECKNO,
	STAGE_TABLE,
} from './stage-table';
import type {
	AchievementBitfield,
	Achievements,
	CardCollection,
	CardEntry,
	CardQuantity,
	PlayerStats,
	SageCollection,
	SageEntry,
	SageName,
	SaveProfile,
	StageResult,
	TrainingProgress,
	TroopColors,
	Tutorials,
} from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

export const PROFILE_SIZE = 0x4_5c; // 1116 bytes

/** The three always-available base troop colours (default 0x42D = 0x07). */
export const BASE_TROOP_COLORS: TroopColors = {
	red: true,
	blue: true,
	green: true,
	purple: false,
	black: false,
	yellow: false,
	pink: false,
	cyan: false,
	white: false,
};

/** Every troop colour unlocked (0x42D = 0xFF, 0x42E |= 0x01). */
export const ALL_TROOP_COLORS: TroopColors = {
	red: true,
	blue: true,
	green: true,
	purple: true,
	black: true,
	yellow: true,
	pink: true,
	cyan: true,
	white: true,
};

// Offsets within profile block. Exported so the field-map drift guard
// (__tests__/field-map-sync.test.ts) can assert these stay aligned with the
// canonical save-field-map.json.
export const OFF = {
	// Win/Loss records
	OFFLINE_WINS: 0x00,
	OFFLINE_LOSSES: 0x02,
	OFFLINE_DRAWS: 0x04,
	ONLINE_WINS: 0x06,
	ONLINE_LOSSES: 0x08,
	ONLINE_DRAWS: 0x0a,

	// Ranks and stats
	OFFLINE_RANK: 0x0c, // u32 — offline 熟練度 XP
	ONLINE_RANK: 0x10, // u32 — online rank XP (max 12000)
	FOOD: 0x14, // u32 — 兵糧 training currency, +100/drill
	XP_TRACKING: 0x18, // u32 — XP-tracking counter mirroring 0x0C (read-only)

	// Campaign events (gallery) - 32 bytes bitmask (251 events)
	CAMPAIGN_EVENTS: 0x1c,
	CAMPAIGN_EVENTS_END: 0x3b,

	// 8 bytes after the event gallery, written by the presets only. They do
	// not gate 戦略ノ章 stage III (that is 0x456, campaign-codec.ts). The
	// gallery's bit index (group·15 + item, ov001 0x021574A0) reaches 0x3F.
	EPISODE_COMPLETION: 0x3c,
	EPISODE_COMPLETION_END: 0x43,

	// Mastery skills (7× 16-bit)
	SKILL_CAVALRY: 0x44,
	SKILL_SPEAR: 0x46,
	SKILL_BOW: 0x48,
	SKILL_DEFEAT: 0x4a,
	SKILL_SIEGE: 0x4c,
	SKILL_DEFENSE: 0x4e,
	SKILL_DUEL: 0x50,

	// Card ownership bytes, one per CARDDATA record (314 slots, 232 used)
	CARD_BASE: 0x52,

	// 軍師 card ownership bytes: the same array, from slot 314 on. Sage i
	// (STAFFCARD record i, SAGE_CARD_OFFSET) is at 0x52 + 314 + i = 0x18C + i
	// (arm9 0x02034FE0: kind 1 adds 0x13A). 24 slots; 0 is the 軍師
	// placeholder record and 21-23 have no record, so only 1-20 are used.
	SAGE_CARD_BASE: 0x1_8c,
	SAGE_CARD_COUNT: 24,

	// Sage records: 21 rows × 8 bytes, row i = STAFFCARD record i (arm9
	// 0x020350B0..0x02035110). See SAGE_ROW for the fields.
	SAGE_DATA_BASE: 0x1_a4,
	SAGE_ENTRY_SIZE: 8,
	SAGE_ROW_COUNT: 21,

	// DUEL drill records. Three per-difficulty structs at stride 0xA0:
	//   Easy   @ 0x24C   Normal @ 0x2EC   Hard @ 0x38C
	// Each struct: cleared bitmask (+0x00), cleared-bitmask copy (+0x08),
	// best-score u16/stage array (+0x10). The CLEARED bit is explicit — a
	// stage can be cleared with score 0, so completion is NEVER inferred
	// from highScore > 0 (validated; the old "Hard @ 0x34C" was the tail
	// after Normal's 40-stage score array, not Hard's scores).
	DUEL_EASY_CLEARED: 0x2_4c, // bits 0-19 (20 stages, deckNo 2-21)
	DUEL_EASY_CLEARED_COPY: 0x2_54, // +0x08 mirror
	DUEL_SCORE_EASY: 0x2_5c, // +0x10 (20× u16)
	DUEL_NORMAL_CLEARED: 0x2_ec, // bits 0-39 (40 stages, deckNo 22-61)
	DUEL_NORMAL_CLEARED_COPY: 0x2_f4, // +0x08 mirror
	DUEL_SCORE_NORMAL: 0x2_fc, // +0x10 (40× u16) — 29900 write confirmed
	DUEL_HARD_CLEARED: 0x3_8c, // bits 0-19 (20 stages, deckNo 62-81)
	DUEL_HARD_CLEARED_COPY: 0x3_94, // +0x08 mirror
	DUEL_SCORE_HARD: 0x3_9c, // +0x10 (20× u16) — poke+read-watch confirmed

	// Tutorial completion (bitmask, bits 0-3)
	TUTORIAL: 0x4_2c,

	// Troop-colour unlock bitmask. 0x42D bits 0-2 are the base red/blue/green
	// (default 0x07); bits 3-7 are purple/black/yellow/pink/cyan. 0x42E bit0
	// is the white unlock. See TroopColors in types.ts for the full mapping.
	TROOP_COLOR: 0x4_2d,
	TROOP_COLOR_HI: 0x4_2e,

	// Title unlocks (14 bytes bitmask, 110 titles)
	TITLE_BASE: 0x4_45,
	TITLE_END: 0x4_52,

	// The bit array the game's unlock notice sets (arm9 test 0x0203532C, set
	// 0x02035318), and its pending copy at 0x453 (0x020352F0 / 0x02035304):
	//   0x455 bits 0-5  戦略ノ章 chapter list: 第二章..第六章, 戦乱
	//   0x455 bit 6     DUEL NORMAL (難) tab; bit 7 the HARD (激) tab
	//   0x456 bits 0-5  stage III of 第一章..第六章 (array bits 8-13)
	// See campaign-codec.ts for the 戦略ノ章 bits.
	MODE_PENDING: 0x4_53,
	MODE_UNLOCK: 0x4_55,
	CHAPTER3_UNLOCK: 0x4_56,

	// Selected title, s16 (arm9 set 0x020351E8, get 0x020351F4). The profile
	// init (0x02034A90) sets it to -1 (0xFFFF, none).
	SELECTED_TITLE: 0x4_58,
};

/**
 * Fields of a sage record row (OFF.SAGE_DATA_BASE + i * 8), as the arm9
 * accessors read them:
 *   +0 s8   level, set clamped to 1..20 (0x020350B0 / 0x020350BC). The
 *           profile init sets every row to 1 (0x02034AC4).
 *   +1      not read.
 *   +2 s16  XP (0x020350D8 / 0x020350E4).
 *   +4 s32  battles fought with the sage: the post-battle update adds 1
 *           (0x0210D9C4), the setter clamps to 99,999 (0x02035100).
 */
export const SAGE_ROW = {
	LEVEL: 0,
	XP: 2,
	BATTLES: 4,
	LEVEL_MIN: 1,
	LEVEL_MAX: 20,
} as const;

// =============================================================================
// HELPERS
// =============================================================================

function u16(b: Uint8Array, o: number): number {
	return b[o]! | (b[o + 1]! << 8);
}

function u32(b: Uint8Array, o: number): number {
	return (
		(b[o]! | (b[o + 1]! << 8) | (b[o + 2]! << 16) | (b[o + 3]! << 24)) >>> 0
	);
}

function w16(b: Uint8Array, o: number, v: number): void {
	b[o] = v & 0xff;
	b[o + 1] = (v >>> 8) & 0xff;
}

function w32(b: Uint8Array, o: number, v: number): void {
	b[o] = v & 0xff;
	b[o + 1] = (v >>> 8) & 0xff;
	b[o + 2] = (v >>> 16) & 0xff;
	b[o + 3] = (v >>> 24) & 0xff;
}

/** Read bit `n` (0-based, little-endian byte order) of a cleared bitmask. */
function readBit(b: Uint8Array, base: number, n: number): boolean {
	return (b[base + (n >> 3)]! & (1 << (n & 7))) !== 0;
}

/** Set/clear bit `n` of a cleared bitmask in place. */
function writeBit(b: Uint8Array, base: number, n: number, on: boolean): void {
	const byte = base + (n >> 3);
	const mask = 1 << (n & 7);
	b[byte] = on ? b[byte]! | mask : b[byte]! & ~mask;
}

/**
 * The card ownership byte (cards at CARD_BASE + No, sages at SAGE_CARD_BASE +
 * their STAFFCARD index) is a bit field. arm9 accessors: get 0x02034FE0, set
 * 0x02035000, add 0x02035050, test bit 4 0x02035070, set bit 5 0x02035090.
 *   bits 0-3  copies owned. The setter clamps to 0..9 (0x0203500E).
 *   bit 4     obtained. The setter sets it whenever the count is > 0
 *             (0x02035020) and never clears it, so it stays when a card's
 *             count drops back to 0. Read alone by some lists.
 *   bit 5     set by the post-drill card draw and the deck editor.
 * The 0x31..0x39 in the game's own saves are 0x30 | n, not ASCII digits;
 * 0x10 | n is n copies too.
 */
export const CARD_OWN = {
	COUNT_MASK: 0x0f,
	FLAGS_MASK: 0xf0,
	OBTAINED: 0x10,
	BIT5: 0x20,
	/** The byte the game writes for a freshly drawn single copy. */
	ONE_DRAWN: 0x31,
} as const;

function byteToQty(b: number): CardQuantity {
	return Math.min(b & CARD_OWN.COUNT_MASK, 9) as CardQuantity;
}

/** The entry's "obtained" flag (bit 4), as read from the save. */
export function cardObtained(entry: CardEntry | undefined): boolean {
	return ((entry?.flags ?? 0) & CARD_OWN.OBTAINED) !== 0;
}

/**
 * The ownership byte with its count set to `q`, like the game's setter: the
 * flag bits stay (or become `flags`, when given) and a count > 0 sets bit 4.
 * A byte whose count and flags do not change is returned as it is. A slot
 * with no flags that gains copies also gets bit 5, as the post-drill draw
 * writes it (0x020E924E), which gives the 0x3n of the game's own saves.
 */
function setOwnedCount(old: number, q: CardQuantity, flags?: number): number {
	const f = (flags ?? old) & CARD_OWN.FLAGS_MASK;
	if (byteToQty(old) === q && (old & CARD_OWN.FLAGS_MASK) === f) return old;
	if (q === 0) return f;
	const kept = flags === undefined && f === 0 ? CARD_OWN.BIT5 : f;
	return kept | CARD_OWN.OBTAINED | q;
}

// =============================================================================
// READ: Binary → SaveProfile
// =============================================================================

/**
 * Decode a profile block. `history`, the campaign block, gives the 戦略ノ章
 * clear counts and best scores; without it they read as a fresh save's.
 */
export function readProfile(
	buf: Uint8Array,
	history?: Uint8Array,
): SaveProfile {
	if (buf.length !== PROFILE_SIZE) {
		throw new Error(
			`Invalid profile size: ${buf.length}, expected ${PROFILE_SIZE}`,
		);
	}

	return {
		// playerName + regionCode live in the unencrypted header. Callers
		// that route through `extractProfile` get the real values; calling
		// readProfile directly on a profile-only buffer leaves them defaulted.
		playerName: '',
		regionCode: 0,
		stats: readStats(buf),
		training: readTraining(buf),
		troopColors: readTroopColors(buf),
		campaign: readCampaign(buf, history),
		cards: readCards(buf),
		sages: readSages(buf),
		achievements: readAchievements(buf),
		decks: [], // Decks are in a separate block, not the profile block
	};
}

function readStats(buf: Uint8Array): PlayerStats {
	return {
		offline: {
			wins: u16(buf, OFF.OFFLINE_WINS),
			losses: u16(buf, OFF.OFFLINE_LOSSES),
			draws: u16(buf, OFF.OFFLINE_DRAWS),
		},
		online: {
			wins: u16(buf, OFF.ONLINE_WINS),
			losses: u16(buf, OFF.ONLINE_LOSSES),
			draws: u16(buf, OFF.ONLINE_DRAWS),
		},
		offlineRank: u32(buf, OFF.OFFLINE_RANK),
		onlineRank: u32(buf, OFF.ONLINE_RANK),
		food: u32(buf, OFF.FOOD),
		xpTracking: u32(buf, OFF.XP_TRACKING),
		mastery: {
			cavalry: u16(buf, OFF.SKILL_CAVALRY),
			spear: u16(buf, OFF.SKILL_SPEAR),
			bow: u16(buf, OFF.SKILL_BOW),
			defeat: u16(buf, OFF.SKILL_DEFEAT),
			siege: u16(buf, OFF.SKILL_SIEGE),
			defense: u16(buf, OFF.SKILL_DEFENSE),
			duel: u16(buf, OFF.SKILL_DUEL),
		},
	};
}

function readTraining(buf: Uint8Array): TrainingProgress {
	const modeFlags = buf[OFF.MODE_UNLOCK]!;

	// Read tutorials
	const tutByte = buf[OFF.TUTORIAL]!;
	const tutorials: Tutorials = {
		tutorial1: Boolean(tutByte & 0x01),
		tutorial2: Boolean(tutByte & 0x02),
		tutorial3: Boolean(tutByte & 0x04),
		tutorial4: Boolean(tutByte & 0x08),
	};

	// Read duel completion + scores. Completion comes from the EXPLICIT
	// per-difficulty CLEARED bitmask (never inferred from score>0): a stage
	// can be cleared with score 0. Scores are the per-difficulty best-score
	// arrays at +0x10. Per-difficulty stage index is 0-based within its tier.
	const stages: Record<string, StageResult> = {};

	for (let deckNo = 2; deckNo <= 81; deckNo++) {
		const stageId = DECKNO_TO_STAGE_ID[deckNo];
		if (!stageId) continue;

		let completed: boolean;
		let highScore: number;
		if (deckNo <= 21) {
			const i = deckNo - 2; // Easy: stages 0-19
			completed = readBit(buf, OFF.DUEL_EASY_CLEARED, i);
			highScore = u16(buf, OFF.DUEL_SCORE_EASY + i * 2);
		} else if (deckNo <= 61) {
			const i = deckNo - 22; // Normal: stages 0-39
			completed = readBit(buf, OFF.DUEL_NORMAL_CLEARED, i);
			highScore = u16(buf, OFF.DUEL_SCORE_NORMAL + i * 2);
		} else {
			const i = deckNo - 62; // Hard: stages 0-19
			completed = readBit(buf, OFF.DUEL_HARD_CLEARED, i);
			highScore = u16(buf, OFF.DUEL_SCORE_HARD + i * 2);
		}

		stages[stageId] = {completed, highScore};
	}

	return {
		normalUnlocked: Boolean(modeFlags & 0x40), // Unlocks Normal difficulty (40 stages)
		hardUnlocked: Boolean(modeFlags & 0x80), // Unlocks Hard difficulty (20 stages)
		tutorials,
		stages,
	};
}

function readTroopColors(buf: Uint8Array): TroopColors {
	const lo = buf[OFF.TROOP_COLOR]!;
	const hi = buf[OFF.TROOP_COLOR_HI]!;
	return {
		red: Boolean(lo & 0x01),
		blue: Boolean(lo & 0x02),
		green: Boolean(lo & 0x04),
		purple: Boolean(lo & 0x08),
		black: Boolean(lo & 0x10),
		yellow: Boolean(lo & 0x20),
		pink: Boolean(lo & 0x40),
		cyan: Boolean(lo & 0x80),
		white: Boolean(hi & 0x01),
	};
}

function readCards(buf: Uint8Array): CardCollection {
	const cards: Record<string, CardEntry> = {};
	let allOneDrawn = true;

	for (const entry of CARD_TABLE) {
		const b = buf[OFF.CARD_BASE + entry.no]!;
		if (b !== CARD_OWN.ONE_DRAWN) allOneDrawn = false;
		// A card with 0 copies keeps an entry while it has flags (bit 4
		// "obtained" survives the count dropping to 0).
		if (b !== 0) {
			cards[entry.cardId] = {
				flags: b & CARD_OWN.FLAGS_MASK,
				name: entry.name,
				quantity: byteToQty(b),
			};
		}
	}

	// The unlockAll shorthand ("1 copy each") only stands for a region the
	// game would write that way: every card at exactly 0x31. Anything else
	// (2+ copies, other flags) stays explicit so it round-trips and displays.
	if (allOneDrawn) {
		return {unlockAll: true, cards: {}};
	}

	return {cards};
}

/** Sage `index`'s record row (SAGE_ROW) in the profile. */
function sageRow(index: number): number {
	return OFF.SAGE_DATA_BASE + index * OFF.SAGE_ENTRY_SIZE;
}

/** The level byte as the game reads it (s8), shown as at least 1. */
function sageLevel(buf: Uint8Array, index: number): number {
	const b = buf[sageRow(index) + SAGE_ROW.LEVEL]!;
	return Math.max(SAGE_ROW.LEVEL_MIN, b > 0x7f ? b - 0x1_00 : b);
}

/**
 * A sage's state as the editor shows it. The card byte at SAGE_CARD_BASE +
 * index is the primary signal (a fresh save owns Chen Qun's 0x18D and no
 * row of his is touched); a sage with battles, XP or a level above 1 counts
 * too.
 */
function sageState(buf: Uint8Array, index: number): SageEntry {
	const row = sageRow(index);
	const level = sageLevel(buf, index);
	const cardOwned = byteToQty(buf[OFF.SAGE_CARD_BASE + index]!) > 0;
	const unlocked =
		cardOwned ||
		u32(buf, row + SAGE_ROW.BATTLES) !== 0 ||
		level > 1 ||
		u16(buf, row + SAGE_ROW.XP) !== 0;
	return {unlocked, level};
}

function readSages(buf: Uint8Array): SageCollection {
	const sages: Record<SageName, SageEntry> = {} as Record<SageName, SageEntry>;
	let allUnlockedL1 = true;
	let anyUnlocked = false;

	for (let i = 1; i <= SAGE_COUNT; i++) {
		const name = SAGE_INDEX_TO_NAME[i];
		if (!name) continue;

		const {unlocked, level} = sageState(buf, i);
		sages[name] = {unlocked, level};

		if (unlocked) anyUnlocked = true;
		if (!unlocked || level !== 1) allUnlockedL1 = false;
	}

	// All sages unlocked at level 1 → use the shorthand.
	if (allUnlockedL1 && anyUnlocked) {
		return {unlockAll: true, sages: {} as Record<SageName, SageEntry>};
	}
	return {sages};
}

type BitfieldState = {
	state: 'none' | 'all' | 'partial';
	raw?: Uint8Array;
};

/**
 * Classify a contiguous byte region as all-clear, all-set, or partial.
 * The last byte may need a mask (e.g. titles use 0x3F because only bits 0-5
 * are meaningful in the trailing byte for 110 titles).
 */
function classifyBitfield(
	buf: Uint8Array,
	start: number,
	endInclusive: number,
	lastByteMask = 0xff,
): BitfieldState {
	let allSet = true;
	let allClear = true;
	for (let i = start; i <= endInclusive; i++) {
		const expectedAll = i === endInclusive ? lastByteMask : 0xff;
		if (buf[i] !== expectedAll) allSet = false;
		if (buf[i] !== 0x00) allClear = false;
		if (!(allSet || allClear)) break;
	}
	if (allSet) return {state: 'all'};
	if (allClear) return {state: 'none'};
	return {
		state: 'partial',
		raw: buf.slice(start, endInclusive + 1),
	};
}

function readAchievements(buf: Uint8Array): Achievements {
	const titles = classifyBitfield(buf, OFF.TITLE_BASE, OFF.TITLE_END, 0x3f);
	const events = classifyBitfield(
		buf,
		OFF.CAMPAIGN_EVENTS,
		OFF.CAMPAIGN_EVENTS_END,
		0x07,
	);
	const episodes = classifyBitfield(
		buf,
		OFF.EPISODE_COMPLETION,
		OFF.EPISODE_COMPLETION_END,
	);

	// Selected title: stored as index + 19; 0xFFFF (or anything <19) is "none"
	const rawTitle = u16(buf, OFF.SELECTED_TITLE);
	const selectedTitle = decodeSelectedTitle(rawTitle);

	const result: Achievements = {
		titlesUnlocked: titles.state,
		campaignEventsUnlocked: events.state,
		episodeCompletion: episodes.state,
		selectedTitle,
	};
	if (titles.raw) result.titlesRaw = titles.raw;
	if (events.raw) result.campaignEventsRaw = events.raw;
	if (episodes.raw) result.episodeCompletionRaw = episodes.raw;
	// "None" (0xFFFF) and the other values that do not encode a title read as
	// title 0 too; keep the stored value so a round trip writes it back.
	if (rawTitle !== selectedTitle + 19) result.selectedTitleRaw = rawTitle;
	return result;
}

function decodeSelectedTitle(raw: number): number {
	return raw >= 19 && raw < 129 ? raw - 19 : 0;
}

// =============================================================================
// WRITE: SaveProfile → Binary
// =============================================================================

export function writeProfile(
	profile: SaveProfile,
	baseBuf?: Uint8Array,
): Uint8Array {
	const buf = baseBuf ? new Uint8Array(baseBuf) : freshProfileBuffer();

	if (buf.length !== PROFILE_SIZE) {
		throw new Error(
			`Invalid buffer size: ${buf.length}, expected ${PROFILE_SIZE}`,
		);
	}

	writeStats(buf, profile.stats);
	writeTraining(buf, profile.training);
	writeTroopColors(buf, profile.troopColors);
	writeCampaignProfile(buf, profile.campaign);
	writeCards(buf, profile.cards);
	writeSages(buf, profile.sages);
	writeAchievements(buf, profile.achievements);
	// Decks are in a separate block, not written here

	return buf;
}

/**
 * The base for a profile written without one: zeros, with every sage row at
 * level 1 as the game's profile init leaves them (0x02034AC4). The writers
 * keep a field whose value does not change, so they would otherwise leave
 * the levels at 0.
 */
function freshProfileBuffer(): Uint8Array {
	const buf = new Uint8Array(PROFILE_SIZE);
	for (let i = 0; i < OFF.SAGE_ROW_COUNT; i++) {
		buf[sageRow(i) + SAGE_ROW.LEVEL] = SAGE_ROW.LEVEL_MIN;
	}
	return buf;
}

function writeStats(buf: Uint8Array, stats: PlayerStats): void {
	w16(buf, OFF.OFFLINE_WINS, stats.offline.wins);
	w16(buf, OFF.OFFLINE_LOSSES, stats.offline.losses);
	w16(buf, OFF.OFFLINE_DRAWS, stats.offline.draws);
	w16(buf, OFF.ONLINE_WINS, stats.online.wins);
	w16(buf, OFF.ONLINE_LOSSES, stats.online.losses);
	w16(buf, OFF.ONLINE_DRAWS, stats.online.draws);
	w32(buf, OFF.OFFLINE_RANK, stats.offlineRank);
	w32(buf, OFF.ONLINE_RANK, stats.onlineRank);
	w32(buf, OFF.FOOD, stats.food);
	w32(buf, OFF.XP_TRACKING, stats.xpTracking);

	w16(buf, OFF.SKILL_CAVALRY, stats.mastery.cavalry);
	w16(buf, OFF.SKILL_SPEAR, stats.mastery.spear);
	w16(buf, OFF.SKILL_BOW, stats.mastery.bow);
	w16(buf, OFF.SKILL_DEFEAT, stats.mastery.defeat);
	w16(buf, OFF.SKILL_SIEGE, stats.mastery.siege);
	w16(buf, OFF.SKILL_DEFENSE, stats.mastery.defense);
	w16(buf, OFF.SKILL_DUEL, stats.mastery.duel);
}

function writeTraining(buf: Uint8Array, training: TrainingProgress): void {
	// DUEL tabs: 0x455 bit 6 opens NORMAL, bit 7 HARD (ov001 0x021058A4..
	// 0x021058BE). A bit that changes is written to the pending copy at 0x453
	// too: the game's unlock notice would copy a pending bit back.
	const tiers = [
		[6, training.normalUnlocked],
		[7, training.hardUnlocked],
	] as const;
	for (const [n, on] of tiers) {
		if (readBit(buf, OFF.MODE_UNLOCK, n) === on) continue;
		writeBit(buf, OFF.MODE_UNLOCK, n, on);
		writeBit(buf, OFF.MODE_PENDING, n, on);
	}

	// Tutorials: bits 0-3 of 0x42C. Bits 4-7 are unknown — preserve them.
	let tutBits = 0;
	if (training.tutorials.tutorial1) tutBits |= 0x01;
	if (training.tutorials.tutorial2) tutBits |= 0x02;
	if (training.tutorials.tutorial3) tutBits |= 0x04;
	if (training.tutorials.tutorial4) tutBits |= 0x08;
	buf[OFF.TUTORIAL] = (buf[OFF.TUTORIAL]! & 0xf0) | tutBits;

	// DUEL completion + scores. Completion is the EXPLICIT per-difficulty
	// CLEARED bit (Easy 0x24C / Normal 0x2EC / Hard 0x38C), mirrored at +0x08;
	// a stage can be cleared with score 0, so we never gate on highScore. A
	// stage absent from the map is not cleared. Only a stage whose cleared
	// state changes is written, to the mask and its copy: the other bits of
	// both masks (stages past the table, a copy that differs from its mask in
	// an uploaded save) are kept as they are.
	for (const stage of STAGE_TABLE) {
		const [mask, copy, i] = duelBit(stage.deckNo);
		const completed = training.stages[stage.stageId]?.completed ?? false;
		if (readBit(buf, mask, i) !== completed) {
			writeBit(buf, mask, i, completed);
			writeBit(buf, copy, i, completed);
		}
	}

	for (const [stageId, result] of Object.entries(training.stages)) {
		const deckNo = STAGE_ID_TO_DECKNO[stageId];
		if (deckNo === undefined) continue;

		if (deckNo <= 21) {
			w16(buf, OFF.DUEL_SCORE_EASY + (deckNo - 2) * 2, result.highScore);
		} else if (deckNo <= 61) {
			w16(buf, OFF.DUEL_SCORE_NORMAL + (deckNo - 22) * 2, result.highScore);
		} else {
			w16(buf, OFF.DUEL_SCORE_HARD + (deckNo - 62) * 2, result.highScore);
		}
	}
}

/** A DUEL deckNo's cleared mask, the mask's copy and its bit index. */
function duelBit(deckNo: number): [number, number, number] {
	if (deckNo <= 21)
		return [OFF.DUEL_EASY_CLEARED, OFF.DUEL_EASY_CLEARED_COPY, deckNo - 2];
	if (deckNo <= 61)
		return [OFF.DUEL_NORMAL_CLEARED, OFF.DUEL_NORMAL_CLEARED_COPY, deckNo - 22];
	return [OFF.DUEL_HARD_CLEARED, OFF.DUEL_HARD_CLEARED_COPY, deckNo - 62];
}

function writeTroopColors(buf: Uint8Array, colors: TroopColors): void {
	// 0x42D: base RGB (bits 0-2) + purple/black/yellow/pink/cyan (bits 3-7).
	let lo = 0;
	if (colors.red) lo |= 0x01;
	if (colors.blue) lo |= 0x02;
	if (colors.green) lo |= 0x04;
	if (colors.purple) lo |= 0x08;
	if (colors.black) lo |= 0x10;
	if (colors.yellow) lo |= 0x20;
	if (colors.pink) lo |= 0x40;
	if (colors.cyan) lo |= 0x80;
	buf[OFF.TROOP_COLOR] = lo;
	// 0x42E: bit0 = white unlock; preserve the reserved upper bits.
	buf[OFF.TROOP_COLOR_HI] =
		(buf[OFF.TROOP_COLOR_HI]! & 0xfe) | (colors.white ? 0x01 : 0x00);
}

function writeCards(buf: Uint8Array, cards: CardCollection): void {
	if (cards.unlockAll) {
		// One copy in every slot, matching the in-game "all owned" state (some
		// `no` positions don't correspond to a real card but the game's own
		// fully-unlocked saves still write 0x31 there). An empty slot becomes
		// 0x31; a slot's flag bits are kept.
		for (let no = 0; no < CARD_TOTAL_SLOTS; no++) {
			buf[OFF.CARD_BASE + no] = setOwnedCount(buf[OFF.CARD_BASE + no]!, 1);
		}
		return;
	}

	// Touch only the 192 slots backed by CARD_TABLE. Unknown `no` positions
	// (unused slots in the 232-byte region) are left as-is so any bytes the
	// game put there in an uploaded save survive the round-trip. Setting a
	// count keeps the byte's flag bits, as the game's setter does.
	for (const entry of CARD_TABLE) {
		const live = cards.cards[entry.cardId];
		const at = OFF.CARD_BASE + entry.no;
		buf[at] = setOwnedCount(buf[at]!, live?.quantity ?? 0, live?.flags);
	}
}

/**
 * A sage's card byte is an ownership bit field like a card's: an owned byte
 * keeps its count, an empty one becomes 0x31, and the flag bits are kept.
 */
function writeSageOwned(buf: Uint8Array, at: number, owned: boolean): void {
	const b = buf[at]!;
	if (owned) {
		if (byteToQty(b) === 0) buf[at] = setOwnedCount(b, 1);
	} else {
		buf[at] = setOwnedCount(b, 0);
	}
}

function writeSages(buf: Uint8Array, sages: SageCollection): void {
	const isAll = sages.unlockAll === true;

	// Resolve per-sage state. Explicit `sages.sages[name]` wins; `unlockAll`
	// fills in any sage not covered. Sages with no signal stay "unknown" —
	// their bytes get preserved as-is from the base buffer.
	const known: Record<SageName, {unlocked: boolean; level: number}> =
		{} as Record<SageName, {unlocked: boolean; level: number}>;
	for (const sage of SAGE_TABLE) {
		const explicit = sages.sages[sage.name];
		if (explicit) {
			known[sage.name] = {unlocked: explicit.unlocked, level: explicit.level};
		} else if (isAll) {
			known[sage.name] = {unlocked: true, level: 1};
		}
	}

	// A sage whose state does not change keeps every byte: its card byte (at
	// SAGE_CARD_BASE + its STAFFCARD index) and its row. The 軍師 placeholder
	// (slot and row 0) and the unused slots 21-23 are never written. A sage
	// that changes gets its card byte (owned: a copy, flags kept) and its
	// level byte (+0, s8, clamped to 1..20 like the game's setter); the XP
	// (+2) and the unread +1 byte are kept.
	for (const sage of SAGE_TABLE) {
		const want = known[sage.name];
		if (!want) continue; // No explicit state — preserve buf bytes.
		const have = sageState(buf, sage.index);
		if (have.unlocked === want.unlocked && have.level === want.level) continue;

		writeSageOwned(buf, OFF.SAGE_CARD_BASE + sage.index, want.unlocked);
		const row = sageRow(sage.index);
		if (have.level !== want.level) {
			buf[row + SAGE_ROW.LEVEL] = Math.min(
				SAGE_ROW.LEVEL_MAX,
				Math.max(SAGE_ROW.LEVEL_MIN, want.level),
			);
		}

		// Battles (+4, s32). A locked sage has none (it would read as unlocked
		// otherwise). A sage that a preset unlocks, or that is raised above
		// level 1, is given 1 when it has none; an existing count is kept.
		const battles = u32(buf, row + SAGE_ROW.BATTLES);
		if (!want.unlocked) {
			w32(buf, row + SAGE_ROW.BATTLES, 0);
		} else if (battles === 0 && (isAll || want.level > 1)) {
			w32(buf, row + SAGE_ROW.BATTLES, 1);
		}
	}
}

/**
 * Write a bitfield region. `all` floods 0xFF (with an optional mask on the
 * trailing byte), `none` floods 0x00, and `partial` writes the verbatim raw
 * bytes captured at read-time so mid-game progress survives a round-trip.
 */
function writeBitfield(
	buf: Uint8Array,
	start: number,
	endInclusive: number,
	state: AchievementBitfield,
	raw: Uint8Array | undefined,
	lastByteMask = 0xff,
): void {
	const length = endInclusive - start + 1;
	if (state === 'all') {
		for (let i = start; i <= endInclusive; i++) buf[i] = 0xff;
		buf[endInclusive] = lastByteMask;
	} else if (state === 'partial' && raw && raw.length === length) {
		for (let i = 0; i < length; i++) buf[start + i] = raw[i]!;
	} else {
		for (let i = start; i <= endInclusive; i++) buf[i] = 0x00;
	}
}

function writeAchievements(buf: Uint8Array, achievements: Achievements): void {
	writeBitfield(
		buf,
		OFF.TITLE_BASE,
		OFF.TITLE_END,
		achievements.titlesUnlocked,
		achievements.titlesRaw,
		0x3f,
	);
	writeBitfield(
		buf,
		OFF.CAMPAIGN_EVENTS,
		OFF.CAMPAIGN_EVENTS_END,
		achievements.campaignEventsUnlocked,
		achievements.campaignEventsRaw,
		0x07,
	);
	writeBitfield(
		buf,
		OFF.EPISODE_COMPLETION,
		OFF.EPISODE_COMPLETION_END,
		achievements.episodeCompletion,
		achievements.episodeCompletionRaw,
	);

	// Selected title: when titles are locked the game uses the 0xFFFF sentinel
	// ("none"); otherwise it stores the displayed index + 19. A value read from
	// the save that still decodes to the same title is written back as read.
	const raw = achievements.selectedTitleRaw;
	if (
		raw !== undefined &&
		decodeSelectedTitle(raw) === achievements.selectedTitle
	) {
		w16(buf, OFF.SELECTED_TITLE, raw);
	} else if (
		achievements.titlesUnlocked === 'none' &&
		achievements.selectedTitle === 0
	) {
		w16(buf, OFF.SELECTED_TITLE, 0xff_ff);
	} else {
		w16(buf, OFF.SELECTED_TITLE, achievements.selectedTitle + 19);
	}
}

// =============================================================================
// DEFAULT PROFILE
// =============================================================================

export function defaultProfile(): SaveProfile {
	const defaultSages: Record<SageName, SageEntry> = {} as Record<
		SageName,
		SageEntry
	>;
	for (const name of ALL_SAGE_NAMES) {
		defaultSages[name] = {unlocked: false, level: 1};
	}

	const defaultStages: Record<string, StageResult> = {};
	for (const stage of STAGE_TABLE) {
		defaultStages[stage.stageId] = {completed: false, highScore: 0};
	}

	return {
		playerName: '',
		regionCode: 0,
		stats: {
			offline: {wins: 0, losses: 0, draws: 0},
			online: {wins: 0, losses: 0, draws: 0},
			offlineRank: 0,
			onlineRank: 0,
			food: 100,
			xpTracking: 0,
			mastery: {
				cavalry: 0,
				spear: 0,
				bow: 0,
				defeat: 0,
				siege: 0,
				defense: 0,
				duel: 0,
			},
		},
		training: {
			normalUnlocked: false, // Normal (40 stages) unlocked by completing Easy
			hardUnlocked: false, // Hard (20 stages) unlocked by completing Normal
			tutorials: {
				tutorial1: false,
				tutorial2: false,
				tutorial3: false,
				tutorial4: false,
			},
			stages: defaultStages,
		},
		troopColors: {...BASE_TROOP_COLORS},
		// 序章 and 第一章 only, the keep part as the game initialises it.
		campaign: defaultCampaign(),
		cards: {cards: {}},
		sages: {sages: defaultSages},
		achievements: {
			titlesUnlocked: 'none',
			campaignEventsUnlocked: 'none',
			episodeCompletion: 'none',
			selectedTitle: 0,
		},
		decks: [],
	};
}

// =============================================================================
// PRESETS
// =============================================================================

export function applyPreset(profile: SaveProfile, preset: string): SaveProfile {
	switch (preset) {
		case 'full': {
			// "Have everything, beat everything." Every chapter complete, every
			// duel stage S-ranked (40k), max gold and ranks, all sages at level
			// 20, all titles, all event galleries, all tutorials done, every
			// troop colour unlocked.
			// Every chapter-list entry and stage III offered, every scenario
			// cleared once (best scores kept).
			const campaign = structuredClone(profile.campaign);
			openWholeCampaign(campaign, 1);
			const maxedSages: Record<SageName, SageEntry> = {} as Record<
				SageName,
				SageEntry
			>;
			for (const sage of SAGE_TABLE) {
				maxedSages[sage.name as SageName] = {unlocked: true, level: 20};
			}
			const sRankedStages: Record<string, StageResult> = {};
			for (const stage of STAGE_TABLE) {
				sRankedStages[stage.stageId] = {completed: true, highScore: 40_000};
			}
			return {
				...profile,
				stats: {
					offline: {wins: 9999, losses: 0, draws: 0},
					online: {wins: 9999, losses: 0, draws: 0},
					offlineRank: 99_999,
					onlineRank: 12_000,
					food: 9999,
					xpTracking: 99_999,
					mastery: {
						cavalry: 999,
						spear: 999,
						bow: 999,
						defeat: 999,
						siege: 999,
						defense: 999,
						duel: 999,
					},
				},
				training: {
					normalUnlocked: true,
					hardUnlocked: true,
					tutorials: {
						tutorial1: true,
						tutorial2: true,
						tutorial3: true,
						tutorial4: true,
					},
					stages: sRankedStages,
				},
				troopColors: {...ALL_TROOP_COLORS},
				campaign,
				cards: {unlockAll: true, cards: {}},
				// Explicit per-sage entries (no unlockAll shortcut) so writeSages
				// honors the level=20 from maxedSages instead of falling back to 1.
				sages: {sages: maxedSages},
				achievements: {
					titlesUnlocked: 'all',
					campaignEventsUnlocked: 'all',
					episodeCompletion: 'all',
					selectedTitle: 0,
				},
			};
		}

		case 'starter': {
			// "All content, no outcomes": every menu the player can tap is open,
			// but every "you beat this" flag is zero. The game still must be played.
			// Every chapter-list entry and stage III offered, each scenario
			// open with the clears it already has (0 for a fresh save).
			const campaign = structuredClone(profile.campaign);
			openWholeCampaign(campaign, 0);
			return {
				...profile,
				training: {
					normalUnlocked: true,
					hardUnlocked: true,
					tutorials: {
						tutorial1: false,
						tutorial2: false,
						tutorial3: false,
						tutorial4: false,
					},
					stages: {},
				},
				// All nine troop colours selectable in the 部隊色変更 picker (a
				// "menu the player can tap"), without recording the underlying
				// all-clear / online-win outcomes.
				troopColors: {...ALL_TROOP_COLORS},
				campaign,
				cards: {unlockAll: true, cards: {}},
				sages: {unlockAll: true, sages: {} as Record<SageName, SageEntry>},
				achievements: {
					titlesUnlocked: 'none',
					campaignEventsUnlocked: 'none',
					episodeCompletion: 'none',
					selectedTitle: 0,
				},
			};
		}

		default:
			return profile;
	}
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
	CARD_ID_TO_NO,
	CARD_NO_TO_ID,
	CARD_TABLE,
} from './card-table';

export {
	ALL_SAGE_NAMES,
	SAGE_INDEX_TO_NAME,
	SAGE_NAME_TO_INDEX,
	SAGE_TABLE,
} from './sage-table';

export {
	DECKNO_TO_STAGE_ID,
	STAGE_ID_TO_DECKNO,
	STAGE_TABLE,
} from './stage-table';
