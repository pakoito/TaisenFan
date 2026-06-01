/**
 * Short, player-facing copy for every editable knob in the save editor.
 *
 * Each entry answers "what does this do and where do I see the effect?"
 * Keep them under ~120 characters so they fit in a one-line hint.
 */

export const EXPLAINERS = {
	// === Difficulty unlocks ===
	normalUnlocked:
		'Makes the Normal difficulty list (40 stages) PLAYABLE in DUEL → Training. Independent of clearing or scoring any stage.',
	hardUnlocked:
		'Makes the Hard difficulty list (20 stages) PLAYABLE in DUEL → Training. Independent of clearing or scoring any stage.',

	// === DUEL per-stage facets (kept DISTINCT) ===
	stageCleared:
		'The stage’s CLEARED flag — explicitly recorded by the game. A stage can be cleared with a best score of 0; this is never inferred from the score.',
	stageScore:
		'Your BEST SCORE on this stage (S-rank is 30000+). Separate from the cleared flag — a high score does not by itself mark the stage cleared.',
	duelStages:
		'Per-stage DUEL records. UNLOCKED (playable) is the difficulty tier above; CLEARED and BEST SCORE are tracked independently per stage.',

	// === Troop colours (部隊色) ===
	troopColors:
		'Which 部隊色 (troop colours) are selectable in the colour picker. Three are always on; the rest are earned via DUEL all-clears and online-win milestones.',

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
		'Sage level (1–20). Higher levels widen Tactics gauge and Formation range. Raise by spending gold at the Strategy Counter.',

	// === Stats ===
	currencyGold:
		'Spendable training currency (gold). Earned per drill, spent in DUEL → Strategy Counter to level Sages and draw cards. Starts at 100.',
	region:
		'Prefecture you chose at first launch (read-only). Stored in the save header — changing it would invalidate the header checksum.',
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
