/**
 * Save Profile Library — Public API
 *
 * Entry points:
 *   defaultProfile()                    → fresh SaveProfile JSON
 *   extractProfile(sav)                 → parse .sav buffer → SaveProfile JSON
 *   createSave(profile)                 → SaveProfile JSON → .sav buffer
 *   replaceSave(sav, profile)           → write full profile into existing .sav
 *   patchSave(sav, patch)               → deep-merge partial changes into .sav
 *   applyPreset(profile, preset)        → apply a preset to a profile
 *
 * All .sav functions are async (Web Crypto HMAC-SHA1).
 * Works in both Node.js and browsers.
 */

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
	parseSav,
	readPlayerName,
	readRegionCode,
	writePlayerName,
} from './save-io';

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
	Chapter3Variants,
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
	StageResult,
	// Training
	TrainingProgress,
	// Troop colours
	TroopColor,
	TroopColors,
	Tutorials,
	WarringStatesProgress,
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
	const profile = readProfile(profileBin);
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
	const existing = readProfile(profileBin);
	const merged = deepMerge<SaveProfile>(existing, patch);
	const newProfileBin = writeProfile(merged, profileBin);
	parsed.blocks.set('profile', newProfileBin);
	return buildSav(parsed.header, parsed.blocks, parsed.rawSav);
}

/**
 * Available presets.
 */
export const AVAILABLE_PRESETS: PresetName[] = ['fresh', 'starter', 'full'];
