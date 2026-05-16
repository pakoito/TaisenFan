import {Input} from '@/components/ui/input';
import {Switch} from '@/components/ui/switch';
import {useSave} from '@/contexts/useSave';
import type {SaveProfile} from '@/save-tools';
import {EXPLAINERS} from '../explainers';

type TutorialKey = keyof SaveProfile['training']['tutorials'];

const TUTORIALS: {key: TutorialKey; label: string; explainer: string}[] = [
	{key: 'tutorial1', label: 'Tutorial 1', explainer: EXPLAINERS.tutorial1},
	{key: 'tutorial2', label: 'Tutorial 2', explainer: EXPLAINERS.tutorial2},
	{key: 'tutorial3', label: 'Tutorial 3', explainer: EXPLAINERS.tutorial3},
	{key: 'tutorial4', label: 'Tutorial 4', explainer: EXPLAINERS.tutorial4},
];

export function Duel() {
	const {profile, mutate} = useSave();
	if (!profile) return null;
	const t = profile.training;

	return (
		<div className='flex flex-col gap-5'>
			<section className='gold-stroke flex flex-col gap-3 bg-surface-low p-4'>
				<header>
					<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
						Difficulty unlocks
					</p>
				</header>
				<div className='flex flex-col gap-3'>
					<div className='flex items-center justify-between gap-2'>
						<span className='flex flex-col text-xs'>
							<span className='font-medium text-text'>Normal</span>
							<span className='text-text-faint'>
								{EXPLAINERS.normalUnlocked}
							</span>
						</span>
						<Switch
							aria-label='Normal mode'
							checked={t.normalUnlocked}
							onCheckedChange={checked => {
								mutate(draft => {
									draft.training.normalUnlocked = checked;
								});
							}}
						/>
					</div>
					<div className='flex items-center justify-between gap-2'>
						<span className='flex flex-col text-xs'>
							<span className='font-medium text-text'>Hard</span>
							<span className='text-text-faint'>{EXPLAINERS.hardUnlocked}</span>
						</span>
						<Switch
							aria-label='Hard mode'
							checked={t.hardUnlocked}
							onCheckedChange={checked => {
								mutate(draft => {
									draft.training.hardUnlocked = checked;
								});
							}}
						/>
					</div>
				</div>
			</section>

			<section className='gold-stroke flex flex-col gap-3 bg-surface-low p-4'>
				<header>
					<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
						Tutorials
					</p>
				</header>
				<div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
					{TUTORIALS.map(tut => (
						<div
							className='flex flex-col gap-1 text-xs'
							key={tut.key}
							title={tut.explainer}
						>
							<span className='text-text-muted'>{tut.label}</span>
							<Switch
								aria-label={tut.label}
								checked={t.tutorials[tut.key]}
								onCheckedChange={checked => {
									mutate(draft => {
										draft.training.tutorials[tut.key] = checked;
									});
								}}
							/>
						</div>
					))}
				</div>
			</section>

			<section className='gold-stroke flex flex-col gap-3 bg-surface-low p-4'>
				<header>
					<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
						Food (training currency)
					</p>
					<p className='text-text-faint text-xs'>{EXPLAINERS.food}</p>
				</header>
				<Input
					className='w-32 border-0 border-border-dim border-b bg-transparent font-mono text-base text-text'
					inputMode='numeric'
					max={99_999}
					min={0}
					onChange={e => {
						const value = Math.max(
							0,
							Math.min(99_999, Number(e.target.value) || 0),
						);
						mutate(draft => {
							draft.stats.food = value;
						});
					}}
					type='number'
					value={profile.stats.food}
				/>
			</section>
		</div>
	);
}
