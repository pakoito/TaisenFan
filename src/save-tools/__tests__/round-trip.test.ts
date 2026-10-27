import {
	applyPreset,
	createSave,
	defaultProfile,
	extractProfile,
} from '@/save-tools';

describe('save round-trip', () => {
	it('createSave → extractProfile reproduces a default profile', async () => {
		const original = defaultProfile();
		const sav = await createSave(original);
		expect(sav.byteLength).toBe(65_536);
		// Magic '3GOKUTEN' at offset 0x04
		const magic = String.fromCharCode(...sav.slice(0x04, 0x0c));
		expect(magic).toBe('3GOKUTEN');

		const round = await extractProfile(sav);
		expect(round.stats.food).toBe(original.stats.food);
		expect(round.training.normalUnlocked).toBe(
			original.training.normalUnlocked,
		);
		// A fresh save lists 序章 and 第一章 only; chapter 1 is always listed.
		expect(round.campaign.chapters.chapter1.listed).toBe(true);
		expect(round.campaign.chapters.chapter2.listed).toBe(false);
		expect(round.campaign.chapters.chapter2.stages[0].clears).toBeNull();
		expect(round.cards.unlockAll ?? false).toBe(false);
	});

	it('starter preset round-trips with all unlocks intact', async () => {
		const profile = applyPreset(defaultProfile(), 'starter');
		const sav = await createSave(profile);
		const round = await extractProfile(sav);

		expect(round.training.normalUnlocked).toBe(true);
		expect(round.training.hardUnlocked).toBe(true);
		expect(round.campaign.chapters.chapter6.listed).toBe(true);
		expect(round.campaign.chapters.chapter6.stage3).toBe(true);
		expect(round.campaign.warringStates.listed).toBe(true);
		// createSave writes the keep part into a blank campaign block.
		expect(round.campaign.chapters.chapter6.stages[2].clears).toBe(0);
		expect(round.campaign.chapters.chapter1.stages[0].clears).toBe(0);
		expect(round.cards.unlockAll).toBe(true);
		expect(round.sages.unlockAll).toBe(true);
		expect(round.achievements.titlesUnlocked).toBe('none');
		expect(round.achievements.campaignEventsUnlocked).toBe('none');
	});
});
