import {
	applyPreset,
	defaultProfile,
	SAGE_TABLE,
	STAGE_TABLE,
} from '@/save-tools';

describe('starter preset', () => {
	const profile = applyPreset(defaultProfile(), 'starter');

	it('unlocks both training difficulties', () => {
		expect(profile.training.normalUnlocked).toBe(true);
		expect(profile.training.hardUnlocked).toBe(true);
	});

	it('leaves all tutorials unfinished', () => {
		expect(profile.training.tutorials.tutorial1).toBe(false);
		expect(profile.training.tutorials.tutorial2).toBe(false);
		expect(profile.training.tutorials.tutorial3).toBe(false);
		expect(profile.training.tutorials.tutorial4).toBe(false);
	});

	it('records no stage completions', () => {
		expect(Object.keys(profile.training.stages)).toHaveLength(0);
	});

	it('opens every campaign chapter with no completion', () => {
		for (const chapter of Object.values(profile.campaign.chapters)) {
			expect(chapter.unlocked).toBe(true);
			expect(chapter.stage1Completed).toBe(false);
			expect(chapter.stage2Completed).toBe(false);
			expect(chapter.stage3Completed).toBe(false);
			expect(chapter.rewardCardObtained).toBe(false);
		}
	});

	it('leaves chapter 3 variants and warring states locked', () => {
		for (const variant of Object.values(profile.campaign.chapter3Variants)) {
			expect(variant).toBe(false);
		}
		expect(profile.campaign.warringStates.unlocked).toBe(false);
		expect(profile.campaign.warringStates.completed).toBe(false);
	});

	it('unlocks all cards and sages without per-entry overrides', () => {
		expect(profile.cards.unlockAll).toBe(true);
		expect(Object.keys(profile.cards.cards)).toHaveLength(0);
		expect(profile.sages.unlockAll).toBe(true);
	});

	it('grants no titles, no event gallery, no selected title', () => {
		expect(profile.achievements.titlesUnlocked).toBe('none');
		expect(profile.achievements.campaignEventsUnlocked).toBe('none');
		expect(profile.achievements.selectedTitle).toBe(0);
	});

	it('unlocks every troop colour (selectable menu content)', () => {
		for (const on of Object.values(profile.troopColors)) {
			expect(on).toBe(true);
		}
	});

	it('preserves default stats (food=100, all mastery=0)', () => {
		expect(profile.stats.food).toBe(100);
		expect(profile.stats.mastery.cavalry).toBe(0);
		expect(profile.stats.mastery.duel).toBe(0);
		expect(profile.stats.offline.wins).toBe(0);
	});
});

describe('full preset', () => {
	const profile = applyPreset(defaultProfile(), 'full');

	it('caps food, ranks, and mastery skills', () => {
		expect(profile.stats.food).toBe(9999);
		expect(profile.stats.offlineRank).toBe(99_999);
		expect(profile.stats.onlineRank).toBe(12_000);
		expect(profile.stats.mastery.cavalry).toBe(999);
		expect(profile.stats.mastery.duel).toBe(999);
	});

	it('unlocks every troop colour', () => {
		for (const on of Object.values(profile.troopColors)) {
			expect(on).toBe(true);
		}
	});

	it('completes every chapter and Chapter-3 variant', () => {
		for (const chapter of Object.values(profile.campaign.chapters)) {
			expect(chapter.unlocked).toBe(true);
			expect(chapter.stage1Completed).toBe(true);
			expect(chapter.stage2Completed).toBe(true);
			expect(chapter.stage3Completed).toBe(true);
			expect(chapter.rewardCardObtained).toBe(true);
		}
		for (const variant of Object.values(profile.campaign.chapter3Variants)) {
			expect(variant).toBe(true);
		}
		expect(profile.campaign.warringStates.unlocked).toBe(true);
		expect(profile.campaign.warringStates.completed).toBe(true);
	});

	it('S-ranks every DUEL stage at 40k', () => {
		for (const stage of STAGE_TABLE) {
			const result = profile.training.stages[stage.stageId];
			expect(result?.completed).toBe(true);
			expect(result?.highScore).toBe(40_000);
		}
	});

	it('maxes every sage at level 20', () => {
		for (const sage of SAGE_TABLE) {
			const entry = profile.sages.sages[sage.name];
			expect(entry?.unlocked).toBe(true);
			expect(entry?.level).toBe(20);
		}
	});

	it('grants all titles and the entire event gallery', () => {
		expect(profile.achievements.titlesUnlocked).toBe('all');
		expect(profile.achievements.campaignEventsUnlocked).toBe('all');
	});

	it('marks every tutorial as cleared', () => {
		for (const done of Object.values(profile.training.tutorials)) {
			expect(done).toBe(true);
		}
	});
});

describe('fresh preset (vanilla)', () => {
	const profile = applyPreset(defaultProfile(), 'fresh');

	it('matches the bare default profile', () => {
		const def = defaultProfile();
		expect(profile.stats.food).toBe(def.stats.food);
		expect(profile.training.normalUnlocked).toBe(def.training.normalUnlocked);
		expect(profile.training.hardUnlocked).toBe(def.training.hardUnlocked);
		expect(profile.cards.unlockAll ?? false).toBe(false);
	});
});
