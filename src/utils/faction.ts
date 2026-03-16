/**
 * Faction display config and helpers.
 */

export interface FactionConfig {
	kanji: string
	cls: string
	rowBg: string
	label: string
}

const FACTION_CFG: Record<string, FactionConfig> = {
	Wei: {
		kanji: '魏',
		cls: 'bg-wei text-white',
		rowBg: 'bg-wei/5',
		label: 'Wei (魏)'
	},
	Shu: {
		kanji: '蜀',
		cls: 'bg-shu text-white',
		rowBg: 'bg-shu/5',
		label: 'Shu (蜀)'
	},
	Wu: {
		kanji: '呉',
		cls: 'bg-wu text-white',
		rowBg: 'bg-wu/5',
		label: 'Wu (呉)'
	},
	Other: {
		kanji: '群',
		cls: 'bg-gun text-white',
		rowBg: 'bg-gun/5',
		label: 'Other (群)'
	},
	LE: {
		kanji: 'LE',
		cls: 'bg-gold-400 text-ink-900',
		rowBg: 'bg-gold-300/10',
		label: 'Legendary'
	},
	DS: {
		kanji: 'DS',
		cls: 'bg-emerald-600 text-white',
		rowBg: 'bg-emerald-600/5',
		label: 'DS'
	},
	EX: {
		kanji: 'EX',
		cls: 'bg-crimson-500 text-white',
		rowBg: 'bg-crimson-500/5',
		label: 'EX'
	}
}

const FALLBACK: FactionConfig = {kanji: '?', cls: '', rowBg: '', label: '?'}

export function getFactionConfig(faction: string): FactionConfig {
	return FACTION_CFG[faction] ?? FALLBACK
}

export function getFactionLabel(faction: string): string {
	return getFactionConfig(faction).label
}

export function factionBorder(faction: string): string {
	const borders: Record<string, string> = {
		Wei: 'border-wei',
		Shu: 'border-shu',
		Wu: 'border-wu',
		Other: 'border-gun',
		LE: 'border-gold-500',
		DS: 'border-emerald-600',
		EX: 'border-crimson-500'
	}
	return borders[faction] ?? 'border-ink-300'
}

export function factionHeaderBg(faction: string): string {
	const headers: Record<string, string> = {
		Wei: 'bg-wei text-white',
		Shu: 'bg-shu text-white',
		Wu: 'bg-wu text-white',
		Other: 'bg-gun text-white',
		LE: 'bg-gradient-to-r from-gold-400 to-gold-600 text-ink-900',
		DS: 'bg-emerald-600 text-white',
		EX: 'bg-crimson-500 text-white'
	}
	return headers[faction] ?? 'bg-ink-500 text-white'
}
