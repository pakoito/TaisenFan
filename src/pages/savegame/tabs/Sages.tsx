import {useSuspenseQuery} from '@tanstack/react-query';
import {useMemo} from 'react';
import {getSages} from '@/api/gamedata';
import {Button} from '@/components/ui/button';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {useRom} from '@/contexts/useRom';
import {useSave} from '@/contexts/useSave';
import {cn} from '@/lib/utils';
import {SAGE_TABLE, type SageName, type SaveProfile} from '@/save-tools';
import type {SageCard} from '@/types/gamedata';
import {factionBorder, getFactionConfig} from '@/utils/faction';
import {EXPLAINERS} from '../explainers';

function effectiveEntry(profile: SaveProfile, name: SageName) {
	const entry = profile.sages.sages[name];
	if (profile.sages.unlockAll) {
		return {unlocked: entry?.unlocked ?? true, level: entry?.level ?? 1};
	}
	return {unlocked: entry?.unlocked ?? false, level: entry?.level ?? 1};
}

function ensureExplicit(draft: SaveProfile): void {
	if (!draft.sages.unlockAll) return;
	const explicit = {} as Record<SageName, {unlocked: boolean; level: number}>;
	for (const sage of SAGE_TABLE) {
		const existing = draft.sages.sages[sage.name];
		explicit[sage.name] = {
			unlocked: existing?.unlocked ?? true,
			level: existing?.level ?? 1,
		};
	}
	draft.sages = {sages: explicit};
}

function SageFace({sage, url}: {sage: SageCard; url: string | undefined}) {
	if (url) {
		return (
			<img
				alt={sage.name}
				className='h-10 w-auto object-contain [image-rendering:pixelated]'
				height={40}
				src={url}
				width={32}
			/>
		);
	}
	const cfg = getFactionConfig(sage.faction);
	return (
		<span
			className={cn(
				'inline-flex h-10 w-8 items-center justify-center font-black font-serif text-xs',
				cfg.cls,
			)}
		>
			{cfg.kanji}
		</span>
	);
}

function SageHeader({
	sage,
	unlocked,
	onToggle,
}: {
	sage: SageCard;
	unlocked: boolean;
	onToggle: (checked: boolean) => void;
}) {
	const {images} = useRom();
	const url = images.get(sage.faceKey);
	return (
		<header className='flex items-center gap-2'>
			<SageFace sage={sage} url={url} />
			<div className='min-w-0 flex-1'>
				<p className='truncate font-medium font-serif text-gold text-sm'>
					{sage.name}
				</p>
				<p className='truncate text-text-faint text-[10px]'>
					{sage.tactics.name} · {sage.formation.name}
				</p>
			</div>
			<Switch
				aria-label={`Unlock ${sage.name}`}
				checked={unlocked}
				onCheckedChange={onToggle}
			/>
		</header>
	);
}

function SageLevelRow({
	level,
	unlocked,
	onChange,
}: {
	level: number;
	unlocked: boolean;
	onChange: (level: number) => void;
}) {
	return (
		<div className='flex items-center gap-2'>
			<span className='w-10 text-text-faint text-[10px] uppercase tracking-wider'>
				Lv
			</span>
			<Slider
				disabled={!unlocked}
				max={20}
				min={1}
				onValueChange={values => {
					const next = values[0];
					if (typeof next === 'number') onChange(next);
				}}
				step={1}
				value={[level]}
			/>
			<span className='w-7 text-right font-bold text-gold text-xs tabular-nums'>
				{level}
			</span>
		</div>
	);
}

function SageTile({sage}: {sage: SageCard}) {
	const {profile, mutate} = useSave();
	const name = sage.name as SageName;
	if (!profile) return null;
	const {unlocked, level} = effectiveEntry(profile, name);

	return (
		<div
			className={cn(
				'flex flex-col gap-2 border-l-2 bg-surface-low p-3',
				factionBorder(sage.faction),
			)}
		>
			<SageHeader
				onToggle={checked => {
					mutate(draft => {
						ensureExplicit(draft);
						const entry = draft.sages.sages[name] ?? {
							unlocked: false,
							level: 1,
						};
						draft.sages.sages[name] = {...entry, unlocked: checked};
					});
				}}
				sage={sage}
				unlocked={unlocked}
			/>
			<SageLevelRow
				level={level}
				onChange={next => {
					mutate(draft => {
						ensureExplicit(draft);
						const entry = draft.sages.sages[name] ?? {
							unlocked: false,
							level: 1,
						};
						draft.sages.sages[name] = {...entry, level: next};
					});
				}}
				unlocked={unlocked}
			/>
		</div>
	);
}

export function Sages() {
	const {profile, mutate} = useSave();
	const {data: sages} = useSuspenseQuery({
		queryFn: getSages,
		queryKey: ['sages'],
	});

	const sorted = useMemo(
		() => [...sages].sort((a, b) => a.sortNo - b.sortNo),
		[sages],
	);

	if (!profile) return null;

	const unlockedCount = profile.sages.unlockAll
		? sorted.length
		: Object.values(profile.sages.sages).filter(s => s.unlocked).length;

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-wrap items-center gap-3'>
				<p className='font-sans text-text-muted text-xs uppercase tracking-wider'>
					{unlockedCount} / {sorted.length} sages unlocked
				</p>
				<Button
					onClick={() => {
						mutate(draft => {
							draft.sages = {unlockAll: true, sages: draft.sages.sages};
						});
					}}
					size='sm'
					variant='outline'
				>
					Unlock all
				</Button>
				<Button
					onClick={() => {
						mutate(draft => {
							draft.sages = {sages: {} as SaveProfile['sages']['sages']};
						});
					}}
					size='sm'
					variant='ghost'
				>
					Lock all
				</Button>
				<Button
					onClick={() => {
						mutate(draft => {
							ensureExplicit(draft);
							for (const sage of SAGE_TABLE) {
								const entry = draft.sages.sages[sage.name];
								if (entry) entry.level = 1;
							}
						});
					}}
					size='sm'
					variant='ghost'
				>
					Reset levels
				</Button>
			</div>

			<p className='text-text-faint text-xs'>{EXPLAINERS.sageLevel}</p>

			<div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
				{sorted.map(sage => (
					<SageTile key={sage.cardId} sage={sage} />
				))}
			</div>
		</div>
	);
}
