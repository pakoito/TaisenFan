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
	stats: PlayerStats;
	training: TrainingProgress;
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
	offlineRank: number; // 4-byte value
	onlineRank: number; // 2-byte, max 12000
	food: number; // Training mode currency (starts at 100)
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
