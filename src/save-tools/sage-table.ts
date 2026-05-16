/**
 * Sage lookup table — maps readable Sage Name ↔ internal index.
 *
 * The save file stores 21 sage entries (index 0 is the "Advisor" placeholder).
 * Real sages are indices 1-20.
 *
 * Order matches STAFFLIB.TBL in the game data.
 */

import type {SageName} from './types';

export type SageEntry = {
	index: number; // Internal index (0-20)
	name: SageName; // English name
	faction: string; // Wei, Shu, Wu, Han
	cardId: number; // Sage card ID (0 for Advisor)
};

// Index 0 is "Advisor" (軍師) - a placeholder, not a real sage
// Indices 1-20 are the 20 real sages

const SAGE_DATA: [number, SageName | null, string, number][] = [
	[0, null, '', 0], // Advisor (placeholder)
	[1, 'Chen Qun', 'Wei', 0x20_05], // 陳群
	[2, 'Guo Jia', 'Wei', 0x20_01], // 郭嘉
	[3, 'Sima Yi', 'Wei', 0x20_02], // 司馬懿
	[4, 'Xun Yu', 'Wei', 0x20_03], // 荀彧
	[5, 'Xun You', 'Wei', 0x20_04], // 荀攸
	[6, 'Mi Zhu', 'Shu', 0x60_03], // 糜竺
	[7, 'Zhuge Liang', 'Shu', 0x60_01], // 諸葛亮
	[8, 'Pang Tong', 'Shu', 0x60_05], // 龐統
	[9, 'Ma Su', 'Shu', 0x60_02], // 馬謖
	[10, 'Fa Zheng', 'Shu', 0x60_04], // 法正
	[11, 'Zhou Yu', 'Wu', 0x40_01], // 周瑜
	[12, 'Zhang Zhao', 'Wu', 0x40_02], // 張昭
	[13, 'Lu Meng', 'Wu', 0x40_04], // 呂蒙
	[14, 'Lu Su', 'Wu', 0x40_05], // 魯粛
	[15, 'Lu Xun', 'Wu', 0x40_03], // 陸遜
	[16, 'Mi Heng', 'Han', 0x80_04], // 禰衡
	[17, 'Jia Xu', 'Han', 0x80_01], // 賈詡
	[18, 'Zhang Jiao', 'Han', 0x80_02], // 張角
	[19, 'Chen Gong', 'Han', 0x80_03], // 陳宮
	[20, 'Li Ru', 'Han', 0x80_05], // 李儒
];

export const SAGE_TABLE: SageEntry[] = SAGE_DATA.filter(
	([, name]) => name !== null,
).map(([index, name, faction, cardId]) => ({
	index,
	name: name as SageName,
	faction,
	cardId,
}));

/** Sage name → index lookup (e.g., "Zhuge Liang" → 7) */
export const SAGE_NAME_TO_INDEX: Record<SageName, number> = {} as Record<
	SageName,
	number
>;

/** Index → sage name lookup (e.g., 7 → "Zhuge Liang") */
export const SAGE_INDEX_TO_NAME: Record<number, SageName> = {};

/** Sage name → SageEntry lookup */
export const SAGE_BY_NAME: Record<SageName, SageEntry> = {} as Record<
	SageName,
	SageEntry
>;

for (const entry of SAGE_TABLE) {
	SAGE_NAME_TO_INDEX[entry.name] = entry.index;
	SAGE_INDEX_TO_NAME[entry.index] = entry.name;
	SAGE_BY_NAME[entry.name] = entry;
}

/** All sage names in order */
export const ALL_SAGE_NAMES: SageName[] = SAGE_TABLE.map(e => e.name);

/** Total sage count (excluding Advisor) */
export const SAGE_COUNT = 20;

/** Total sage entries in save file (including Advisor placeholder) */
export const SAGE_TOTAL_ENTRIES = 21;
