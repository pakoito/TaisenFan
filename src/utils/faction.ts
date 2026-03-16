import type {Faction} from '@/types/gamedata'

/**
 * Maps factions to Tailwind border/bg classes.
 * Uses the faction design tokens from global.css.
 */

const FACTION_BORDER: Record<Faction, string> = {
	Wei: 'border-wei',
	Shu: 'border-shu',
	Wu: 'border-wu',
	Other: 'border-gun',
	LE: 'border-gold-500',
	DS: 'border-emerald-600',
	EX: 'border-crimson-500',
}

const FACTION_HEADER_BG: Record<Faction, string> = {
	Wei: 'bg-wei text-white',
	Shu: 'bg-shu text-white',
	Wu: 'bg-wu text-white',
	Other: 'bg-gun text-white',
	LE: 'bg-gradient-to-r from-gold-400 to-gold-600 text-ink-900',
	DS: 'bg-emerald-600 text-white',
	EX: 'bg-crimson-500 text-white',
}

const FACTION_ROW_TINT: Record<Faction, string> = {
	Wei: 'bg-wei/10',
	Shu: 'bg-shu/10',
	Wu: 'bg-wu/10',
	Other: 'bg-gun/10',
	LE: 'bg-gold-300/15',
	DS: 'bg-emerald-600/10',
	EX: 'bg-crimson-500/10',
}

const FACTION_LABEL: Record<Faction, string> = {
	Wei: 'Wei (魏)',
	Shu: 'Shu (蜀)',
	Wu: 'Wu (呉)',
	Other: 'Other (群)',
	LE: 'Legendary',
	DS: 'DS',
	EX: 'EX',
}

export function factionBorder(faction: Faction): string {
	return FACTION_BORDER[faction]
}

export function factionHeaderBg(faction: Faction): string {
	return FACTION_HEADER_BG[faction]
}

export function factionRowTint(faction: Faction): string {
	return FACTION_ROW_TINT[faction]
}

export function factionLabel(faction: Faction): string {
	return FACTION_LABEL[faction]
}
