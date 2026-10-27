/**
 * Save Profile Library — Public API
 *
 * Entry points:
 *   defaultProfile()                    → fresh SaveProfile JSON
 *   extractProfile(sav)                 → parse .sav buffer → SaveProfile JSON
 *   createSave(profile)                 → SaveProfile JSON → .sav buffer
 *   replaceSave(sav, profile)           → write full profile into existing .sav
 *
 * A SaveProfile is the profile block plus the 戦略ノ章 records of the
 * campaign ("history") block's keep part (campaign-codec.ts); the rest of
 * the campaign block is passed through.
 *   patchSave(sav, patch)               → deep-merge partial changes into .sav
 *   applyPreset(profile, preset)        → apply a preset to a profile
 *
 * All .sav functions are async (Web Crypto HMAC-SHA1).
 * Works in both Node.js and browsers.
 */

import {writeCampaignHistory} from './campaign-codec';
import {getBlock} from './crypto';
import {deepMerge} from './deep-merge';
import {
	applyPreset as applyPresetImpl,
	defaultProfile as makeDefault,
	readProfile,
	writeProfile,
} from './profile-codec';
import {
	buildSav,
	freshHeader,
	type ParsedSave,
	parseSav,
	readPlayerName,
	readRegionCode,
	writePlayerName,
} from './save-io';

export {
	CAMPAIGN,
	CAMPAIGN_ENTRIES,
	type CampaignEntry,
	CHAPTER_KEYS,
	type ChapterKey,
	openWholeCampaign,
	readCampaign,
	setCampaignEntryListed,
} from './campaign-codec';
export {PATCHED_ROM_BASENAME} from './constants';
export {
	readPlayerName,
	readRegionCode,
	wrapDsv,
	writePlayerName,
} from './save-io';

import type {DeepPartial, PresetName, SaveProfile} from './types';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
	// Achievements
	Achievements,
	// Campaign
	CampaignProgress,
	// Cards
	CardCollection,
	CardEntry,
	CardQuantity,
	ChapterProgress,
	// Decks
	DeckSlot,
	DeepPartial,
	MasterySkills,
	// Stats
	PlayerStats,
	PresetName,
	// Sages
	SageCollection,
	SageEntry,
	SageName,
	// Core profile type
	SaveProfile,
	ScenarioRecord,
	StageResult,
	// Training
	TrainingProgress,
	// Troop colours
	TroopColor,
	TroopColors,
	Tutorials,
	WinLossRecord,
} from './types';

// =============================================================================
// LOOKUP TABLE EXPORTS
// =============================================================================

export {
	CARD_BY_ID,
	CARD_ID_TO_NO,
	CARD_NO_TO_ID,
	CARD_TABLE,
	CARD_TOTAL_SLOTS,
	type CardEntry as CardTableEntry,
	type Faction,
} from './card-table';

export {
	ALL_SAGE_NAMES,
	SAGE_BY_NAME,
	SAGE_CARD_OFFSET,
	SAGE_COUNT,
	SAGE_INDEX_TO_NAME,
	SAGE_NAME_TO_INDEX,
	SAGE_TABLE,
	type SageEntry as SageTableEntry,
} from './sage-table';

export {
	ALL_STAGE_IDS,
	DECKNO_RANGES,
	DECKNO_TO_STAGE_ID,
	STAGE_BY_ID,
	STAGE_COUNTS,
	STAGE_ID_TO_DECKNO,
	STAGE_TABLE,
	type StageEntry as StageTableEntry,
} from './stage-table';

// =============================================================================
// CODEC EXPORTS
// =============================================================================

export {
	ALL_TROOP_COLORS,
	BASE_TROOP_COLORS,
	CARD_OWN,
	cardObtained,
	PROFILE_SIZE,
	readProfile,
	writeProfile,
} from './profile-codec';

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Generate a default SaveProfile representing a fresh game state.
 */
export function defaultProfile(): SaveProfile {
	return makeDefault();
}

/**
 * Apply a preset to a profile.
 *
 * Presets:
 *   - 'fresh':   Vanilla — same shape as a brand-new save
 *   - 'starter': All content unlocked (difficulties, chapters, cards,
 *                sages) with no completion or outcome flags set
 *   - 'full':    Maxed save — every chapter cleared, every duel stage at
 *                40k, every sage at level 20, all titles + events, all troop
 *                colours, full gold and mastery
 */
export function applyPreset(
	profile: SaveProfile,
	preset: PresetName,
): SaveProfile {
	return applyPresetImpl(profile, preset);
}

/**
 * Extract a SaveProfile from a .sav or .dsv file buffer.
 */
export async function extractProfile(sav: Uint8Array): Promise<SaveProfile> {
	const parsed = await parseSav(sav);
	const profileBin = parsed.blocks.get('profile');
	if (!profileBin) throw new Error('Profile block not found in save');
	const profile = readProfile(profileBin, parsed.blocks.get('history'));
	profile.playerName = readPlayerName(parsed.header);
	profile.regionCode = readRegionCode(parsed.header);
	return profile;
}

/**
 * Create a new .sav file from a SaveProfile.
 * Non-profile blocks are zeroed; footer uses default value.
 */
export async function createSave(profile: SaveProfile): Promise<Uint8Array> {
	const profileBin = writeProfile(profile);
	const header = freshHeader();
	writePlayerName(header, profile.playerName);
	const blocks = new Map<string, Uint8Array>();
	blocks.set('profile', profileBin);
	const history = new Uint8Array(getBlock('history').size);
	writeCampaignHistory(history, profile.campaign);
	blocks.set('history', history);
	return buildSav(header, blocks);
}

/**
 * Replace the entire profile in a .sav, preserving non-profile blocks
 * and unknown profile byte regions.
 */
export async function replaceSave(
	sav: Uint8Array,
	profile: SaveProfile,
): Promise<Uint8Array> {
	const parsed = await parseSav(sav);
	const profileBin = parsed.blocks.get('profile');
	if (!profileBin) throw new Error('Profile block not found in save');
	const newProfileBin = writeProfile(profile, profileBin);
	parsed.blocks.set('profile', newProfileBin);
	writeHistory(parsed, profile);
	writePlayerName(parsed.header, profile.playerName);
	return buildSav(parsed.header, parsed.blocks, parsed.rawSav);
}

/**
 * Patch a .sav with partial SaveProfile changes (deep-merge).
 *
 * Objects: recursively merged. Arrays: replaced entirely. Primitives: replaced.
 */
export async function patchSave(
	sav: Uint8Array,
	patch: DeepPartial<SaveProfile>,
): Promise<Uint8Array> {
	const parsed = await parseSav(sav);
	const profileBin = parsed.blocks.get('profile');
	if (!profileBin) throw new Error('Profile block not found in save');
	const existing = readProfile(profileBin, parsed.blocks.get('history'));
	const merged = deepMerge<SaveProfile>(existing, patch);
	const newProfileBin = writeProfile(merged, profileBin);
	parsed.blocks.set('profile', newProfileBin);
	writeHistory(parsed, merged);
	return buildSav(parsed.header, parsed.blocks, parsed.rawSav);
}

/**
 * Write the profile's 戦略ノ章 records into the parsed save's campaign
 * ("history") block. Only records that change are written; an unchanged
 * block keeps its encrypted bytes (buildSav).
 */
function writeHistory(parsed: ParsedSave, profile: SaveProfile): void {
	const history = parsed.blocks.get('history');
	if (!history) throw new Error('History block not found in save');
	const next = new Uint8Array(history);
	writeCampaignHistory(next, profile.campaign);
	parsed.blocks.set('history', next);
}

/**
 * Available presets.
 */
export const AVAILABLE_PRESETS: PresetName[] = ['fresh', 'starter', 'full'];
