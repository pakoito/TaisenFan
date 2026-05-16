/**
 * Training Stage lookup table — maps stage names to DeckNo.
 *
 * Format: "Easy-01" through "Easy-20", "Normal-01" through "Normal-40", "Hard-01" through "Hard-20"
 *
 * DeckNo mapping (from game files):
 *   - Easy: DeckNo 2-21 (20 stages from CDECKEASY.TBL) - always available
 *   - Normal: DeckNo 22-61 (40 stages from CDECKNORMAL.TBL) - unlocked by bit 6 of 0x455
 *   - Hard: DeckNo 62-81 (20 stages from CDECKHARD.TBL) - unlocked by bit 7 of 0x455
 *
 * Note: The game also has CDECKYOKO (DeckNo 106-155) which are arcade leftovers, not tracked.
 */

export type StageEntry = {
	stageId: string; // "Easy-01", "Normal-15", "Hard-20", etc.
	deckNo: number; // Internal DeckNo (2-81)
	difficulty: 'Easy' | 'Normal' | 'Hard';
	index: number; // 1-based index within difficulty (1-20 or 1-40)
	name: string; // Army/stage name
};

// Easy stages (20 stages, DeckNo 2-21, from CDECKEASY.TBL)
const EASY_STAGES: [number, string][] = [
	[1, 'Cavalry Drill'],
	[2, 'Spear Drill'],
	[3, 'Bow Drill'],
	[4, 'Niu Jin Army'],
	[5, 'Lu Fan Army'],
	[6, 'Gongsun Army'],
	[7, 'Wang Ping Army'],
	[8, 'Zuo Ci Army'],
	[9, 'Shu Flowers'],
	[10, 'Cao Brothers'],
	[11, 'Yu Jin Army'],
	[12, 'Jiang Qin Army'],
	[13, 'Guo Jia Army'],
	[14, 'Guan Yu Army'],
	[15, 'Ding Feng Army'],
	[16, 'Cao Hong Army'],
	[17, 'Ma Liang Army'],
	[18, 'Ruinous Maidens'],
	[19, 'Jian Yong Army'],
	[20, 'Lady Guo Army'],
];

// Normal stages (40 stages, DeckNo 22-61, from CDECKNORMAL.TBL)
const NORMAL_STAGES: [number, string][] = [
	[1, 'Ji Ling Army'],
	[2, 'Kan Ze Army'],
	[3, 'Xiahou Dun Army'],
	[4, 'Peach Garden Brothers'],
	[5, 'Li Ru Army'],
	[6, 'Sun Family Army'],
	[7, 'Zhuge Liang Army'],
	[8, 'Yellow Turban Army'],
	[9, 'Yi Ji Army'],
	[10, 'Dazzling Beauties'],
	[11, 'Gan Ning Army'],
	[12, 'Healing Maidens'],
	[13, 'Three Heroes'],
	[14, 'Divine Speed Cavalry'],
	[15, 'Wheel Spearmen'],
	[16, 'Paralyzing Archers'],
	[17, 'Flash Speed Army'],
	[18, 'Lu Xun Army'],
	[19, 'Jiang Wei Army'],
	[20, 'Flying Heaven Maidens'],
	[21, 'Xiahou Dun Army 2'],
	[22, 'Fire Thunder Army'],
	[23, 'Chen Gong Army'],
	[24, 'Bitter Sweet Maidens'],
	[25, 'Wei Yan Army'],
	[26, 'Xun Yu Army'],
	[27, 'Sun Ce Army'],
	[28, 'Outnumbered Maidens'],
	[29, 'Sima Yi Army'],
	[30, 'Huang Zhong Army'],
	[31, 'Zhang Lu Army'],
	[32, 'Field Battle Maidens'],
	[33, 'Wei-Wu Alliance'],
	[34, 'Pang Tong Army'],
	[35, 'Meteor Maidens'],
	[36, 'Jia Xu Army'],
	[37, 'Guan Yu Army 2'],
	[38, 'Elder Alliance'],
	[39, 'Heroes and Daughters'],
	[40, 'Fierce Warriors Alliance'],
];

// Hard stages (20 stages, DeckNo 62-81, from CDECKHARD.TBL)
const HARD_STAGES: [number, string][] = [
	[1, 'Western Heroes'],
	[2, 'Sima Yi Couple'],
	[3, 'Sleeping Dragon and Phoenix'],
	[4, 'Jing Province Assault'],
	[5, 'Siege Camp Army'],
	[6, 'Wu Emperor Army'],
	[7, 'Cao Family Army'],
	[8, 'Grand General'],
	[9, 'Unrivaled Army'],
	[10, 'Nation-Toppling Maidens'],
	[11, 'Three Generations of Wu'],
	[12, 'Four Fierce Warriors'],
	[13, 'Extreme Healing Maidens'],
	[14, 'Five Tiger Generals'],
	[15, 'Famous Wu Generals'],
	[16, 'Wei Emperor Army'],
	[17, 'Hero Couples'],
	[18, 'Tiger Fool Evil'],
	[19, 'Grand Meteor Maidens'],
	[20, 'Shu Emperor Army'],
];

function buildStages(
	stages: [number, string][],
	difficulty: 'Easy' | 'Normal' | 'Hard',
	baseDeckNo: number,
): StageEntry[] {
	return stages.map(([index, name]) => ({
		stageId: `${difficulty}-${String(index).padStart(2, '0')}`,
		deckNo: baseDeckNo + index - 1,
		difficulty,
		index,
		name,
	}));
}

export const STAGE_TABLE: StageEntry[] = [
	...buildStages(EASY_STAGES, 'Easy', 2),
	...buildStages(NORMAL_STAGES, 'Normal', 22),
	...buildStages(HARD_STAGES, 'Hard', 62),
];

/** Stage ID → StageEntry lookup */
export const STAGE_BY_ID: Record<string, StageEntry> = {};

/** DeckNo → Stage ID lookup */
export const DECKNO_TO_STAGE_ID: Record<number, string> = {};

/** Stage ID → DeckNo lookup */
export const STAGE_ID_TO_DECKNO: Record<string, number> = {};

for (const entry of STAGE_TABLE) {
	STAGE_BY_ID[entry.stageId] = entry;
	DECKNO_TO_STAGE_ID[entry.deckNo] = entry.stageId;
	STAGE_ID_TO_DECKNO[entry.stageId] = entry.deckNo;
}

/** All stage IDs */
export const ALL_STAGE_IDS: string[] = STAGE_TABLE.map(e => e.stageId);

/** Stage counts per difficulty */
export const STAGE_COUNTS = {
	Easy: 20,
	Normal: 40,
	Hard: 20,
	Total: 80,
};

/** DeckNo ranges */
export const DECKNO_RANGES = {
	Easy: {start: 2, end: 21},
	Normal: {start: 22, end: 61},
	Hard: {start: 62, end: 81},
};
