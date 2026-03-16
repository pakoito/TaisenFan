import {useCallback} from 'react'
import {LordRow} from '@/components/LordRow'
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
	onToggleExpand: (cardId: number) => void
	sortField: SortField
	sortDir: SortDir
	onToggleSort: (field: SortField) => void
}) {
	return (
		<div className='overflow-x-auto rounded-lg border border-parchment-300 shadow-sm dark:border-ink-600'>
			<table className='w-full border-collapse text-sm'>
				<thead>
					<tr className='bg-ink-700 text-[11px] text-parchment-200 uppercase tracking-wider'>
						<th className='w-8 px-2 py-2.5' />
						<SortTh
							active={sortField === 'name'}
							dir={sortDir}
							field='name'
							label='Name'
							left={true}
							onClick={onToggleSort}
						/>
						<SortTh
							active={sortField === 'rarity'}
							dir={sortDir}
							field='rarity'
							label='Rarity'
							onClick={onToggleSort}
						/>
						<SortTh
							active={sortField === 'cost'}
							dir={sortDir}
							field='cost'
							label='Cost'
							onClick={onToggleSort}
						/>
						<SortTh
							active={sortField === 'pow'}
							dir={sortDir}
							field='pow'
							label='POW'
							onClick={onToggleSort}
						/>
						<SortTh
							active={sortField === 'int'}
							dir={sortDir}
							field='int'
							label='INT'
							onClick={onToggleSort}
						/>
						<th className='px-2 py-2.5 text-center font-medium'>Type</th>
						<th className='px-2 py-2.5 text-center font-medium'>Attr</th>
						<th className='px-2 py-2.5 text-left font-medium'>Traits</th>
						<th className='px-2 py-2.5 text-left font-medium'>Skill</th>
						<SortTh
							active={sortField === 'morale'}
							dir={sortDir}
							field='morale'
							label='MP'
							onClick={onToggleSort}
						/>
						<th className='w-11 px-2 py-2.5 text-center font-medium'>Range</th>
					</tr>
				</thead>
				<tbody>
					{lords.map(lord => (
						<LordRow
							expanded={expanded === lord.cardId}
							key={lord.cardId}
							lord={lord}
							onToggle={onToggleExpand}
						/>
					))}
				</tbody>
			</table>
		</div>
	)
}

function SortTh({
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
		<th
			className={`cursor-pointer select-none px-2 py-2.5 font-medium transition-colors hover:text-gold-300 ${left ? 'text-left' : 'text-center'} ${active ? 'text-gold-300' : ''}`}
			onClick={handleClick}
		>
			{label}
			{arrow}
		</th>
	)
}
