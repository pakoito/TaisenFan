import {Button} from '@/components/ui/button';
import {useSave} from '@/contexts/useSave';
import {
	CARD_TOTAL_SLOTS,
	type PresetName,
	SAGE_COUNT,
	type SaveProfile,
} from '@/save-tools';

type PresetButton = {
	preset: PresetName;
	label: string;
	hint: string;
};

const PRESET_BUTTONS: PresetButton[] = [
	{
		preset: 'fresh',
		label: 'Vanilla',
		hint: 'Reset to a brand-new save — nothing unlocked, food 100, no completion records.',
	},
	{
		preset: 'starter',
		label: 'Starter',
		hint: 'Every DUEL difficulty, CONQUEST chapter, episode, Lord, and Sage unlocked — no completion or outcomes recorded.',
	},
	{
		preset: 'full',
		label: 'Full',
		hint: 'Maxed save: every duel S-ranked at 40k, every chapter cleared, every sage at level 20, all titles, full food, every flag on.',
	},
];

function countUnlockedCards(profile: SaveProfile): number {
	if (profile.cards.unlockAll) return CARD_TOTAL_SLOTS;
	let n = 0;
	for (const entry of Object.values(profile.cards.cards)) {
		if (entry.quantity > 0) n += 1;
	}
	return n;
}

function countUnlockedSages(profile: SaveProfile): number {
	if (profile.sages.unlockAll) return SAGE_COUNT;
	let n = 0;
	for (const entry of Object.values(profile.sages.sages)) {
		if (entry.unlocked) n += 1;
	}
	return n;
}

function countChaptersUnlocked(profile: SaveProfile): number {
	return Object.values(profile.campaign.chapters).filter(c => c.unlocked)
		.length;
}

export function Overview() {
	const {profile, applyPresetReset} = useSave();
	if (!profile) return null;

	const stats = [
		{
			label: 'Lords unlocked',
			value: `${countUnlockedCards(profile)} / ${CARD_TOTAL_SLOTS}`,
		},
		{
			label: 'Sages unlocked',
			value: `${countUnlockedSages(profile)} / ${SAGE_COUNT}`,
		},
		{
			label: 'Chapters open',
			value: `${countChaptersUnlocked(profile)} / 6`,
		},
		{label: 'Food (training)', value: String(profile.stats.food)},
		{
			label: 'DUEL Normal',
			value: profile.training.normalUnlocked ? 'Open' : 'Locked',
		},
		{
			label: 'DUEL Hard',
			value: profile.training.hardUnlocked ? 'Open' : 'Locked',
		},
	];

	return (
		<div className='flex flex-col gap-6'>
			<section>
				<h3 className='mb-3 font-serif text-gold text-sm uppercase tracking-wider'>
					Snapshot
				</h3>
				<div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
					{stats.map(s => (
						<div className='gold-stroke bg-surface-low p-3' key={s.label}>
							<p className='font-sans text-[10px] text-text-faint uppercase tracking-wider'>
								{s.label}
							</p>
							<p className='mt-1 font-bold font-serif text-gold text-lg tabular-nums'>
								{s.value}
							</p>
						</div>
					))}
				</div>
			</section>

			<section>
				<h3 className='mb-3 font-serif text-gold text-sm uppercase tracking-wider'>
					Presets
				</h3>
				<p className='mb-3 text-text-faint text-xs'>
					Bulk-apply a known good state. Existing progress is overwritten only
					where the preset says so.
				</p>
				<div className='flex flex-col gap-2'>
					{PRESET_BUTTONS.map(p => (
						<div
							className='flex flex-col gap-1 border-border-dim border-l-2 pl-3 sm:flex-row sm:items-center sm:gap-3'
							key={p.preset}
						>
							<Button
								className='w-full sm:w-40'
								onClick={() => {
									applyPresetReset(p.preset).catch(() => undefined);
								}}
								size='sm'
								variant='outline'
							>
								{p.label}
							</Button>
							<p className='text-text-muted text-xs'>{p.hint}</p>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
