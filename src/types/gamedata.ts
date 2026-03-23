/**
 * Game data types for Sangokushi Taisen Ten.
 * Mirrors gamedata-tools/types.ts for frontend consumption.
 */

export const FACTIONS = [
	'Wei',
	'Shu',
	'Wu',
	'Other',
	'LE',
	'DS',
	'EX',
] as const;
export type Faction = (typeof FACTIONS)[number];

export const RARITIES = ['C', 'UC', 'R', 'SR', 'LE'] as const;
export type Rarity = (typeof RARITIES)[number];

export const UNIT_TYPES = [
	'Spear',
	'Horse',
	'Bow',
	'Infantry',
	'Siege',
] as const;
export type UnitType = (typeof UNIT_TYPES)[number];

export const TRAITS = [
	'Ambush',
	'Revival',
	'Valor',
	'Barricade',
	'Charm',
	'Recruit',
	'FlyingGeneral',
] as const;
export type Trait = (typeof TRAITS)[number];

export const ATTRIBUTES = ['Heaven', 'Earth', 'Man'] as const;
export type Attribute = (typeof ATTRIBUTES)[number];

export const EFFECT_DURATIONS = [
	'Instant',
	'Brief',
	'Scales with INT',
	'Until defeated',
	'While active',
] as const;
export type EffectDuration = (typeof EFFECT_DURATIONS)[number];

export const SAGE_ABILITY_TYPES = ['Tactics', 'Formation'] as const;
export type SageAbilityType = (typeof SAGE_ABILITY_TYPES)[number];

export const DIFFICULTIES = ['Easy', 'Normal', 'Hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const SKILL_TARGETS = ['Ally', 'Enemy', 'Both'] as const;
export type SkillTarget = (typeof SKILL_TARGETS)[number];

export const SAGE_RANGE_TYPES = [
	'all',
	'square',
	'square_large',
	'wide_rect',
	'wide_rect_narrow',
	'circle',
] as const;
export type SageRangeType = (typeof SAGE_RANGE_TYPES)[number];

// Lord Card
export interface LordCard {
	cardId: number;
	cardIndex: string;
	sortNo: number;
	name: string;
	nameJapanese: string;
	nameShort: string;
	faction: Faction;
	rarity: Rarity;
	artist: string;
	lore: string;
	battleCry: string;
	victoryCryDuel: string;
	victoryCryBattle: string;
	birthYear: number | null;
	deathYear: number | null;
	cost: number;
	pow: number;
	int: number;
	unitType: UnitType;
	traits: Trait[];
	attribute: Attribute;
	skill: {
		name: string;
		morale: number;
		description: string;
		shortDescription: string;
		duration: EffectDuration;
		range: string;
	};
}

// Sage Ability
export interface SageAbility {
	id: number;
	name: string;
	description: string;
	type: SageAbilityType;
	affinity: Attribute;
	target: SkillTarget;
	range: SageRangeType;
	rangeSize: {x: number; y: number};
	gaugeMax: number;
	chargeTime: number;
}

// Sage Dialogue
export interface SageDialogue {
	greeting1: string;
	greeting2: string;
	greeting3: string;
	goBattleBefore: string;
	goBattle: string;
	training: string;
	trainingExpect: string;
	tokkun: string;
	mockBattle: string;
	hunting: string;
	endTraining: string;
	success: string;
	failed: string;
}

// Sage Card
export interface SageCard {
	cardId: number;
	cardIndex: string;
	sortNo: number;
	name: string;
	nameJapanese: string;
	nameShort: string;
	faction: Faction;
	rarity: Rarity;
	artist: string;
	lore: string;
	battleCry: string;
	birthYear: number | null;
	deathYear: number | null;
	tactics: SageAbility;
	formation: SageAbility;
	dialogue: SageDialogue;
}

// Duel Deck
export interface DeckLordInfo {
	cardId: number;
	name: string;
	nameJapanese: string;
	cost: number;
	unitType: UnitType;
	faction: Faction;
	pow: number;
	int: number;
	skillName: string;
	traits: Trait[];
	attribute: Attribute;
}

export interface SpecialUnitInfo {
	cardId: number;
	name: string;
	cost: number;
	pow: number;
	int: number;
	faction: Faction;
}

export interface DeckSageInfo {
	cardId: number;
	name: string;
	nameJapanese: string;
	faction: Faction;
	tacticsName: string;
	formationName: string;
	selectedAbility: 'Tactics' | 'Formation';
	abilityLevel: number;
}

export interface DuelDeck {
	difficulty: Difficulty;
	deckNo: number;
	deckIndex: number;
	name: string;
	description: string;
	totalCost: number;
	stage: number;
	mapType: number;
	grade: number;
	brave: number;
	sage: DeckSageInfo | null;
	lords: DeckLordInfo[];
	lordCount: number;
	specialUnits: SpecialUnitInfo[];
	totalPow: number;
	totalInt: number;
	traitCounts: Record<string, number>;
	attributeCounts: Record<string, number>;
}
