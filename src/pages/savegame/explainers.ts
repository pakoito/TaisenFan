/**
 * Short, player-facing copy for every editable knob in the save editor.
 *
 * Each entry answers "what does this do and where do I see the effect?"
 * Keep them under ~120 characters so they fit in a one-line hint.
 */

export const EXPLAINERS = {
	// === Difficulty unlocks ===
	normalUnlocked:
		'Adds the Normal difficulty list (40 stages) to DUEL → Training.',
	hardUnlocked: 'Adds the Hard difficulty list (20 stages) to DUEL → Training.',

	// === Campaign unlocks ===
	chapterUnlocked:
		'Lets you tap this chapter from the CONQUEST map. You still need to clear its stages.',
	chapterStage1: 'Marks Episode 1 of the chapter as cleared.',
	chapterStage2: 'Marks Episode 2 of the chapter as cleared.',
	chapterStage3:
		'Marks the bonus Episode (Hero’s Campaign) as cleared. Requires Episodes 1 + 2 already done.',
	chapterReward:
		'Records the reward Lord card as obtained for this chapter. Does not add the card on its own.',
	chapter3Variants:
		'Branch-specific Chapter 3 stages (Yellow Turban, Red Cliffs, etc.) — unlocked through Chapter 3 play.',
	warringStates:
		'Endgame Warring States mode — accessible after clearing the main campaign.',

	// === Cards / sages ===
	cardsUnlockAll:
		'Treats every Lord card as owned (1 copy). Browse the deck builder freely.',
	cardQuantity:
		'How many copies of this Lord you own. The game uses copies for trading and deck-building constraints.',
	sagesUnlockAll:
		'Treats every Sage card as owned. They appear in the Sage selection screen.',
	sageLevel:
		'Sage level (1–20). Higher levels widen Tactics gauge and Formation range. Raise by spending Food.',

	// === Stats ===
	food: 'Training currency. Spend in DUEL → Strategy Counter to level Sages and roll training rewards. Starts at 100.',
	offlineRank: 'Lifetime points from DUEL — visible on the title screen.',
	onlineRank: 'Online rating (max 12,000) — dormant without Wi-Fi.',
	winsLosses: 'Win / loss / draw totals shown on the player profile screen.',
	masteryCavalry:
		'Skill XP for cavalry charge attacks (0–999). Affects the cavalry chevron on the player profile.',
	masterySpear: 'Skill XP for spear-unit thrust kills (0–999).',
	masteryBow: 'Skill XP for bow-unit run-shot kills (0–999).',
	masteryDefeat:
		'Generic enemy-defeat XP (0–999). Counts every kill regardless of unit type.',
	masterySiege: 'Castle-damage XP (0–999).',
	masteryDefense: 'Castle-defense XP (0–999).',
	masteryDuel: 'One-on-one duel-win XP (0–999).',

	// === Tutorials ===
	tutorial1: 'Tutorial 1 — basic controls.',
	tutorial2: 'Tutorial 2 — advanced movement.',
	tutorial3: 'Tutorial 3 — skills and morale gauge.',
	tutorial4: 'Tutorial 4 — sage abilities.',

	// === Achievements ===
	titlesUnlocked:
		'Unlocks all 110 collectible Titles (称号). They show in the profile screen and as a deck banner.',
	campaignEventsUnlocked:
		'Unlocks every entry in the Campaign Event Gallery (cutscene playback).',
	selectedTitle:
		'Which Title is currently displayed on your profile. Pick from the unlocked list.',
} as const;

export type ExplainerKey = keyof typeof EXPLAINERS;
