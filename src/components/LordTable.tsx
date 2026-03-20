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
		<div className='overflow-x-auto'>
			<table className='w-full border-collapse font-sans text-sm'>
				<thead>
					<tr className='bg-surface-highest font-sans text-[11px] text-text-faint uppercase tracking-wider'>
						<th className='w-8 px-2 py-3' />
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
						<th className='px-2 py-3 text-center font-medium'>Type</th>
						<th className='px-2 py-3 text-center font-medium'>Attr</th>
						<th className='px-2 py-3 text-left font-medium'>Traits</th>
						<th className='px-2 py-3 text-left font-medium'>Skill</th>
						<SortTh
							active={sortField === 'morale'}
							dir={sortDir}
							field='morale'
							label='MP'
							onClick={onToggleSort}
						/>
						<th className='w-11 px-2 py-3 text-center font-medium'>Range</th>
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
			className={`cursor-pointer select-none px-2 py-3 font-medium transition-colors hover:text-gold ${left ? 'text-left' : 'text-center'} ${active ? 'text-gold' : ''}`}
			onClick={handleClick}
		>
			{label}
			{arrow}
		</th>
	)
}
