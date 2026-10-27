/**
 * Short, player-facing copy for every editable knob in the save editor.
 *
 * Each entry answers "what does this do and where do I see the effect?"
 * Keep them under ~120 characters so they fit in a one-line hint.
 */

export const EXPLAINERS = {
	// === Difficulty unlocks ===
	normalUnlocked:
		'Makes the Normal difficulty list (40 stages) PLAYABLE in DUEL → Training (profile 0x455 bit 6). The game sets it once every Easy stage is cleared.',
	hardUnlocked:
		'Makes the Hard difficulty list (20 stages) PLAYABLE in DUEL → Training (profile 0x455 bit 7). The game sets it once every Normal stage is cleared.',

	// === DUEL per-stage facets (kept DISTINCT) ===
	stageCleared:
		'The stage’s CLEARED flag, explicitly recorded by the game. A stage can be cleared with a best score of 0; this is never inferred from the score.',
	stageScore:
		'Your BEST SCORE on this stage (S-rank is 30000+). Separate from the cleared flag: a high score does not by itself mark the stage cleared.',
	duelStages:
		'Per-stage DUEL records. UNLOCKED (playable) is the difficulty tier above; CLEARED and BEST SCORE are tracked independently per stage.',

	// === Troop colours (部隊色) ===
	troopColors:
		'Which 部隊色 (troop colours) are selectable in the colour picker. Three are always on; the rest are earned via DUEL all-clears and online-win milestones.',

	// === Campaign (戦略ノ章) ===
	chapterListed:
		'Shows the chapter in the CONQUEST chapter list (profile 0x455). The game lists it after a clear in the chapter before it. Listing one lists the chapters before it.',
	chapterAlwaysListed:
		'Chapter 1 and the prologue are always in the CONQUEST chapter list.',
	chapterStage3:
		'Offers stage III in the chapter’s stage list (profile 0x456). The game opens it once stages I and II have both been cleared.',
	scenarioClears:
		'Times cleared (クリア回数), shown in the stage list. Kept in the campaign save block.',
	scenarioBest:
		'Best score (最高得点), shown in the stage list. 5000 until beaten. Kept in the campaign save block.',
	warringStates:
		'The last entry of the CONQUEST chapter list (profile 0x455 bit 5). The game lists it after a clear in Chapter 6.',

	// === Cards / sages ===
	cardsUnlockAll:
		'Treats every Lord card as owned (1 copy). Browse the deck builder freely.',
	cardQuantity:
		'How many copies of this Lord you own. The game uses copies for trading and deck-building constraints.',
	cardObtained:
		'0 copies, but obtained before: the game keeps that flag when copies run out, and some card lists still show it.',
	sagesUnlockAll:
		'Treats every Sage card as owned. They appear in the Sage selection screen.',
	sageLevel:
		'Sage level (1-20). Higher levels widen Tactics gauge and Formation range. Raise by spending food at the Strategy Counter.',

	// === Stats ===
	food: 'Food (兵糧): training currency. Earned per drill, spent in DUEL → Strategy Counter to level Sages and draw cards. Starts at 100.',
	region:
		'Prefecture you chose at first launch (read-only). Stored in the save header; changing it would invalidate the header checksum.',
	offlineRank: 'Lifetime points from DUEL, visible on the title screen.',
	onlineRank: 'Online rating (max 12,000), dormant without Wi-Fi.',
	winsLosses: 'Win / loss / draw totals shown on the player profile screen.',
	masteryCavalry:
		'Skill XP for cavalry charge attacks (0-999). Affects the cavalry chevron on the player profile.',
	masterySpear: 'Skill XP for spear-unit thrust kills (0-999).',
	masteryBow: 'Skill XP for bow-unit run-shot kills (0-999).',
	masteryDefeat:
		'Generic enemy-defeat XP (0-999). Counts every kill regardless of unit type.',
	masterySiege: 'Castle-damage XP (0-999).',
	masteryDefense: 'Castle-defense XP (0-999).',
	masteryDuel: 'One-on-one duel-win XP (0-999).',

	// === Tutorials ===
	tutorial1: 'Tutorial 1: basic controls.',
	tutorial2: 'Tutorial 2: advanced movement.',
	tutorial3: 'Tutorial 3: skills and morale gauge.',
	tutorial4: 'Tutorial 4: sage abilities.',

	// === Achievements ===
	titlesUnlocked:
		'Unlocks all 110 collectible Titles (称号). They show in the profile screen and as a deck banner.',
	campaignEventsUnlocked:
		'Unlocks every entry in the Campaign Event Gallery (cutscene playback).',
	selectedTitle:
		'Which Title is currently displayed on your profile. Pick from the unlocked list.',
} as const;

export type ExplainerKey = keyof typeof EXPLAINERS;
