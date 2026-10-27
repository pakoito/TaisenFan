/**
 * 戦略ノ章 (CONQUEST) progress ↔ the profile's list flags and the campaign
 * block's keep part.
 *
 * What the scenario select reads (ov001, sgst-port
 * docs/modding/campaign-save.md §3 "keep part"):
 *
 *  - The chapter list (0x02154524): 序章 (scenario 19), 第一章, then one entry
 *    per bit of profile 0x455 bits 0..5 up to the highest bit set (第二章..
 *    第六章, 戦乱). The profile's bit array at 0x455 is read through arm9
 *    0x0203532C and set only by the unlock notice (0x02150D96), which copies
 *    bit n (n < 14) of the pending array at 0x453 the first time it sees it.
 *  - The stage list (0x02155474): stages I and II always; stage III of
 *    chapter n when bit 8+n−1 of the 0x455 array (profile 0x456 bit n−1) is
 *    set (0x02155634).
 *  - The clear count and best score of the selected stage: the keep part,
 *    H+0x5890 + 2s (s16, −1 never opened) and H+0x58B8 + 4s (u32).
 *
 * A scenario clear (the result task 0x0214F110) adds 1 to the scenario's
 * count, opens the next chapter's three scenarios when the first is still −1
 * and raises the "new unlock" flag (0x020F773C); the result then sets 0x453
 * bit c (the chapter c = s / 3 that was cleared) for that flag, sets 0x453
 * bit 8+c for every chapter whose stages I and II both have clears, and runs
 * the notice that copies them to 0x455.
 *
 * Every writer here changes only what differs from the bytes it was given,
 * so an untouched profile writes the save back byte for byte.
 */

import type {CampaignProgress, ChapterProgress, ScenarioRecord} from './types';

export const CAMPAIGN = {
	/** Profile: bits 0..5 list 第二章..第六章 and 戦乱 (the 0x455 bit array). */
	LISTED: 0x4_55,
	/** Profile: the same bits, pending (set by the game before the notice). */
	LISTED_PENDING: 0x4_53,
	/** Profile: bit c offers stage III of chapter c+1 (array 0x455, bit 8+c). */
	STAGE3: 0x4_56,
	/** Profile: the same bits, pending (array 0x453, bit 8+c). */
	STAGE3_PENDING: 0x4_54,
	/** Campaign block: s16[20] per-scenario state, −1 locked, n = clears. */
	KEEP_STATE: 0x58_90,
	/** Campaign block: u32[20] per-scenario best score. */
	KEEP_BEST: 0x58_b8,
	/** Campaign block: s8, 1 = keep part initialised (0 → the game resets it). */
	KEEP_INIT: 0x59_08,
	SCENARIOS: 20,
	/** 戦乱, the chapter list's last entry. */
	WARRING_STATES: 18,
	/** 序章 (the tutorial): always listed, never counted (result 0x0214F2FE). */
	PROLOGUE: 19,
	/** The best score the game's keep-part init writes (0x020F34FE). */
	DEFAULT_BEST: 5000,
	/** The stage list draws the clear count with 2 digits (0x02155746). */
	MAX_CLEARS: 99,
	/** The stage list draws the best score with 6 digits (0x021557A6). */
	MAX_BEST: 999_999,
} as const;

export const CHAPTER_KEYS = [
	'chapter1',
	'chapter2',
	'chapter3',
	'chapter4',
	'chapter5',
	'chapter6',
] as const satisfies readonly (keyof CampaignProgress['chapters'])[];

export type ChapterKey = (typeof CHAPTER_KEYS)[number];

/**
 * The chapter list's entries after 序章, in order: 第一章..第六章, then 戦乱.
 * Entry i ≥ 1 is listed by profile 0x455 bit i−1.
 */
export type CampaignEntry = ChapterKey | 'warringStates';
export const CAMPAIGN_ENTRIES: readonly CampaignEntry[] = [
	...CHAPTER_KEYS,
	'warringStates',
];

/** The keep part's initial state for scenario s (ov001 0x020F34D4). */
function initialRecord(s: number): ScenarioRecord {
	const open = s < 3 || s === CAMPAIGN.PROLOGUE;
	return {clears: open ? 0 : null, bestScore: CAMPAIGN.DEFAULT_BEST};
}

function stagesOf(
	records: ScenarioRecord[],
	chapter: number,
): ChapterProgress['stages'] {
	return [
		records[chapter * 3]!,
		records[chapter * 3 + 1]!,
		records[chapter * 3 + 2]!,
	];
}

function bit(buf: Uint8Array, base: number, n: number): boolean {
	return (buf[base + (n >> 3)]! & (1 << (n & 7))) !== 0;
}

function setBit(buf: Uint8Array, base: number, n: number, on: boolean): void {
	const at = base + (n >> 3);
	const mask = 1 << (n & 7);
	buf[at] = on ? buf[at]! | mask : buf[at]! & ~mask;
}

/**
 * The keep part as the game will use it: as stored, or the initial state
 * when the block's init flag is 0 (the campaign entry re-initialises it,
 * arm9 0x02028604).
 */
function readKeep(history: Uint8Array | undefined): ScenarioRecord[] {
	if (!history || history[CAMPAIGN.KEEP_INIT] === 0) {
		return Array.from({length: CAMPAIGN.SCENARIOS}, (_, s) => initialRecord(s));
	}
	const view = new DataView(
		history.buffer,
		history.byteOffset,
		history.byteLength,
	);
	return Array.from({length: CAMPAIGN.SCENARIOS}, (_, s) => {
		const state = view.getInt16(CAMPAIGN.KEEP_STATE + s * 2, true);
		return {
			clears: state < 0 ? null : state,
			bestScore: view.getUint32(CAMPAIGN.KEEP_BEST + s * 4, true),
		};
	});
}

function chapterOf(
	profile: Uint8Array,
	records: ScenarioRecord[],
	c: number,
): ChapterProgress {
	return {
		listed: c === 0 || bit(profile, CAMPAIGN.LISTED, c - 1),
		stage3: bit(profile, CAMPAIGN.STAGE3, c),
		stages: stagesOf(records, c),
	};
}

/** A fresh save's 戦略ノ章: 序章 and 第一章 (stages I, II) only. */
export function defaultCampaign(): CampaignProgress {
	return readCampaign(new Uint8Array(CAMPAIGN.LISTED + 2), undefined);
}

/**
 * Read 戦略ノ章 progress from the profile block and the campaign block. With
 * no campaign block, the records read as a fresh keep part.
 */
export function readCampaign(
	profile: Uint8Array,
	history: Uint8Array | undefined,
): CampaignProgress {
	const records = readKeep(history);
	return {
		chapters: {
			chapter1: chapterOf(profile, records, 0),
			chapter2: chapterOf(profile, records, 1),
			chapter3: chapterOf(profile, records, 2),
			chapter4: chapterOf(profile, records, 3),
			chapter5: chapterOf(profile, records, 4),
			chapter6: chapterOf(profile, records, 5),
		},
		warringStates: {
			listed: bit(profile, CAMPAIGN.LISTED, 5),
			record: records[CAMPAIGN.WARRING_STATES]!,
		},
	};
}

/** The 20 keep-part records in scenario order (序章 from `prologue`). */
function campaignRecords(
	campaign: CampaignProgress,
	prologue: ScenarioRecord,
): ScenarioRecord[] {
	return [
		...CHAPTER_KEYS.flatMap(k => campaign.chapters[k].stages),
		campaign.warringStates.record,
		prologue,
	];
}

/**
 * Write a flag to the profile's list array and its pending copy, when it
 * differs from the list array. Clearing only the list bit would not hold:
 * the next unlock notice copies a pending bit back.
 */
function writeFlag(
	profile: Uint8Array,
	base: number,
	pending: number,
	n: number,
	on: boolean,
): void {
	if (bit(profile, base, n) === on) return;
	setBit(profile, base, n, on);
	setBit(profile, pending, n, on);
}

/** Write the list and stage III flags (profile 0x453..0x456). */
export function writeCampaignProfile(
	profile: Uint8Array,
	campaign: CampaignProgress,
): void {
	CAMPAIGN_ENTRIES.forEach((entry, i) => {
		if (i === 0) return; // 第一章 is always listed
		const listed =
			entry === 'warringStates'
				? campaign.warringStates.listed
				: campaign.chapters[entry].listed;
		writeFlag(profile, CAMPAIGN.LISTED, CAMPAIGN.LISTED_PENDING, i - 1, listed);
	});
	CHAPTER_KEYS.forEach((key, c) => {
		writeFlag(
			profile,
			CAMPAIGN.STAGE3,
			CAMPAIGN.STAGE3_PENDING,
			c,
			campaign.chapters[key].stage3,
		);
	});
}

function clampClears(clears: number | null): number {
	if (clears === null) return -1;
	return Math.min(Math.max(Math.trunc(clears), 0), 0x7f_ff);
}

function clampBest(best: number): number {
	return Math.min(Math.max(Math.trunc(best), 0), 0xff_ff_ff_ff);
}

function sameRecord(a: ScenarioRecord, b: ScenarioRecord): boolean {
	return (
		clampClears(a.clears) === clampClears(b.clears) &&
		clampBest(a.bestScore) === clampBest(b.bestScore)
	);
}

/**
 * Write the keep part's records (campaign block H+0x5890 / H+0x58B8). Only a
 * record that differs from the block's is written. A block whose keep part
 * is not initialised (H+0x5908 = 0) gets all 20 records and the flag, as
 * the game's init would; otherwise the entry would reset them.
 */
export function writeCampaignHistory(
	history: Uint8Array,
	campaign: CampaignProgress,
): void {
	const current = readKeep(history);
	const wanted = campaignRecords(campaign, current[CAMPAIGN.PROLOGUE]!);
	const initialised = history[CAMPAIGN.KEEP_INIT] !== 0;
	if (wanted.every((r, s) => sameRecord(r, current[s]!))) return;
	const view = new DataView(
		history.buffer,
		history.byteOffset,
		history.byteLength,
	);
	wanted.forEach((record, s) => {
		if (initialised && sameRecord(record, current[s]!)) return;
		view.setInt16(
			CAMPAIGN.KEEP_STATE + s * 2,
			clampClears(record.clears),
			true,
		);
		view.setUint32(
			CAMPAIGN.KEEP_BEST + s * 4,
			clampBest(record.bestScore),
			true,
		);
	});
	history[CAMPAIGN.KEEP_INIT] = 1;
}

function entryRecords(
	campaign: CampaignProgress,
	entry: CampaignEntry,
): ScenarioRecord[] {
	return entry === 'warringStates'
		? [campaign.warringStates.record]
		: campaign.chapters[entry].stages;
}

/**
 * List or unlist a chapter-list entry the way play does, in place:
 *
 *  - The list is a prefix (the game shows every entry up to the highest
 *    flag), so listing an entry lists every entry before it, and unlisting
 *    one unlists every entry after it.
 *  - A listed entry's scenarios are open: a −1 record becomes 0 clears.
 *  - An unlisted entry is as before its unlock: its records go back to −1
 *    (their clears are dropped; best scores stay) and stage III closes, so a
 *    clear in the chapter before it unlocks it again.
 *
 * 第一章 is always listed; listing or unlisting it does nothing.
 */
export function setCampaignEntryListed(
	campaign: CampaignProgress,
	entry: CampaignEntry,
	listed: boolean,
): void {
	const target = CAMPAIGN_ENTRIES.indexOf(entry);
	if (target <= 0) return;
	CAMPAIGN_ENTRIES.forEach((e, i) => {
		if (i === 0 || (listed ? i > target : i < target)) return;
		if (e === 'warringStates') campaign.warringStates.listed = listed;
		else {
			campaign.chapters[e].listed = listed;
			if (!listed) campaign.chapters[e].stage3 = false;
		}
		for (const record of entryRecords(campaign, e)) {
			if (listed) record.clears ??= 0;
			else record.clears = null;
		}
	});
}

/**
 * Every entry listed and every stage III offered, with each scenario's
 * clear count raised to at least `minClears` (0 = open, not cleared).
 */
export function openWholeCampaign(
	campaign: CampaignProgress,
	minClears: number,
): void {
	setCampaignEntryListed(campaign, 'warringStates', true);
	for (const key of CHAPTER_KEYS) campaign.chapters[key].stage3 = true;
	for (const entry of CAMPAIGN_ENTRIES) {
		for (const record of entryRecords(campaign, entry)) {
			record.clears = Math.max(record.clears ?? 0, minClears);
		}
	}
}
