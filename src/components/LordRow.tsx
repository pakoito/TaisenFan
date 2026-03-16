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
			return 'text-emerald-600 dark:text-emerald-400'
		case 'LE':
			return 'text-gold-500'
		default:
			return 'text-ink-400'
	}
}

function attrColor(attr: string): string {
	switch (attr) {
		case 'Heaven':
			return 'text-sky-600 dark:text-sky-400'
		case 'Earth':
			return 'text-amber-600 dark:text-amber-400'
		case 'Man':
			return 'text-green-600 dark:text-green-400'
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
				className={`cursor-pointer border-parchment-200 border-b transition-colors duration-75 hover:bg-parchment-200/60 dark:border-ink-700 dark:hover:bg-ink-700/50 ${cfg.rowBg}`}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				tabIndex={0}
			>
				<td className='px-2 py-1.5 text-center'>
					<span
						className={`inline-flex h-7 w-7 items-center justify-center rounded font-black text-[11px] ${cfg.cls}`}
						title={cfg.label}
					>
						{cfg.kanji}
					</span>
				</td>
				<td className='px-2 py-1.5'>
					<span className='font-medium text-ink-800 dark:text-parchment-100'>
						{lord.name}
					</span>
					<span className='ml-1.5 text-ink-400 text-xs'>
						{lord.nameJapanese}
					</span>
				</td>
				<td className='px-2 py-1.5 text-center'>
					<span className={`font-bold text-xs ${rarityColor(lord.rarity)}`}>
						{lord.rarity}
					</span>
				</td>
				<td className='px-2 py-1.5 text-center font-bold tabular-nums'>
					{lord.cost}
				</td>
				<td className='px-2 py-1.5 text-center tabular-nums'>{lord.pow}</td>
				<td className='px-2 py-1.5 text-center tabular-nums'>{lord.int}</td>
				<td className='px-2 py-1.5 text-center text-xs'>{lord.unitType}</td>
				<td
					className={`px-2 py-1.5 text-center font-medium text-xs ${attrColor(lord.attribute)}`}
				>
					{lord.attribute}
				</td>
				<td className='px-2 py-1.5'>
					<TraitBadges traits={lord.traits} />
				</td>
				<td className='px-2 py-1.5 font-medium text-gold-600 dark:text-gold-400'>
					{lord.skill.name}
				</td>
				<td className='px-2 py-1.5 text-center tabular-nums'>
					{lord.skill.morale}
				</td>
				<td className='px-2 py-1.5 text-center'>
					<RangeImage
						className='mx-auto rounded border border-parchment-300 bg-parchment-50 dark:border-ink-600 dark:bg-ink-800'
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
		<tr className={`border-gold-500/30 border-b-2 ${cfg.rowBg}`}>
			<td className='px-4 py-4' colSpan={12}>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					<SkillDetail lord={lord} />
					<LoreDetail lord={lord} />
				</div>
			</td>
		</tr>
	)
}

function SkillDetail({lord}: {lord: LordCard}) {
	return (
		<div className='rounded-lg border border-gold-500/20 bg-white/60 p-3 dark:bg-ink-900/60'>
			<div className='mb-2 flex items-center justify-between'>
				<span className='font-bold text-gold-600 dark:text-gold-400'>
					{lord.skill.name}
				</span>
				<div className='flex items-center gap-2'>
					<RangeImage
						className='rounded border border-parchment-300 bg-parchment-50 dark:border-ink-600 dark:bg-ink-800'
						range={lord.skill.range}
					/>
					<span className='rounded bg-crimson-600 px-1.5 py-0.5 font-bold text-[10px] text-white'>
						{lord.skill.morale} MP
					</span>
				</div>
			</div>
			<div className='mb-1 text-ink-400 text-xs'>
				{lord.skill.range.replaceAll('_', ' ')} · {lord.skill.duration}
			</div>
			<p className='whitespace-pre-line text-ink-600 text-sm leading-relaxed dark:text-parchment-300'>
				{lord.skill.description}
			</p>
		</div>
	)
}

function LoreDetail({lord}: {lord: LordCard}) {
	return (
		<div className='rounded-lg border border-gold-500/20 bg-white/60 p-3 dark:bg-ink-900/60'>
			<p className='mb-3 whitespace-pre-line border-gold-400/50 border-l-2 pl-3 text-ink-500 text-sm italic leading-relaxed dark:text-parchment-400'>
				{lord.lore}
			</p>
			<p className='whitespace-pre-line text-ink-600 text-sm dark:text-parchment-300'>
				"{lord.battleCry}"
			</p>
			<div className='mt-3 flex justify-between text-[10px] text-ink-400'>
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
		return <span className='text-ink-300 text-xs'>—</span>
	}

	return (
		<div className='flex flex-wrap gap-0.5'>
			{traits.map(t => (
				<span
					className='rounded bg-emerald-700/15 px-1 py-px font-medium text-[10px] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
					key={t}
				>
					{t}
				</span>
			))}
		</div>
	)
}
