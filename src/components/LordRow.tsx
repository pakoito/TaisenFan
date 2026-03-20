import {useCallback} from 'react'
import {RangeImage} from '@/components/RangeImage'
import type {LordCard} from '@/types/gamedata'
import {getFactionConfig} from '@/utils/faction'

// ============================================================================
// Color helpers
// ============================================================================

function rarityColor(rarity: string): string {
	switch (rarity) {
		case 'SR':
			return 'text-han'
		case 'R':
			return 'text-wu'
		case 'UC':
			return 'text-shu'
		case 'LE':
			return 'text-gold'
		default:
			return 'text-text-faint'
	}
}

function attrColor(attr: string): string {
	switch (attr) {
		case 'Heaven':
			return 'text-wu'
		case 'Earth':
			return 'text-gold-muted'
		case 'Man':
			return 'text-shu'
		default:
			return ''
	}
}

// ============================================================================
// Row component
// ============================================================================

interface LordRowProps {
	lord: LordCard
	expanded: boolean
	onToggle: (cardId: number) => void
}

export function LordRow({lord, expanded, onToggle}: LordRowProps) {
	const cfg = getFactionConfig(lord.faction)

	const handleClick = useCallback(() => {
		onToggle(lord.cardId)
	}, [lord.cardId, onToggle])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault()
				onToggle(lord.cardId)
			}
		},
		[lord.cardId, onToggle]
	)

	return (
		<>
			<tr
				className={`cursor-pointer transition-colors duration-75 hover:bg-surface-highest focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-[-2px] motion-reduce:transition-none ${cfg.rowBg}`}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				tabIndex={0}
			>
				<td className='px-2 py-2 text-center'>
					<span
						className={`inline-flex h-7 w-7 items-center justify-center font-black font-serif text-[11px] ${cfg.cls}`}
						title={cfg.label}
					>
						{cfg.kanji}
					</span>
				</td>
				<td className='px-2 py-2'>
					<span className='font-medium text-text'>{lord.name}</span>
					<span className='ml-1.5 text-text-dim text-xs'>
						{lord.nameJapanese}
					</span>
				</td>
				<td className='px-2 py-2 text-center'>
					<span className={`font-bold text-xs ${rarityColor(lord.rarity)}`}>
						{lord.rarity}
					</span>
				</td>
				<td className='px-2 py-2 text-center font-bold tabular-nums'>
					{lord.cost}
				</td>
				<td className='px-2 py-2 text-center tabular-nums'>{lord.pow}</td>
				<td className='px-2 py-2 text-center tabular-nums'>{lord.int}</td>
				<td className='px-2 py-2 text-center text-text-muted text-xs'>
					{lord.unitType}
				</td>
				<td
					className={`px-2 py-2 text-center font-medium text-xs ${attrColor(lord.attribute)}`}
				>
					{lord.attribute}
				</td>
				<td className='px-2 py-2'>
					<TraitBadges traits={lord.traits} />
				</td>
				<td className='px-2 py-2 font-medium text-gold-dim'>
					{lord.skill.name}
				</td>
				<td className='px-2 py-2 text-center tabular-nums'>
					{lord.skill.morale}
				</td>
				<td className='px-2 py-2 text-center'>
					<RangeImage
						className='mx-auto border border-surface-highest bg-surface-high'
						range={lord.skill.range}
					/>
				</td>
			</tr>
			{expanded ? <ExpandedRow lord={lord} /> : null}
		</>
	)
}

// ============================================================================
// Expanded detail
// ============================================================================

function ExpandedRow({lord}: {lord: LordCard}) {
	const cfg = getFactionConfig(lord.faction)

	return (
		<tr className={`${cfg.rowBg}`}>
			<td className='px-4 py-5' colSpan={12}>
				<div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
					<SkillDetail lord={lord} />
					<LoreDetail lord={lord} />
				</div>
			</td>
		</tr>
	)
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
	)
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
	)
}

// ============================================================================
// Trait badges
// ============================================================================

function TraitBadges({traits}: {traits: readonly string[]}) {
	if (traits.length === 0) {
		return <span className='text-text-dim text-xs'>—</span>
	}

	return (
		<div className='flex flex-wrap gap-0.5'>
			{traits.map(t => (
				<span
					className='bg-shu/10 px-1 py-px font-medium font-sans text-[10px] text-shu'
					key={t}
				>
					{t}
				</span>
			))}
		</div>
	)
}
