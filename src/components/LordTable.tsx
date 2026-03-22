import {useCallback} from 'react'
import {LordRow} from '@/components/LordRow'
import {LORD_GRID} from '@/components/lord-grid'
import {Accordion, AccordionItem} from '@/components/ui/accordion'
import {cn} from '@/lib/utils'
import type {LordCard} from '@/types/gamedata'
import type {SortDir, SortField} from '@/utils/sort'

export function LordTable({
	lords,
	expanded,
	onToggleExpand,
	sortField,
	sortDir,
	onToggleSort
}: {
	lords: LordCard[]
	expanded: number | null
	onToggleExpand: (value: string) => void
	sortField: SortField
	sortDir: SortDir
	onToggleSort: (field: SortField) => void
}) {
	const accordionValue = expanded !== null ? String(expanded) : ''

	return (
		<div className='overflow-x-auto font-sans text-sm'>
			<LordGridHeader
				onToggleSort={onToggleSort}
				sortDir={sortDir}
				sortField={sortField}
			/>

			<Accordion
				className='flex w-full flex-col'
				collapsible={true}
				onValueChange={onToggleExpand}
				type='single'
				value={accordionValue}
			>
				{lords.map(lord => (
					<AccordionItem
						className='border-none'
						key={lord.cardId}
						value={String(lord.cardId)}
					>
						<LordRow lord={lord} />
					</AccordionItem>
				))}
			</Accordion>
		</div>
	)
}

/* ======================================================================== */
/* Grid header                                                              */
/* ======================================================================== */

function LordGridHeader({
	sortField,
	sortDir,
	onToggleSort
}: {
	sortField: SortField
	sortDir: SortDir
	onToggleSort: (field: SortField) => void
}) {
	return (
		<div
			className={cn(
				LORD_GRID,
				'bg-surface-highest py-2.5 text-[11px] text-text-faint uppercase tracking-wider'
			)}
		>
			<span />
			<SortCol
				active={sortField === 'name'}
				dir={sortDir}
				field='name'
				label='Name'
				left={true}
				onClick={onToggleSort}
			/>
			<SortCol
				active={sortField === 'rarity'}
				dir={sortDir}
				field='rarity'
				label='Rarity'
				onClick={onToggleSort}
			/>
			<SortCol
				active={sortField === 'cost'}
				dir={sortDir}
				field='cost'
				label='Cost'
				onClick={onToggleSort}
			/>
			<SortCol
				active={sortField === 'pow'}
				dir={sortDir}
				field='pow'
				label='POW'
				onClick={onToggleSort}
			/>
			<SortCol
				active={sortField === 'int'}
				dir={sortDir}
				field='int'
				label='INT'
				onClick={onToggleSort}
			/>
			<span className='text-center font-medium'>Type</span>
			<span className='text-center font-medium'>Attr</span>
			<span className='font-medium'>Traits</span>
			<span className='font-medium'>Skill</span>
			<SortCol
				active={sortField === 'morale'}
				dir={sortDir}
				field='morale'
				label='MP'
				onClick={onToggleSort}
			/>
			<span className='text-center font-medium'>Range</span>
		</div>
	)
}

/* ======================================================================== */
/* Sortable column header                                                   */
/* ======================================================================== */

function SortCol({
	label,
	field,
	active,
	dir,
	onClick,
	left = false
}: {
	label: string
	field: SortField
	active: boolean
	dir: SortDir
	onClick: (field: SortField) => void
	left?: boolean
}) {
	const handleClick = useCallback(() => {
		onClick(field)
	}, [onClick, field])

	let arrow = ''
	if (active) {
		arrow = dir === 'asc' ? ' ▲' : ' ▼'
	}
	return (
		<button
			className={cn(
				'cursor-pointer select-none bg-transparent p-0 font-medium transition-colors hover:text-gold',
				left ? 'text-left' : 'text-center',
				active && 'text-gold'
			)}
			onClick={handleClick}
			type='button'
		>
			{label}
			{arrow}
		</button>
	)
}
