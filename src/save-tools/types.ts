/**
 * Save Profile Types (v2)
 *
 * User-centric typed JSON for the save profile.
 * Mirrors how players think about the game.
 *
 * Design principles:
 * - No derived/redundant fields that can desync
 * - All-or-nothing for untranslatable collections (titles, campaign events)
 * - Human-readable identifiers (card names, sage names)
 */

// =============================================================================
// TOP-LEVEL STRUCTURE
// =============================================================================

export type SaveProfile = {
	/**
	 * Player-entered nickname. Lives in the unencrypted header at 0x0C
	 * (Shift_JIS, max 12 bytes ≈ 6 full-width chars). Surfaced here so
	 * the editor sees the whole save through one type.
	 */
	playerName: string;
	/**
	 * Prefecture code from the unencrypted header at 0x44 (e.g. 福岡→0x01,
	 * 鳥取→0x28, 宮崎→44). Read-only passthrough: the editor surfaces it but
	 * does not let the player change their region, and the original byte is
	 * preserved on write.
	 */
	regionCode: number;
	stats: PlayerStats;
	training: TrainingProgress;
	/** Unlocked selectable troop colours (部隊色). See TroopColors. */
	troopColors: TroopColors;
	campaign: CampaignProgress;
	cards: CardCollection;
	sages: SageCollection;
	achievements: Achievements;
	decks: DeckSlot[];
};

// =============================================================================
// PLAYER STATS
// =============================================================================

export type WinLossRecord = {
	wins: number;
	losses: number;
	draws: number;
};

export type MasterySkills = {
	cavalry: number; // 騎兵 - Horse Charge mastery (0-999)
	spear: number; // 槍兵 - Spear Thrust mastery
	bow: number; // 弓兵 - Bow Run Shot mastery
	defeat: number; // 撃破 - Kill enemies mastery
	siege: number; // 攻城 - Castle damage mastery
	defense: number; // 防衛 - Castle defense mastery
	duel: number; // 一騎討 - Duel wins mastery
};

export type PlayerStats = {
	offline: WinLossRecord;
	online: WinLossRecord;
	offlineRank: number; // 0x0C u32 — offline 熟練度 XP (drives 級/品 ladder)
	onlineRank: number; // 0x10 u32 — online rank XP (max 12000, drives Wi-Fi title)
	/**
	 * 0x14 u32 — 兵糧 training currency, +100/drill. Earned per drill and spent
	 * in DUEL → Strategy Counter. Starts at 100. The on-screen 総兵糧 may be a
	 * cumulative/derived total, distinct from this stored balance. (The
	 * xp-tracking counter at 0x18 is NOT food.)
	 */
	food: number;
	/**
	 * 0x18 u32 — XP-tracking counter that mirrors offline XP (0x0C). Maintained
	 * by the game; surfaced read-only so an uploaded save's value survives a
	 * round-trip but the editor does not invite the player to desync it.
	 */
	xpTracking: number;
	mastery: MasterySkills;
};

// =============================================================================
// TRAINING MODE (DUEL)
// =============================================================================

export type Tutorials = {
	tutorial1: boolean; // Basic Controls
	tutorial2: boolean; // Advanced Movement
	tutorial3: boolean; // Skills and MP
	tutorial4: boolean; // Sage Abilities
};

/**
 * A single DUEL drill stage. The three facets are DISTINCT and must never be
 * conflated (validated against the save format):
 *
 *  - `completed` — the explicit per-difficulty CLEARED bitmask bit
 *    (Easy 0x24C / Normal 0x2EC / Hard 0x38C). A stage can be cleared with a
 *    best score of 0. NEVER derive "completed" from "highScore > 0".
 *  - `highScore` — the BEST SCORE u16 array
 *    (Easy 0x25C / Normal 0x2FC / Hard 0x39C). S-rank threshold is 30000+.
 *
 * Whether a stage is even PLAYABLE (unlocked) is a per-difficulty tier gate
 * held in TrainingProgress.normalUnlocked / hardUnlocked (0x455), not here.
 */
export type StageResult = {
	completed: boolean;
	highScore: number; // S-rank threshold is 30000+
};

export type TrainingProgress = {
	// Easy mode (20 stages) is always available - no unlock flag needed
	normalUnlocked: boolean; // Unlocked by completing all Easy (bit 6 of 0x455)
	hardUnlocked: boolean; // Unlocked by completing all Normal (bit 7 of 0x455)
	tutorials: Tutorials;
	// Key format: "Easy-01" through "Easy-20", "Normal-01" through "Normal-40", "Hard-01" through "Hard-20"
	stages: Record<string, StageResult>;
};

// =============================================================================
// TROOP COLOURS (部隊色)
// =============================================================================

/**
 * The nine selectable troop colours. The three base colours are always
 * available; the six extras are unlocked via DUEL all-clears and online-win
 * milestones. Storage: profile 0x42D (bits) + 0x42E bit0 (white).
 *
 *  | colour  | byte.bit  | unlock trigger              |
 *  |---------|-----------|-----------------------------|
 *  | red     | 0x42D.0   | base (always)               |
 *  | blue    | 0x42D.1   | base (always)               |
 *  | green   | 0x42D.2   | base (always)               |
 *  | purple  | 0x42D.3   | DUEL Normal (難) all-clear  |
 *  | black   | 0x42D.4   | 20 online wins              |
 *  | yellow  | 0x42D.5   | DUEL Easy (普) all-clear    |
 *  | pink    | 0x42D.6   | 100 online wins             |
 *  | cyan    | 0x42D.7   | DUEL Hard (激) all-clear    |
 *  | white   | 0x42E.0   | 50 online wins              |
 *
 * Default 0x42D = 0x07 (red+blue+green). "All nine" = 0x42D = 0xFF, 0x42E |= 1.
 */
export type TroopColor =
	| 'red'
	| 'blue'
	| 'green'
	| 'purple'
	| 'black'
	| 'yellow'
	| 'pink'
	| 'cyan'
	| 'white';

export type TroopColors = Record<TroopColor, boolean>;

// =============================================================================
// CAMPAIGN MODE (CONQUEST)
// =============================================================================

export type ChapterProgress = {
	unlocked: boolean; // Can play this chapter (bit in 0x455)
	stage1Completed: boolean;
	stage2Completed: boolean;
	stage3Completed: boolean; // "Hero's Campaign" - hardest
	rewardCardObtained: boolean;
};

export type Chapter3Variants = {
	yellowTurbanRebellion: boolean; // 黄巾の乱
	tyrantDemonKing: boolean; // 暴虐の魔王
	rivalWarlords: boolean; // 群雄割拠
	redCliffs: boolean; // 赤壁の戦い
	threeKingdomsDivision: boolean; // 天下三分
	mightiestWarrior: boolean; // 最強の武
};

export type WarringStatesProgress = {
	unlocked: boolean;
	completed: boolean;
	highScore: number;
};

/**
 * CONQUEST progress. Three facets are DISTINCT (never conflated):
 *
 *  - chapter/mode UNLOCKED — `chapters[n].unlocked`, bits 0-5 of 0x455
 *    (playability), plus the Normal/Hard difficulty tier in 0x455 bits 6-7.
 *  - EVENT VIEWED in the gallery — `SaveProfile.achievements`
 *    `campaignEventsUnlocked` (profile bitmask at 0x1C), NOT a campaign field.
 *  - mission CLEARED + SCORE — lives in the encrypted campaign block at
 *    0x43C4 (per-stage records) / chapter-graph node mirror. That data is
 *    a single-sample RAW structure: it is READ-ONLY / EXPERIMENTAL and the
 *    editor must NOT mutate it. The `stageNCompleted` / `rewardCardObtained`
 *    flags here drive the profile-block chapter-completion bitmask (0x456)
 *    only — they are NOT the per-stage campaign-block records.
 *
 * The site is allowed to mutate the campaign block's `active` flag and the
 * event gallery (0x1C) ONLY; the raw mission/score records are off-limits.
 */
export type CampaignProgress = {
	chapters: {
		chapter1: ChapterProgress; // Yellow Turban Rebellion
		chapter2: ChapterProgress; // The Tyrant Demon King
		chapter3: ChapterProgress; // Warlord Era
		chapter4: ChapterProgress; // The Strongest Warrior
		chapter5: ChapterProgress; // Battle of Red Cliffs
		chapter6: ChapterProgress; // Three Kingdoms
	};
	chapter3Variants: Chapter3Variants;
	warringStates: WarringStatesProgress;
};

// =============================================================================
// CARDS
// =============================================================================

export type CardQuantity = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type CardEntry = {
	quantity: CardQuantity;
	name?: string; // Optional - for display/reference only
};

export type CardCollection = {
	unlockAll?: boolean; // If true, ignore individual entries and unlock everything
	cards: Record<string, CardEntry>; // Key: "Wei-001", "Shu-019", etc.
};

// =============================================================================
// SAGES
// =============================================================================

export type SageName =
	// Wei (魏)
	| 'Chen Qun'
	| 'Guo Jia'
	| 'Sima Yi'
	| 'Xun Yu'
	| 'Xun You'
	// Shu (蜀)
	| 'Mi Zhu'
	| 'Zhuge Liang'
	| 'Pang Tong'
	| 'Ma Su'
	| 'Fa Zheng'
	// Wu (呉)
	| 'Zhou Yu'
	| 'Zhang Zhao'
	| 'Lu Meng'
	| 'Lu Su'
	| 'Lu Xun'
	// Rogue (群雄)
	| 'Mi Heng'
	| 'Jia Xu'
	| 'Zhang Jiao'
	| 'Chen Gong'
	| 'Li Ru';

export type SageEntry = {
	unlocked: boolean;
	level: number; // 1-20
};

export type SageCollection = {
	unlockAll?: boolean; // If true, unlock all sages at level 1
	sages: Record<SageName, SageEntry>;
};

// =============================================================================
// ACHIEVEMENTS
// =============================================================================

/**
 * State of a bitfield-backed achievement region.
 *
 * - `'none'`: every bit cleared (write a fresh zero region)
 * - `'all'`:  every bit set (write a flood of 0xFF)
 * - `'partial'`: in-progress state read from an uploaded save; the codec
 *   preserves the original bytes verbatim on the next write so the player
 *   doesn't lose mid-game progress
 */
export type AchievementBitfield = 'none' | 'all' | 'partial';

export type Achievements = {
	titlesUnlocked: AchievementBitfield; // 110 titles, bitmask at 0x445-0x452
	campaignEventsUnlocked: AchievementBitfield; // 251 events, bitmask at 0x1C-0x3B
	episodeCompletion: AchievementBitfield; // 6 chapters × 3 episodes, 0x3C-0x43
	selectedTitle: number; // 0-109, displayed title
	/** Raw 14-byte title bitmask preserved when state is 'partial' */
	titlesRaw?: Uint8Array;
	/** Raw 32-byte event-gallery bitmask preserved when state is 'partial' */
	campaignEventsRaw?: Uint8Array;
	/** Raw 8-byte episode-completion bitmask preserved when state is 'partial' */
	episodeCompletionRaw?: Uint8Array;
};

// =============================================================================
// DECK SLOTS
// =============================================================================

export type DeckSlot = {
	name: string; // Up to 7 characters (14 bytes ShiftJIS)
	sage: SageName | null; // Assigned sage
	cards: string[]; // Card IDs (up to 8 cards)
	isEmpty: boolean; // True if slot is unused
};

// =============================================================================
// UTILITIES
// =============================================================================

export type DeepPartial<T> = T extends (infer _U)[]
	? T
	: T extends object
		? {[P in keyof T]?: DeepPartial<T[P]>}
		: T;

// Preset types for common operations
export type PresetName =
	| 'fresh' // Vanilla — same as a brand-new save
	| 'starter' // All content unlocked, no outcomes recorded
	| 'full'; // Maxed out — everything cleared, every counter at cap
