/**
 * Faction display config and helpers — adapted for The Digital Scribe aesthetic.
 */

export type FactionConfig = {
	kanji: string;
	cls: string;
	rowBg: string;
	label: string;
};

const FACTION_CFG: Record<string, FactionConfig> = {
	Wei: {
		kanji: '魏',
		cls: 'bg-wei text-white',
		rowBg: 'bg-wei/8',
		label: 'Wei (魏)',
	},
	Shu: {
		kanji: '蜀',
		cls: 'bg-shu text-white',
		rowBg: 'bg-shu/8',
		label: 'Shu (蜀)',
	},
	Wu: {
		kanji: '呉',
		cls: 'bg-wu text-white',
		rowBg: 'bg-wu/8',
		label: 'Wu (呉)',
	},
	Other: {
		kanji: '群',
		cls: 'bg-gun text-white',
		rowBg: 'bg-gun/8',
		label: 'Other (群)',
	},
	LE: {
		kanji: 'LE',
		cls: 'bg-gold-dark text-gold',
		rowBg: 'bg-gold/5',
		label: 'Legendary',
	},
	DS: {
		kanji: 'DS',
		cls: 'bg-shu text-white',
		rowBg: 'bg-shu/5',
		label: 'DS',
	},
	EX: {
		kanji: 'EX',
		cls: 'bg-cinnabar text-gold',
		rowBg: 'bg-cinnabar/5',
		label: 'EX',
	},
};

const FALLBACK: FactionConfig = {kanji: '?', cls: '', rowBg: '', label: '?'};

export function getFactionConfig(faction: string): FactionConfig {
	return FACTION_CFG[faction] ?? FALLBACK;
}

export function getFactionLabel(faction: string): string {
	return getFactionConfig(faction).label;
}

export function factionBorder(faction: string): string {
	const borders: Record<string, string> = {
		Wei: 'border-wei',
		Shu: 'border-shu',
		Wu: 'border-wu',
		Other: 'border-gun',
		LE: 'border-gold-muted',
		DS: 'border-shu',
		EX: 'border-cinnabar',
	};
	return borders[faction] ?? 'border-border-dim';
}

export function factionHeaderBg(faction: string): string {
	const headers: Record<string, string> = {
		Wei: 'bg-wei text-white',
		Shu: 'bg-shu text-white',
		Wu: 'bg-wu text-white',
		Other: 'bg-gun text-white',
		LE: 'bg-gold-dark text-gold',
		DS: 'bg-shu text-white',
		EX: 'bg-cinnabar text-gold',
	};
	return headers[faction] ?? 'bg-surface-highest text-text';
}
