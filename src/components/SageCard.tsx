import {useState} from 'react'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger
} from '@/components/ui/collapsible'
import type {SageAbility, SageCard as SageCardType} from '@/types/gamedata'
import {factionBorder, factionHeaderBg} from '@/utils/faction'
import {RangeImage} from './RangeImage'
import {RarityBadge} from './RarityBadge'

interface Props {
	sage: SageCardType
}

export function SageCard({sage}: Props) {
	const [open, setOpen] = useState(false)

	return (
		<article
			className={`overflow-hidden border-l-2 bg-surface-high transition-transform duration-150 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none ${factionBorder(sage.faction)}`}
		>
			{/* Header */}
			<div
				className={`flex items-center justify-between px-4 py-3 ${factionHeaderBg(sage.faction)}`}
			>
				<div className='min-w-0'>
					<div className='truncate font-bold font-serif'>{sage.name}</div>
					<div className='text-sm opacity-80'>{sage.nameJapanese}</div>
				</div>
				<div className='flex flex-col items-end gap-1'>
					<RarityBadge rarity={sage.rarity} />
					<span className='font-sans text-xs opacity-60'>{sage.cardIndex}</span>
				</div>
			</div>

			<div className='p-4'>
				{/* Abilities */}
				<AbilityBlock ability={sage.tactics} label='Tactics (兵略)' />
				<AbilityBlock
					ability={sage.formation}
					label='Formation (陣略)'
					sage={true}
				/>

				{/* Lore (collapsible) */}
				<Collapsible onOpenChange={setOpen} open={open}>
					<CollapsibleTrigger className='mb-2 w-full text-left font-medium font-sans text-sm text-text-faint uppercase tracking-wider hover:text-gold'>
						{open ? '▼' : '▶'} Lore &amp; Dialogue
					</CollapsibleTrigger>
					<CollapsibleContent>
						<p className='mb-3 whitespace-pre-line border-cinnabar/30 border-l-2 pl-3 text-sm text-text-faint italic'>
							{sage.lore}
						</p>
						<p className='text-sm text-text-muted'>
							&ldquo;{sage.battleCry}&rdquo;
						</p>
					</CollapsibleContent>
				</Collapsible>

				{/* Meta */}
				<div className='brushstroke-sep mt-4 mb-2' />
				<div className='flex justify-between font-sans text-text-dim text-xs uppercase tracking-wider'>
					<span>Art: {sage.artist}</span>
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
		<div className='mb-4 bg-surface-mid p-3'>
			<div className='mb-1 font-medium font-sans text-text-dim text-xs uppercase tracking-wider'>
				{label}
			</div>
			<div className='mb-2 flex items-center justify-between'>
				<span className='font-bold font-serif text-gold'>{ability.name}</span>
				<span className='font-sans text-text-dim text-xs'>
					Gauge: {ability.gaugeMax} · {ability.affinity}
				</span>
			</div>
			<div className='mb-2 flex items-center gap-2'>
				<RangeImage
					className='border border-surface-highest bg-surface-high'
					range={ability.range}
					sage={sage}
				/>
				<span className='text-sm text-text-faint'>
					{ability.range.replaceAll('_', ' ')} · Target: {ability.target}
				</span>
			</div>
			<p className='whitespace-pre-line text-sm text-text-muted'>
				{ability.description}
			</p>
		</div>
	)
}
