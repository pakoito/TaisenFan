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
// CAMPAIGN MODE (CONQUEST, 戦略ノ章)
// =============================================================================

/**
 * One 戦略ノ章 scenario's record in the campaign ("history") block's keep
 * part, which survives 新規 and the scenario result's discard (sgst-port
 * docs/modding/campaign-save.md §3, keep part).
 */
export type ScenarioRecord = {
	/**
	 * Times cleared, the stage list's クリア回数: s16 at H+0x5890 + 2s. A clear
	 * adds 1 (ov001 0x020F776C). `null` is the game's −1, "never opened": the
	 * stage list shows it as 0, and starting the scenario sets it to 0
	 * (0x020F4280). It also decides whether a clear is a NEW unlock: a clear
	 * of chapter c raises the next chapter's list flag only while that
	 * chapter's first scenario is still −1 (0x020F77B0).
	 */
	clears: number | null;
	/** Best score, the stage list's 最高得点: u32 at H+0x58B8 + 4s. Default 5000. */
	bestScore: number;
};

/**
 * A chapter of the 戦略ノ章 chapter list (第一章..第六章). Chapter n holds
 * scenarios 3(n−1) + 0..2, its stages I, II and III.
 */
export type ChapterProgress = {
	/**
	 * In the chapter list. 第一章 is always listed (this reads true and is not
	 * written). 第n章 (n = 2..6) is profile 0x455 bit n−2: the list shows
	 * 序章, 第一章 and one entry per bit up to the highest bit set (ov001
	 * 0x02154550..0x021545BC). The game sets it after a clear in chapter n−1,
	 * through its pending copy 0x453 and the unlock notice.
	 */
	listed: boolean;
	/**
	 * Stage III offered in the stage list: profile 0x456 bit n−1 (bit 8+n−1
	 * of the array at 0x455; ov001 0x02155634). Stages I and II are always
	 * offered. The game sets it at a scenario result once stages I and II
	 * have both been cleared (0x0214F4CC..0x0214F570), through 0x454.
	 */
	stage3: boolean;
	/** Stages I, II and III. */
	stages: [ScenarioRecord, ScenarioRecord, ScenarioRecord];
};

/**
 * 戦略ノ章 progress. What the scenario select shows and allows, as the code
 * reads it (sgst-port docs/modding/campaign-save.md §3, keep part):
 *
 *  - The chapter LIST: profile 0x455 bits 0..5 (第二章..第六章, 戦乱).
 *    序章 (scenario 19) and 第一章 are always listed.
 *  - STAGE III of chapter n: profile 0x456 bit n−1.
 *  - Clear counts and best scores: the campaign block's keep part.
 *
 * The keep part alone does not open a chapter: a save whose keep part says
 * "open" but whose 0x455 bit is clear does not list it, and a later clear
 * does not list it either, because the clear only raises the flag while the
 * next chapter's first scenario is −1. The editor keeps them together
 * (setCampaignEntryListed). The event gallery (`achievements`
 * campaignEventsUnlocked, profile 0x1C) is a separate thing.
 */
export type CampaignProgress = {
	chapters: {
		chapter1: ChapterProgress; // 黄巾の乱
		chapter2: ChapterProgress; // 暴虐の魔王
		chapter3: ChapterProgress; // 群雄割拠
		chapter4: ChapterProgress; // 最強の武
		chapter5: ChapterProgress; // 赤壁の戦い
		chapter6: ChapterProgress; // 天下三分
	};
	/**
	 * 戦乱 (Warring States), scenario 18: the list's last entry, profile 0x455
	 * bit 5. The game lists it after a clear in 第六章.
	 */
	warringStates: {listed: boolean; record: ScenarioRecord};
};

// =============================================================================
// CARDS
// =============================================================================

export type CardQuantity = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type CardEntry = {
	/** Copies owned: the ownership byte's low nibble. */
	quantity: CardQuantity;
	name?: string; // Optional - for display/reference only
	/**
	 * The ownership byte's flag bits (bits 4-7) as read: 0x10 = obtained (the
	 * game sets it with any count > 0 and never clears it), 0x20 = set by the
	 * post-drill draw and the deck editor. Omitted = keep the save's flags.
	 * A card with 0 copies is listed only while it has flags.
	 */
	flags?: number;
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
	/**
	 * The stored selected-title value when it is not `selectedTitle + 19`
	 * (0xFFFF "none", or a value that encodes no title). Written back while
	 * selectedTitle still decodes from it; drop it when the title is edited.
	 */
	selectedTitleRaw?: number;
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
