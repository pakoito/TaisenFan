import {useSuspenseQuery} from '@tanstack/react-query'
import {useMemo, useState} from 'react'
import {getDecks} from '@/api/gamedata'
import {SearchFilter, SelectFilter} from '@/components/FilterBar'
import {PageHead} from '@/components/PageHead'
import {DIFFICULTIES, type DuelDeck} from '@/types/gamedata'
import {factionBorder, factionHeaderBg} from '@/utils/faction'

const DIFFICULTY_OPTIONS = DIFFICULTIES.map(d => ({value: d, label: d}))

const DIFFICULTY_COLORS: Record<string, string> = {
	Easy: 'bg-emerald-600 text-white',
	Normal: 'bg-gold-500 text-ink-900',
	Hard: 'bg-han text-white'
}

export function Decks() {
	const {data: decks} = useSuspenseQuery({
		queryFn: getDecks,
		queryKey: ['decks']
	})

	const [difficulty, setDifficulty] = useState('')
	const [search, setSearch] = useState('')

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		return decks.filter(deck => {
			if (difficulty && deck.difficulty !== difficulty) return false
			if (q && !`${deck.name} ${deck.description}`.toLowerCase().includes(q))
				return false
			return true
		})
	}, [decks, difficulty, search])

	return (
		<>
			<PageHead title='Duel Decks' />

			<div className='mb-4 flex flex-wrap gap-3 rounded-lg bg-parchment-100 p-3 dark:bg-ink-800'>
				<SearchFilter
					onChange={setSearch}
					placeholder='Name or description…'
					value={search}
				/>
				<SelectFilter
					label='Difficulty'
					onChange={setDifficulty}
					options={DIFFICULTY_OPTIONS}
					value={difficulty}
				/>
			</div>

			<p className='mb-4 text-ink-400 text-sm'>
				Showing {filtered.length} of {decks.length} decks
			</p>

			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
				{filtered.map(deck => (
					<DeckCard deck={deck} key={`${deck.difficulty}-${deck.deckNo}`} />
				))}
			</div>

			{filtered.length === 0 ? (
				<p className='py-12 text-center text-ink-400'>
					No decks match your filters.
				</p>
			) : null}
		</>
	)
}

function DeckCard({deck}: {deck: DuelDeck}) {
	const sageFaction = deck.sage?.faction ?? 'Other'

	return (
		<article
			className={`overflow-hidden rounded-lg border-2 bg-white shadow dark:bg-ink-800 ${factionBorder(sageFaction)}`}
		>
			<div
				className={`flex items-center justify-between px-3 py-2 ${factionHeaderBg(sageFaction)}`}
			>
				<div className='min-w-0'>
					<div className='truncate font-bold'>{deck.name}</div>
				</div>
				<span
					className={`rounded px-2 py-0.5 font-bold text-xs ${DIFFICULTY_COLORS[deck.difficulty]}`}
				>
					{deck.difficulty}
				</span>
			</div>

			<div className='p-3'>
				<p className='mb-3 whitespace-pre-line text-ink-600 text-sm dark:text-parchment-300'>
					{deck.description}
				</p>

				{/* Deck stats */}
				<div className='mb-3 grid grid-cols-4 gap-1 rounded bg-parchment-50 p-2 text-center text-sm dark:bg-ink-900'>
					<div>
						<div className='text-[10px] text-ink-400 uppercase'>Cost</div>
						<div className='font-bold tabular-nums'>{deck.totalCost}</div>
					</div>
					<div>
						<div className='text-[10px] text-ink-400 uppercase'>Lords</div>
						<div className='font-bold tabular-nums'>{deck.lordCount}</div>
					</div>
					<div>
						<div className='text-[10px] text-ink-400 uppercase'>POW</div>
						<div className='font-bold tabular-nums'>{deck.totalPow}</div>
					</div>
					<div>
						<div className='text-[10px] text-ink-400 uppercase'>INT</div>
						<div className='font-bold tabular-nums'>{deck.totalInt}</div>
					</div>
				</div>

				{/* Sage */}
				{deck.sage !== null ? (
					<div className='mb-3 text-sm'>
						<span className='font-medium text-gold-500'>Sage:</span>{' '}
						<span className='text-ink-600 dark:text-parchment-300'>
							{deck.sage.name} ({deck.sage.nameJapanese}) —{' '}
							{deck.sage.selectedAbility === 'Tactics'
								? deck.sage.tacticsName
								: deck.sage.formationName}
						</span>
					</div>
				) : null}

				{/* Lords list */}
				{deck.lords.length > 0 ? (
					<div className='space-y-1'>
						{deck.lords.map(lord => (
							<div
								className='flex items-center justify-between rounded bg-parchment-50 px-2 py-1 text-sm dark:bg-ink-900'
								key={lord.cardId}
							>
								<span className='min-w-0 truncate font-medium text-ink-700 dark:text-parchment-200'>
									{lord.name}{' '}
									<span className='text-ink-400'>{lord.nameJapanese}</span>
								</span>
								<span className='ml-2 shrink-0 text-ink-400 text-xs'>
									{lord.cost} · {lord.unitType} · {lord.pow}/{lord.int}
								</span>
							</div>
						))}
					</div>
				) : null}

				{/* Special units */}
				{deck.specialUnits.length > 0 && deck.lords.length === 0 ? (
					<div className='text-ink-400 text-sm'>
						{deck.specialUnits.length} special unit
						{deck.specialUnits.length > 1 ? 's' : ''} (tutorial)
					</div>
				) : null}
			</div>
		</article>
	)
}
