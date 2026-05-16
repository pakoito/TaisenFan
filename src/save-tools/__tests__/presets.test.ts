import {applyPreset, defaultProfile} from '@/save-tools';

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

	it('preserves default stats (food=100, all mastery=0)', () => {
		expect(profile.stats.food).toBe(100);
		expect(profile.stats.mastery.cavalry).toBe(0);
		expect(profile.stats.mastery.duel).toBe(0);
		expect(profile.stats.offline.wins).toBe(0);
	});
});
