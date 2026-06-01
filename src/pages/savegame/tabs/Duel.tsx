import {useCallback, useState} from 'react';
import {Input} from '@/components/ui/input';
import {Switch} from '@/components/ui/switch';
import {useSave} from '@/contexts/useSave';
import {type SaveProfile, STAGE_TABLE} from '@/save-tools';
import {EXPLAINERS} from '../explainers';

type TutorialKey = keyof SaveProfile['training']['tutorials'];

const TUTORIALS: {key: TutorialKey; label: string; explainer: string}[] = [
	{key: 'tutorial1', label: 'Tutorial 1', explainer: EXPLAINERS.tutorial1},
	{key: 'tutorial2', label: 'Tutorial 2', explainer: EXPLAINERS.tutorial2},
	{key: 'tutorial3', label: 'Tutorial 3', explainer: EXPLAINERS.tutorial3},
	{key: 'tutorial4', label: 'Tutorial 4', explainer: EXPLAINERS.tutorial4},
];

type Difficulty = 'Easy' | 'Normal' | 'Hard';
const DIFFICULTIES: Difficulty[] = ['Easy', 'Normal', 'Hard'];

const STAGES_BY_DIFFICULTY: Record<
	Difficulty,
	{stageId: string; index: number; name: string}[]
> = {Easy: [], Normal: [], Hard: []};
for (const s of STAGE_TABLE) {
	STAGES_BY_DIFFICULTY[s.difficulty].push({
		stageId: s.stageId,
		index: s.index,
		name: s.name,
	});
}

/* ------------------------------------------------------------------------ */
/* Difficulty unlocks (playable tier)                                       */
/* ------------------------------------------------------------------------ */

function DifficultyUnlocks() {
	const {profile, mutate} = useSave();
	const onNormal = useCallback(
		(checked: boolean) => {
			mutate(draft => {
				draft.training.normalUnlocked = checked;
			});
		},
		[mutate],
	);
	const onHard = useCallback(
		(checked: boolean) => {
			mutate(draft => {
				draft.training.hardUnlocked = checked;
			});
		},
		[mutate],
	);
	if (!profile) return null;
	const t = profile.training;

	return (
		<section className='gold-stroke flex flex-col gap-3 bg-surface-low p-4'>
			<header>
				<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
					Difficulty unlocks (playable)
				</p>
				<p className='text-text-faint text-xs'>
					Whether each list is PLAYABLE, separate from clearing or scoring its
					stages below.
				</p>
			</header>
			<div className='flex flex-col gap-3'>
				<div className='flex items-center justify-between gap-2'>
					<span className='flex flex-col text-xs'>
						<span className='font-medium text-text'>Normal</span>
						<span className='text-text-faint'>{EXPLAINERS.normalUnlocked}</span>
					</span>
					<Switch
						aria-label='Normal mode playable'
						checked={t.normalUnlocked}
						onCheckedChange={onNormal}
					/>
				</div>
				<div className='flex items-center justify-between gap-2'>
					<span className='flex flex-col text-xs'>
						<span className='font-medium text-text'>Hard</span>
						<span className='text-text-faint'>{EXPLAINERS.hardUnlocked}</span>
					</span>
					<Switch
						aria-label='Hard mode playable'
						checked={t.hardUnlocked}
						onCheckedChange={onHard}
					/>
				</div>
			</div>
		</section>
	);
}

/* ------------------------------------------------------------------------ */
/* Per-stage records (cleared + best score, kept DISTINCT)                  */
/* ------------------------------------------------------------------------ */

function StageRow({
	stageId,
	index,
	name,
}: {
	stageId: string;
	index: number;
	name: string;
}) {
	const {profile, mutate} = useSave();
	const onCleared = useCallback(
		(checked: boolean) => {
			mutate(draft => {
				const cur = draft.training.stages[stageId] ?? {
					completed: false,
					highScore: 0,
				};
				draft.training.stages[stageId] = {...cur, completed: checked};
			});
		},
		[mutate, stageId],
	);
	const onScore = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = Math.max(0, Math.min(65_535, Number(e.target.value) || 0));
			mutate(draft => {
				const cur = draft.training.stages[stageId] ?? {
					completed: false,
					highScore: 0,
				};
				draft.training.stages[stageId] = {...cur, highScore: value};
			});
		},
		[mutate, stageId],
	);
	if (!profile) return null;
	const result = profile.training.stages[stageId] ?? {
		completed: false,
		highScore: 0,
	};

	return (
		<div className='flex items-center gap-3 border-border-dim border-b py-1.5 last:border-b-0'>
			<span className='w-6 shrink-0 text-right font-mono text-text-faint text-xs tabular-nums'>
				{String(index).padStart(2, '0')}
			</span>
			<span className='min-w-0 flex-1 truncate text-text-muted text-xs'>
				{name}
			</span>
			<span
				className='flex shrink-0 items-center gap-1.5'
				title={EXPLAINERS.stageCleared}
			>
				<span className='font-sans text-[10px] text-text-faint uppercase'>
					Cleared
				</span>
				<Switch
					aria-label={`${stageId} cleared`}
					checked={result.completed}
					onCheckedChange={onCleared}
				/>
			</span>
			<Input
				aria-label={`${stageId} best score`}
				className='w-20 shrink-0 border-0 border-border-dim border-b bg-transparent text-right font-mono text-text text-xs'
				inputMode='numeric'
				max={65_535}
				min={0}
				onChange={onScore}
				title={EXPLAINERS.stageScore}
				type='number'
				value={result.highScore}
			/>
		</div>
	);
}

function DifficultyStages({difficulty}: {difficulty: Difficulty}) {
	const {profile} = useSave();
	const stages = STAGES_BY_DIFFICULTY[difficulty];
	if (!profile) return null;

	const locked =
		(difficulty === 'Normal' && !profile.training.normalUnlocked) ||
		(difficulty === 'Hard' && !profile.training.hardUnlocked);
	const clearedCount = stages.filter(
		s => profile.training.stages[s.stageId]?.completed,
	).length;

	return (
		<section className='gold-stroke flex flex-col gap-2 bg-surface-low p-4'>
			<header className='flex items-baseline justify-between'>
				<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
					{difficulty}: {stages.length} stages
				</p>
				<span className='text-text-faint text-xs tabular-nums'>
					{locked ? 'Tier locked · ' : ''}
					{clearedCount}/{stages.length} cleared
				</span>
			</header>
			<div className='flex flex-col'>
				{stages.map(s => (
					<StageRow
						index={s.index}
						key={s.stageId}
						name={s.name}
						stageId={s.stageId}
					/>
				))}
			</div>
		</section>
	);
}

function PerStageSection() {
	const [open, setOpen] = useState(false);
	const toggle = useCallback(() => {
		setOpen(o => !o);
	}, []);

	return (
		<section className='flex flex-col gap-3'>
			<header className='flex items-center justify-between'>
				<span className='flex flex-col'>
					<span className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
						Per-stage records
					</span>
					<span className='text-text-faint text-xs'>
						{EXPLAINERS.duelStages}
					</span>
				</span>
				<button
					className='border border-border-dim px-3 py-1 font-sans text-text text-xs uppercase tracking-wider hover:border-gold'
					onClick={toggle}
					type='button'
				>
					{open ? 'Hide' : 'Edit stages'}
				</button>
			</header>
			{open
				? DIFFICULTIES.map(d => <DifficultyStages difficulty={d} key={d} />)
				: null}
		</section>
	);
}

/* ------------------------------------------------------------------------ */
/* Tutorials                                                                */
/* ------------------------------------------------------------------------ */

function TutorialRow({tut}: {tut: (typeof TUTORIALS)[number]}) {
	const {profile, mutate} = useSave();
	const onChange = useCallback(
		(checked: boolean) => {
			mutate(draft => {
				draft.training.tutorials[tut.key] = checked;
			});
		},
		[mutate, tut.key],
	);
	if (!profile) return null;
	return (
		<div className='flex flex-col gap-1 text-xs' title={tut.explainer}>
			<span className='text-text-muted'>{tut.label}</span>
			<Switch
				aria-label={tut.label}
				checked={profile.training.tutorials[tut.key]}
				onCheckedChange={onChange}
			/>
		</div>
	);
}

function TutorialsSection() {
	return (
		<section className='gold-stroke flex flex-col gap-3 bg-surface-low p-4'>
			<header>
				<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
					Tutorials
				</p>
			</header>
			<div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
				{TUTORIALS.map(tut => (
					<TutorialRow key={tut.key} tut={tut} />
				))}
			</div>
		</section>
	);
}

/* ------------------------------------------------------------------------ */
/* Training currency (food / 兵糧)                                          */
/* ------------------------------------------------------------------------ */

function FoodSection() {
	const {profile, mutate} = useSave();
	const onChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = Math.max(0, Math.min(99_999, Number(e.target.value) || 0));
			mutate(draft => {
				draft.stats.food = value;
			});
		},
		[mutate],
	);
	if (!profile) return null;
	return (
		<section className='gold-stroke flex flex-col gap-3 bg-surface-low p-4'>
			<header>
				<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
					Food (兵糧)
				</p>
				<p className='text-text-faint text-xs'>{EXPLAINERS.food}</p>
			</header>
			<Input
				className='w-32 border-0 border-border-dim border-b bg-transparent font-mono text-base text-text'
				inputMode='numeric'
				max={99_999}
				min={0}
				onChange={onChange}
				type='number'
				value={profile.stats.food}
			/>
		</section>
	);
}

/* ------------------------------------------------------------------------ */

export function Duel() {
	const {profile} = useSave();
	if (!profile) return null;

	return (
		<div className='flex flex-col gap-5'>
			<DifficultyUnlocks />
			<PerStageSection />
			<TutorialsSection />
			<FoodSection />
		</div>
	);
}
