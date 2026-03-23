import {LORD_GRID} from '@/components/lord-grid';
import {RangeImage} from '@/components/RangeImage';
import {AccordionContent, AccordionTrigger} from '@/components/ui/accordion';
import {Badge} from '@/components/ui/badge';
import {useRom} from '@/contexts/useRom';
import {cn} from '@/lib/utils';
import type {LordCard} from '@/types/gamedata';
import {type FactionConfig, getFactionConfig} from '@/utils/faction';

// ============================================================================
// Color helpers
// ============================================================================

function rarityColor(rarity: string): string {
	switch (rarity) {
		case 'SR':
			return 'text-han';
		case 'R':
			return 'text-wu';
		case 'UC':
			return 'text-shu';
		case 'LE':
			return 'text-gold';
		default:
			return 'text-text-faint';
	}
}

function attrColor(attr: string): string {
	switch (attr) {
		case 'Heaven':
			return 'text-wu';
		case 'Earth':
			return 'text-gold-muted';
		case 'Man':
			return 'text-shu';
		default:
			return '';
	}
}

// ============================================================================
// Row component (AccordionTrigger + AccordionContent)
// ============================================================================

type LordRowProps = {
	lord: LordCard;
};

export function LordRow({lord}: LordRowProps) {
	const cfg = getFactionConfig(lord.faction);
	const {images} = useRom();
	const miniBustupUrl = images.get(lord.miniBustupKey);

	return (
		<>
			<AccordionTrigger
				className={cn(
					LORD_GRID,
					'cursor-pointer py-2 transition-colors duration-75 hover:bg-surface-highest hover:no-underline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-[-2px] motion-reduce:transition-none',
					'[&>*[data-slot=accordion-trigger-icon]]:hidden',
					cfg.rowBg,
				)}
			>
				<span className='flex items-center justify-center'>
					{miniBustupUrl ? (
						<img
							alt={lord.name}
							className='h-10 w-10 object-contain [image-rendering:pixelated]'
							height={64}
							src={miniBustupUrl}
							width={64}
						/>
					) : (
						<span
							className={cn(
								'inline-flex h-7 w-7 items-center justify-center font-black font-serif text-[11px]',
								cfg.cls,
							)}
							title={cfg.label}
						>
							{cfg.kanji}
						</span>
					)}
				</span>
				<span>
					<span className='font-medium text-text'>{lord.name}</span>
					<span className='ml-1.5 text-text-dim text-xs'>
						{lord.nameJapanese}
					</span>
				</span>
				<span className='text-center'>
					<span className={cn('font-bold text-xs', rarityColor(lord.rarity))}>
						{lord.rarity}
					</span>
				</span>
				<span className='text-center font-bold tabular-nums'>{lord.cost}</span>
				<span className='text-center tabular-nums'>{lord.pow}</span>
				<span className='text-center tabular-nums'>{lord.int}</span>
				<span className='text-center text-text-muted text-xs'>
					{lord.unitType}
				</span>
				<span
					className={cn(
						'text-center font-medium text-xs',
						attrColor(lord.attribute),
					)}
				>
					{lord.attribute}
				</span>
				<span>
					<TraitBadges traits={lord.traits} />
				</span>
				<span className='font-medium text-gold-dim'>{lord.skill.name}</span>
				<span className='text-center tabular-nums'>{lord.skill.morale}</span>
				<span className='text-center'>
					<RangeImage
						className='mx-auto border border-surface-highest bg-surface-high'
						range={lord.skill.range}
					/>
				</span>
			</AccordionTrigger>
			<AccordionContent>
				<ExpandedDetail
					bustupUrl={images.get(lord.bustupKey)}
					cfg={cfg}
					lord={lord}
				/>
			</AccordionContent>
		</>
	);
}

// ============================================================================
// Expanded detail
// ============================================================================

function ExpandedDetail({
	lord,
	cfg,
	bustupUrl,
}: {
	lord: LordCard;
	cfg: FactionConfig;
	bustupUrl: string | undefined;
}) {
	return (
		<div className={cn('px-4 py-5', cfg.rowBg)}>
			<div
				className={cn(
					'grid gap-5',
					bustupUrl
						? 'grid-cols-1 md:grid-cols-[auto_1fr_1fr]'
						: 'grid-cols-1 md:grid-cols-2',
				)}
			>
				{bustupUrl ? (
					<div className='flex items-start justify-center'>
						<img
							alt={lord.name}
							className='w-auto [image-rendering:pixelated]'
							height={256}
							src={bustupUrl}
							width={256}
						/>
					</div>
				) : null}
				<SkillDetail lord={lord} />
				<LoreDetail lord={lord} />
			</div>
		</div>
	);
}

function SkillDetail({lord}: {lord: LordCard}) {
	return (
		<div className='gold-stroke bg-surface-high p-4'>
			<div className='mb-3 flex items-center justify-between'>
				<span className='font-bold font-serif text-gold'>
					{lord.skill.name}
				</span>
				<div className='flex items-center gap-2'>
					<RangeImage
						className='border border-surface-highest bg-surface-mid'
						range={lord.skill.range}
					/>
					<span className='bg-cinnabar px-1.5 py-0.5 font-bold font-sans text-[10px] text-gold'>
						{lord.skill.morale} MP
					</span>
				</div>
			</div>
			<div className='mb-2 font-sans text-text-dim text-xs uppercase tracking-wider'>
				{lord.skill.range.replaceAll('_', ' ')} · {lord.skill.duration}
			</div>
			<p className='whitespace-pre-line text-sm text-text-muted leading-relaxed'>
				{lord.skill.description}
			</p>
		</div>
	);
}

function LoreDetail({lord}: {lord: LordCard}) {
	return (
		<div className='chronicle-scroll bg-surface-low p-4'>
			<p className='mb-3 whitespace-pre-line border-cinnabar/30 border-l-2 pl-3 text-sm text-text-faint italic leading-relaxed'>
				{lord.lore}
			</p>
			<p className='whitespace-pre-line text-sm text-text-muted'>
				&ldquo;{lord.battleCry}&rdquo;
			</p>
			<div className='brushstroke-sep mt-4 mb-2' />
			<div className='flex justify-between font-sans text-[10px] text-text-dim uppercase tracking-wider'>
				<span>Art: {lord.artist}</span>
				<span>
					{lord.birthYear ?? '?'}–{lord.deathYear ?? '?'}
				</span>
			</div>
		</div>
	);
}

// ============================================================================
// Trait badges
// ============================================================================

function TraitBadges({traits}: {traits: readonly string[]}) {
	if (traits.length === 0) {
		return <span className='text-text-dim text-xs'>—</span>;
	}

	return (
		<span className='flex flex-wrap gap-0.5'>
			{traits.map(t => (
				<Badge
					className='bg-shu/10 px-1 py-px font-medium font-sans text-[10px] text-shu'
					key={t}
					variant='ghost'
				>
					{t}
				</Badge>
			))}
		</span>
	);
}
