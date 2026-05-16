/**
 * Profile binary ↔ SaveProfile JSON codec.
 *
 * Converts between the binary profile format (1116 bytes) and the
 * user-friendly SaveProfile JSON structure.
 */

import {CARD_TABLE, CARD_TOTAL_SLOTS} from './card-table';
import {
	ALL_SAGE_NAMES,
	SAGE_CARD_OFFSET,
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
	CampaignProgress,
	CardCollection,
	CardEntry,
	CardQuantity,
	ChapterProgress,
	PlayerStats,
	SageCollection,
	SageEntry,
	SageName,
	SaveProfile,
	StageResult,
	TrainingProgress,
	Tutorials,
} from './types';

// =============================================================================
// CONSTANTS
// =============================================================================

export const PROFILE_SIZE = 0x4_5c; // 1116 bytes

// Offsets within profile block
const OFF = {
	// Win/Loss records
	OFFLINE_WINS: 0x00,
	OFFLINE_LOSSES: 0x02,
	OFFLINE_DRAWS: 0x04,
	ONLINE_WINS: 0x06,
	ONLINE_LOSSES: 0x08,
	ONLINE_DRAWS: 0x0a,

	// Ranks and stats
	OFFLINE_RANK: 0x0c,
	ONLINE_RANK: 0x10,
	FOOD: 0x18,

	// Campaign events (gallery) - 32 bytes bitmask (251 events)
	CAMPAIGN_EVENTS: 0x1c,
	CAMPAIGN_EVENTS_END: 0x3b,

	// Campaign episode completion (8 bytes, 6 chapters × 3 episodes)
	// Required for Episode 3 to be playable (not just displayed).
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

	// Card unlock region (232 bytes)
	CARD_BASE: 0x52,

	// Sage card bytes (24 bytes)
	SAGE_CARD_BASE: 0x1_89,
	SAGE_CARD_COUNT: 24,

	// Sage XP/Level entries (21 sages × 8 bytes)
	SAGE_DATA_BASE: 0x1_a4,
	SAGE_ENTRY_SIZE: 8,

	// Duel completion bitmask
	DUEL_COMPLETION_BASE: 0x2_4c,

	// Duel high scores (80× 16-bit)
	DUEL_SCORE_BASE: 0x2_5c,

	// Tutorial completion
	TUTORIAL: 0x4_2c,

	// Title unlocks (14 bytes bitmask, 110 titles)
	TITLE_BASE: 0x4_45,
	TITLE_END: 0x4_52,

	// Mode/Campaign unlocks
	MODE_UNLOCK: 0x4_55,
	CHAPTER3_UNLOCK: 0x4_56,

	// Selected title
	SELECTED_TITLE: 0x4_58,
};

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

function byteToQty(b: number): CardQuantity {
	// 0x31 = '1' = 1 copy, 0x32 = '2' = 2 copies, etc.
	return b >= 0x31 && b <= 0x39 ? ((b - 0x30) as CardQuantity) : 0;
}

function qtyToByte(q: CardQuantity): number {
	return q === 0 ? 0x00 : q + 0x30;
}

// =============================================================================
// READ: Binary → SaveProfile
// =============================================================================

export function readProfile(buf: Uint8Array): SaveProfile {
	if (buf.length !== PROFILE_SIZE) {
		throw new Error(
			`Invalid profile size: ${buf.length}, expected ${PROFILE_SIZE}`,
		);
	}

	return {
		stats: readStats(buf),
		training: readTraining(buf),
		campaign: readCampaign(buf),
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
		onlineRank: u16(buf, OFF.ONLINE_RANK),
		food: u32(buf, OFF.FOOD),
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

	// Read duel completion and scores
	const stages: Record<string, StageResult> = {};

	for (let deckNo = 2; deckNo <= 81; deckNo++) {
		const stageId = DECKNO_TO_STAGE_ID[deckNo];
		if (!stageId) continue;

		const bitIndex = deckNo - 2;
		const dwordIndex = Math.floor(bitIndex / 32);
		const bitInDword = bitIndex % 32;

		const completionDword = u32(buf, OFF.DUEL_COMPLETION_BASE + dwordIndex * 4);
		const completed = (completionDword & (1 << bitInDword)) !== 0;
		const highScore = u16(buf, OFF.DUEL_SCORE_BASE + (deckNo - 2) * 2);

		stages[stageId] = {completed, highScore};
	}

	return {
		normalUnlocked: Boolean(modeFlags & 0x40), // Unlocks Normal difficulty (40 stages)
		hardUnlocked: Boolean(modeFlags & 0x80), // Unlocks Hard difficulty (20 stages)
		tutorials,
		stages,
	};
}

function readCampaign(buf: Uint8Array): CampaignProgress {
	const modeFlags = buf[OFF.MODE_UNLOCK]!;
	const ch3Flags = buf[OFF.CHAPTER3_UNLOCK]!;

	// Bits 0-5 of MODE_UNLOCK control chapter unlock status
	// Bits of CHAPTER3_UNLOCK control chapter completion
	function chapterFromBit(bit: number): ChapterProgress {
		const unlocked = Boolean(modeFlags & (1 << bit));
		const completed = Boolean(ch3Flags & (1 << bit));
		return {
			unlocked,
			stage1Completed: completed,
			stage2Completed: completed,
			stage3Completed: completed,
			rewardCardObtained: completed,
		};
	}

	return {
		chapters: {
			chapter1: chapterFromBit(0),
			chapter2: chapterFromBit(1),
			chapter3: chapterFromBit(2),
			chapter4: chapterFromBit(3),
			chapter5: chapterFromBit(4),
			chapter6: chapterFromBit(5),
		},
		// chapter3Variants kept for API compatibility - derived from completion flags
		chapter3Variants: {
			yellowTurbanRebellion: Boolean(ch3Flags & 0x01),
			tyrantDemonKing: Boolean(ch3Flags & 0x02),
			rivalWarlords: Boolean(ch3Flags & 0x04),
			redCliffs: Boolean(ch3Flags & 0x08),
			threeKingdomsDivision: Boolean(ch3Flags & 0x10),
			mightiestWarrior: Boolean(ch3Flags & 0x20),
		},
		warringStates: {
			unlocked: false,
			completed: false,
			highScore: 0,
		},
	};
}

function readCards(buf: Uint8Array): CardCollection {
	const cards: Record<string, CardEntry> = {};
	let allOwned = true;

	for (const entry of CARD_TABLE) {
		const qty = byteToQty(buf[OFF.CARD_BASE + entry.no]!);
		if (qty > 0) {
			cards[entry.cardId] = {quantity: qty, name: entry.name};
		} else {
			allOwned = false;
		}
	}

	// If all cards are owned, use unlockAll shorthand
	if (allOwned) {
		return {unlockAll: true, cards: {}};
	}

	return {cards};
}

function readSages(buf: Uint8Array): SageCollection {
	const sages: Record<SageName, SageEntry> = {} as Record<SageName, SageEntry>;
	let allUnlockedL1 = true;
	let anyUnlocked = false;

	for (let i = 1; i <= SAGE_COUNT; i++) {
		const name = SAGE_INDEX_TO_NAME[i];
		if (!name) continue;

		const base = OFF.SAGE_DATA_BASE + i * OFF.SAGE_ENTRY_SIZE;
		const level = Math.max(1, u16(buf, base));
		const xp = u16(buf, base + 2);
		const flag = u16(buf, base + 4);

		// Sage-card ownership byte at SAGE_CARD_BASE + offset[name]. This is
		// the primary signal: a real fresh save has Chen Qun's byte set at
		// 0x18d even though no XP-entry flag is on.
		const cardOff = SAGE_CARD_OFFSET[name];
		const cardOwned =
			cardOff !== undefined && buf[OFF.SAGE_CARD_BASE + cardOff] === 0x31;

		// Unlocked if any of: card byte set, XP flag set, has leveled up, has XP.
		const unlocked = cardOwned || flag !== 0 || level > 1 || xp > 0;

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
	const selectedTitle = rawTitle >= 19 && rawTitle < 129 ? rawTitle - 19 : 0;

	const result: Achievements = {
		titlesUnlocked: titles.state,
		campaignEventsUnlocked: events.state,
		episodeCompletion: episodes.state,
		selectedTitle,
	};
	if (titles.raw) result.titlesRaw = titles.raw;
	if (events.raw) result.campaignEventsRaw = events.raw;
	if (episodes.raw) result.episodeCompletionRaw = episodes.raw;
	return result;
}

// =============================================================================
// WRITE: SaveProfile → Binary
// =============================================================================

export function writeProfile(
	profile: SaveProfile,
	baseBuf?: Uint8Array,
): Uint8Array {
	const buf = baseBuf ? new Uint8Array(baseBuf) : new Uint8Array(PROFILE_SIZE);

	if (buf.length !== PROFILE_SIZE) {
		throw new Error(
			`Invalid buffer size: ${buf.length}, expected ${PROFILE_SIZE}`,
		);
	}

	writeStats(buf, profile.stats);
	writeTraining(buf, profile.training);
	writeCampaign(buf, profile.campaign);
	writeCards(buf, profile.cards);
	writeSages(buf, profile.sages);
	writeAchievements(buf, profile.achievements);
	// Decks are in a separate block, not written here

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
	w16(buf, OFF.ONLINE_RANK, stats.onlineRank);
	w32(buf, OFF.FOOD, stats.food);

	w16(buf, OFF.SKILL_CAVALRY, stats.mastery.cavalry);
	w16(buf, OFF.SKILL_SPEAR, stats.mastery.spear);
	w16(buf, OFF.SKILL_BOW, stats.mastery.bow);
	w16(buf, OFF.SKILL_DEFEAT, stats.mastery.defeat);
	w16(buf, OFF.SKILL_SIEGE, stats.mastery.siege);
	w16(buf, OFF.SKILL_DEFENSE, stats.mastery.defense);
	w16(buf, OFF.SKILL_DUEL, stats.mastery.duel);
}

function writeTraining(buf: Uint8Array, training: TrainingProgress): void {
	// Mode flags
	let modeFlags = buf[OFF.MODE_UNLOCK]! & 0x3f; // Preserve campaign bits
	if (training.normalUnlocked) modeFlags |= 0x40;
	if (training.hardUnlocked) modeFlags |= 0x80;
	buf[OFF.MODE_UNLOCK] = modeFlags;

	// Tutorials: bits 0-3 of 0x42C. Bits 4-7 are unknown — preserve them.
	let tutBits = 0;
	if (training.tutorials.tutorial1) tutBits |= 0x01;
	if (training.tutorials.tutorial2) tutBits |= 0x02;
	if (training.tutorials.tutorial3) tutBits |= 0x04;
	if (training.tutorials.tutorial4) tutBits |= 0x08;
	buf[OFF.TUTORIAL] = (buf[OFF.TUTORIAL]! & 0xf0) | tutBits;

	// Duel completion and scores
	const completionDwords = [0, 0, 0];

	for (const [stageId, result] of Object.entries(training.stages)) {
		const deckNo = STAGE_ID_TO_DECKNO[stageId];
		if (deckNo === undefined) continue;

		const bitIndex = deckNo - 2;
		const dwordIndex = Math.floor(bitIndex / 32);
		const bitInDword = bitIndex % 32;

		if (result.completed) {
			completionDwords[dwordIndex] =
				(completionDwords[dwordIndex]! | (1 << bitInDword)) >>> 0;
		}

		w16(buf, OFF.DUEL_SCORE_BASE + (deckNo - 2) * 2, result.highScore);
	}

	// DUEL completion: 80 bits (deck 2-81) across 3 dwords. The third dword
	// only uses its low 16 bits (deck 66-81); bits 80-95 are unknown so we
	// preserve whatever the buf already has.
	w32(buf, OFF.DUEL_COMPLETION_BASE, completionDwords[0]! >>> 0);
	w32(buf, OFF.DUEL_COMPLETION_BASE + 4, completionDwords[1]! >>> 0);
	const tail = u32(buf, OFF.DUEL_COMPLETION_BASE + 8);
	const merged =
		((completionDwords[2]! & 0x00_00_ff_ff) | (tail & 0xff_ff_00_00)) >>> 0;
	w32(buf, OFF.DUEL_COMPLETION_BASE + 8, merged);
}

function writeCampaign(buf: Uint8Array, campaign: CampaignProgress): void {
	const chapters = [
		campaign.chapters.chapter1,
		campaign.chapters.chapter2,
		campaign.chapters.chapter3,
		campaign.chapters.chapter4,
		campaign.chapters.chapter5,
		campaign.chapters.chapter6,
	];

	// Write chapter unlock flags to bits 0-5 of 0x455
	// Preserve training mode bits (6-7)
	let modeFlags = buf[OFF.MODE_UNLOCK]! & 0xc0;
	for (let i = 0; i < 6; i++) {
		if (chapters[i]!.unlocked) {
			modeFlags |= 1 << i;
		}
	}
	buf[OFF.MODE_UNLOCK] = modeFlags;

	// Write chapter-completion flags into bits 0-5 of 0x456. Bits 6-7 are
	// unknown — preserve them.
	let ch3Flags = 0;
	for (let i = 0; i < 6; i++) {
		const ch = chapters[i]!;
		// Chapter is complete if all 3 stages are done
		if (ch.stage1Completed && ch.stage2Completed && ch.stage3Completed) {
			ch3Flags |= 1 << i;
		}
	}
	buf[OFF.CHAPTER3_UNLOCK] =
		(buf[OFF.CHAPTER3_UNLOCK]! & 0xc0) | (ch3Flags & 0x3f);
}

function writeCards(buf: Uint8Array, cards: CardCollection): void {
	if (cards.unlockAll) {
		// Flood every slot to 0x31, matching the in-game "all owned" state
		// (some `no` positions don't correspond to a real card but the game's
		// own fully-unlocked saves still write 0x31 there).
		for (let no = 0; no < CARD_TOTAL_SLOTS; no++) {
			buf[OFF.CARD_BASE + no] = 0x31;
		}
		return;
	}

	// Touch only the 192 slots backed by CARD_TABLE. Unknown `no` positions
	// (unused slots in the 232-byte region) are left as-is so any bytes the
	// game put there in an uploaded save survive the round-trip.
	for (const entry of CARD_TABLE) {
		const live = cards.cards[entry.cardId];
		buf[OFF.CARD_BASE + entry.no] = live ? qtyToByte(live.quantity) : 0x00;
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

	// Card-byte region. `isAll` floods all 24 bytes (matching the CLI cooker
	// and the game's own "fully unlocked" state — the layout has 1 reserved
	// byte per faction we'd otherwise leave at 0). Otherwise we write each
	// real sage's slot per its known state and preserve reserved bytes.
	if (isAll) {
		for (let i = 0; i < OFF.SAGE_CARD_COUNT; i++) {
			buf[OFF.SAGE_CARD_BASE + i] = 0x31;
		}
	}
	for (const sage of SAGE_TABLE) {
		const off = SAGE_CARD_OFFSET[sage.name];
		if (off === undefined) continue;
		const k = known[sage.name];
		if (!k) continue;
		buf[OFF.SAGE_CARD_BASE + off] = k.unlocked ? 0x31 : 0x00;
	}

	// XP / level / flag entries. Index 0 is the Advisor placeholder.
	// We only own the level (+0) and flag (+4) bytes — XP (+2) and the
	// trailing pair (+6) are preserved from the base buf so uploaded saves
	// keep any in-game progress we don't model.
	for (let i = 0; i <= SAGE_COUNT; i++) {
		const base = OFF.SAGE_DATA_BASE + i * OFF.SAGE_ENTRY_SIZE;
		if (i === 0) {
			w16(buf, base, 1);
			w16(buf, base + 4, 0);
			continue;
		}
		const name = SAGE_INDEX_TO_NAME[i];
		const entry = name ? known[name] : undefined;
		if (!entry) continue; // No explicit state — preserve buf bytes.

		w16(buf, base, entry.level);

		// Flag (+4): vanilla saves have card_byte set yet flag=0 for the
		// starter sage. We must not invent a flag=1 just because the user
		// uploaded that save and re-downloaded it. Two cases set the flag:
		//   1. Preset-driven unlocks (isAll: caller is asking for "fully
		//      active" sages, matching how Starter/Full should look).
		//   2. The user has leveled this sage above 1 — flag goes with level.
		// In all other cases, preserve whatever the base buffer had.
		const flagAlready = u16(buf, base + 4);
		let nextFlag: number;
		if (!entry.unlocked) {
			nextFlag = 0;
		} else if (isAll || entry.level > 1 || flagAlready !== 0) {
			nextFlag = 1;
		} else {
			nextFlag = flagAlready;
		}
		w16(buf, base + 4, nextFlag);
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
	// ("none"); otherwise it stores the displayed index + 19.
	if (
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

	const defaultChapter: ChapterProgress = {
		unlocked: false,
		stage1Completed: false,
		stage2Completed: false,
		stage3Completed: false,
		rewardCardObtained: false,
	};

	return {
		stats: {
			offline: {wins: 0, losses: 0, draws: 0},
			online: {wins: 0, losses: 0, draws: 0},
			offlineRank: 0,
			onlineRank: 0,
			food: 100,
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
		campaign: {
			chapters: {
				chapter1: {...defaultChapter}, // Game unlocks Ch.1 via tutorial — start locked
				chapter2: {...defaultChapter}, // Ch.2+ start locked
				chapter3: {...defaultChapter},
				chapter4: {...defaultChapter},
				chapter5: {...defaultChapter},
				chapter6: {...defaultChapter},
			},
			chapter3Variants: {
				yellowTurbanRebellion: false,
				tyrantDemonKing: false,
				rivalWarlords: false,
				redCliffs: false,
				threeKingdomsDivision: false,
				mightiestWarrior: false,
			},
			warringStates: {
				unlocked: false,
				completed: false,
				highScore: 0,
			},
		},
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
			// duel stage S-ranked (40k), max food and ranks, all sages at level
			// 20, all titles, all event galleries, all tutorials done.
			const completeChapter: ChapterProgress = {
				unlocked: true,
				stage1Completed: true,
				stage2Completed: true,
				stage3Completed: true,
				rewardCardObtained: true,
			};
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
				campaign: {
					chapters: {
						chapter1: {...completeChapter},
						chapter2: {...completeChapter},
						chapter3: {...completeChapter},
						chapter4: {...completeChapter},
						chapter5: {...completeChapter},
						chapter6: {...completeChapter},
					},
					chapter3Variants: {
						yellowTurbanRebellion: true,
						tyrantDemonKing: true,
						rivalWarlords: true,
						redCliffs: true,
						threeKingdomsDivision: true,
						mightiestWarrior: true,
					},
					warringStates: {
						unlocked: true,
						completed: true,
						highScore: 40_000,
					},
				},
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
			const openChapter: ChapterProgress = {
				unlocked: true,
				stage1Completed: false,
				stage2Completed: false,
				stage3Completed: false,
				rewardCardObtained: false,
			};
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
				campaign: {
					chapters: {
						chapter1: {...openChapter},
						chapter2: {...openChapter},
						chapter3: {...openChapter},
						chapter4: {...openChapter},
						chapter5: {...openChapter},
						chapter6: {...openChapter},
					},
					chapter3Variants: {
						yellowTurbanRebellion: false,
						tyrantDemonKing: false,
						rivalWarlords: false,
						redCliffs: false,
						threeKingdomsDivision: false,
						mightiestWarrior: false,
					},
					warringStates: {
						unlocked: false,
						completed: false,
						highScore: 0,
					},
				},
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
