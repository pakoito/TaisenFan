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
		// A vanilla profile starts with every chapter locked — the game's own
		// tutorial flips Chapter 1's bit during first launch.
		expect(round.campaign.chapters.chapter1.unlocked).toBe(false);
		expect(round.cards.unlockAll ?? false).toBe(false);
	});

	it('starter preset round-trips with all unlocks intact', async () => {
		const profile = applyPreset(defaultProfile(), 'starter');
		const sav = await createSave(profile);
		const round = await extractProfile(sav);

		expect(round.training.normalUnlocked).toBe(true);
		expect(round.training.hardUnlocked).toBe(true);
		expect(round.campaign.chapters.chapter1.unlocked).toBe(true);
		expect(round.campaign.chapters.chapter6.unlocked).toBe(true);
		expect(round.campaign.chapters.chapter1.stage1Completed).toBe(false);
		expect(round.cards.unlockAll).toBe(true);
		expect(round.sages.unlockAll).toBe(true);
		expect(round.achievements.titlesUnlocked).toBe('none');
		expect(round.achievements.campaignEventsUnlocked).toBe('none');
	});
});
