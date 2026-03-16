import {useCallback, useState} from 'react'
import type {SageAbility, SageCard as SageCardType} from '@/types/gamedata'
import {factionBorder, factionHeaderBg} from '@/utils/faction'
import {RangeImage} from './RangeImage'
import {RarityBadge} from './RarityBadge'

interface Props {
	sage: SageCardType
}

export function SageCard({sage}: Props) {
	const [collapsed, setCollapsed] = useState(true)
	const toggleCollapsed = useCallback(() => {
		setCollapsed(c => !c)
	}, [])

	return (
		<article
			className={`overflow-hidden rounded-lg border-2 bg-white shadow transition-transform duration-150 hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none dark:bg-ink-800 ${factionBorder(sage.faction)}`}
		>
			{/* Header */}
			<div
				className={`flex items-center justify-between px-3 py-2 ${factionHeaderBg(sage.faction)}`}
			>
				<div className='min-w-0'>
					<div className='truncate font-bold'>{sage.name}</div>
					<div className='text-sm opacity-90'>{sage.nameJapanese}</div>
				</div>
				<div className='flex flex-col items-end gap-1'>
					<RarityBadge rarity={sage.rarity} />
					<span className='text-xs opacity-80'>{sage.cardIndex}</span>
				</div>
			</div>

			<div className='p-3'>
				{/* Abilities */}
				<AbilityBlock ability={sage.tactics} label='Tactics (兵略)' />
				<AbilityBlock
					ability={sage.formation}
					label='Formation (陣略)'
					sage={true}
				/>

				{/* Lore (collapsible) */}
				<button
					className='mb-1 w-full text-left font-medium text-ink-500 text-sm hover:text-ink-700 dark:text-parchment-400 dark:hover:text-parchment-200'
					onClick={toggleCollapsed}
					type='button'
				>
					{collapsed ? '▶' : '▼'} Lore &amp; Dialogue
				</button>
				{collapsed ? null : (
					<div>
						<p className='mb-2 whitespace-pre-line border-parchment-300 border-l-2 pl-3 text-ink-400 text-sm italic dark:border-ink-600 dark:text-parchment-500'>
							{sage.lore}
						</p>
						<p className='text-ink-500 text-sm dark:text-parchment-400'>
							&ldquo;{sage.battleCry}&rdquo;
						</p>
					</div>
				)}

				{/* Meta */}
				<div className='mt-3 flex justify-between text-ink-400 text-xs'>
					<span>Artist: {sage.artist}</span>
					<span>
						{sage.birthYear ?? '?'} – {sage.deathYear ?? '?'}
					</span>
				</div>
			</div>
		</article>
	)
}

function AbilityBlock({
	ability,
	label,
	sage = false
}: {
	ability: SageAbility
	label: string
	sage?: boolean
}) {
	return (
		<div className='mb-3 rounded-lg bg-parchment-50 p-3 dark:bg-ink-900'>
			<div className='mb-1 font-medium text-ink-400 text-xs uppercase tracking-wide'>
				{label}
			</div>
			<div className='mb-2 flex items-center justify-between'>
				<span className='font-bold text-gold-500'>{ability.name}</span>
				<span className='text-ink-400 text-xs'>
					Gauge: {ability.gaugeMax} · {ability.affinity}
				</span>
			</div>
			<div className='mb-2 flex items-center gap-2'>
				<RangeImage
					className='rounded border border-parchment-300 bg-parchment-100 dark:border-ink-600 dark:bg-ink-800'
					range={ability.range}
					sage={sage}
				/>
				<span className='text-ink-400 text-sm'>
					{ability.range.replaceAll('_', ' ')} · Target: {ability.target}
				</span>
			</div>
			<p className='whitespace-pre-line text-ink-600 text-sm dark:text-parchment-300'>
				{ability.description}
			</p>
		</div>
	)
}
