import {useMemo, useState} from 'react'
import {useSuspenseQuery} from '@tanstack/react-query'
import {getSages} from '@/api/gamedata'
import {SelectFilter, SearchFilter} from '@/components/FilterBar'
import {PageHead} from '@/components/PageHead'
import {SageCard} from '@/components/SageCard'
import {FACTIONS} from '@/types/gamedata'
import {factionLabel} from '@/utils/faction'

const FACTION_OPTIONS = FACTIONS.map(f => ({value: f, label: factionLabel(f)}))

export function Sages() {
	const {data: sages} = useSuspenseQuery({
		queryFn: getSages,
		queryKey: ['sages'],
	})

	const [faction, setFaction] = useState('')
	const [search, setSearch] = useState('')

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		return sages.filter(sage => {
			if (faction && sage.faction !== faction) return false
			if (
				q &&
				!`${sage.name} ${sage.nameJapanese} ${sage.tactics.name} ${sage.formation.name}`
					.toLowerCase()
					.includes(q)
			)
				return false
			return true
		})
	}, [sages, faction, search])

	return (
		<>
			<PageHead title='Sage Cards' />

			<div className='mb-4 flex flex-wrap gap-3 rounded-lg bg-parchment-100 p-3 dark:bg-ink-800'>
				<SearchFilter
					onChange={setSearch}
					placeholder='Name or ability…'
					value={search}
				/>
				<SelectFilter
					label='Faction'
					onChange={setFaction}
					options={FACTION_OPTIONS}
					value={faction}
				/>
			</div>

			<p className='mb-4 text-sm text-ink-400'>
				Showing {filtered.length} of {sages.length} cards
			</p>

			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
				{filtered.map(sage => (
					<SageCard key={sage.cardId} sage={sage} />
				))}
			</div>

			{filtered.length === 0 && (
				<p className='py-12 text-center text-ink-400'>
					No cards match your filters.
				</p>
			)}
		</>
	)
}
