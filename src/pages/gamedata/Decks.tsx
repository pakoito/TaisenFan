import {useSuspenseQueries} from '@tanstack/react-query';
import {useMemo, useState} from 'react';
import {getDecks, getLords} from '@/api/gamedata';
import {SearchFilter, SelectFilter} from '@/components/FilterBar';
import {PageHead} from '@/components/PageHead';
import {useRom} from '@/contexts/useRom';
import {DIFFICULTIES, type DuelDeck} from '@/types/gamedata';
import {factionBorder, factionHeaderBg} from '@/utils/faction';
import type {ImageKey} from '@/utils/image-catalog';

const DIFFICULTY_OPTIONS = DIFFICULTIES.map(d => ({value: d, label: d}));

const DIFFICULTY_COLORS: Record<string, string> = {
	Easy: 'bg-shu text-white',
	Normal: 'bg-gold-dark text-gold',
	Hard: 'bg-cinnabar text-gold',
};

export function Decks() {
	const [{data: decks}, {data: lords}] = useSuspenseQueries({
		queries: [
			{queryFn: getDecks, queryKey: ['decks']},
			{queryFn: getLords, queryKey: ['lords']},
		],
	});

	const miniBustupByCardId = useMemo(() => {
		const map = new Map<number, ImageKey>();
		for (const lord of lords) {
			map.set(lord.cardId, lord.miniBustupKey);
		}
		return map;
	}, [lords]);

	const [difficulty, setDifficulty] = useState('');
	const [search, setSearch] = useState('');

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		return decks.filter(deck => {
			if (difficulty && deck.difficulty !== difficulty) return false;
			if (q && !`${deck.name} ${deck.description}`.toLowerCase().includes(q))
				return false;
			return true;
		});
	}, [decks, difficulty, search]);

	return (
		<>
			<PageHead title='Duel Decks' />

			<div className='mb-5 flex flex-wrap gap-4 bg-surface-high p-4'>
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

			<p className='mb-5 font-sans text-sm text-text-faint'>
				Showing {filtered.length} of {decks.length} decks
			</p>

			<div className='grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'>
				{filtered.map(deck => (
					<DeckCard
						deck={deck}
						key={`${deck.difficulty}-${deck.deckNo}`}
						miniBustupByCardId={miniBustupByCardId}
					/>
				))}
			</div>

			{filtered.length === 0 ? (
				<p className='py-12 text-center text-text-faint'>
					No decks match your filters.
				</p>
			) : null}
		</>
	);
}

function DeckCard({
	deck,
	miniBustupByCardId,
}: {
	deck: DuelDeck;
	miniBustupByCardId: Map<number, ImageKey>;
}) {
	const sageFaction = deck.sage?.faction ?? 'Other';
	const {images} = useRom();

	return (
		<article
			className={`overflow-hidden border-l-2 bg-surface-high ${factionBorder(sageFaction)}`}
		>
			<div
				className={`flex items-center justify-between px-4 py-3 ${factionHeaderBg(sageFaction)}`}
			>
				<div className='min-w-0'>
					<div className='truncate font-bold font-serif'>{deck.name}</div>
				</div>
				<span
					className={`px-2 py-0.5 font-black font-sans text-xs ${DIFFICULTY_COLORS[deck.difficulty]}`}
				>
					{deck.difficulty}
				</span>
			</div>

			<div className='p-4'>
				<p className='mb-4 whitespace-pre-line text-sm text-text-muted'>
					{deck.description}
				</p>

				{/* Deck stats */}
				<div className='mb-4 grid grid-cols-4 gap-1 bg-surface-mid p-2 text-center font-sans text-sm'>
					<div>
						<div className='text-[10px] text-text-dim uppercase tracking-wider'>
							Cost
						</div>
						<div className='font-bold text-text tabular-nums'>
							{deck.totalCost}
						</div>
					</div>
					<div>
						<div className='text-[10px] text-text-dim uppercase tracking-wider'>
							Lords
						</div>
						<div className='font-bold text-text tabular-nums'>
							{deck.lordCount}
						</div>
					</div>
					<div>
						<div className='text-[10px] text-text-dim uppercase tracking-wider'>
							POW
						</div>
						<div className='font-bold text-text tabular-nums'>
							{deck.totalPow}
						</div>
					</div>
					<div>
						<div className='text-[10px] text-text-dim uppercase tracking-wider'>
							INT
						</div>
						<div className='font-bold text-text tabular-nums'>
							{deck.totalInt}
						</div>
					</div>
				</div>

				{/* Sage */}
				{deck.sage !== null ? (
					<div className='mb-4 text-sm'>
						<span className='font-bold font-serif text-gold'>Sage:</span>{' '}
						<span className='text-text-muted'>
							{deck.sage.name} ({deck.sage.nameJapanese}), using{' '}
							{deck.sage.selectedAbility === 'Tactics'
								? deck.sage.tacticsName
								: deck.sage.formationName}
						</span>
					</div>
				) : null}

				{/* Lords list */}
				{deck.lords.length > 0 ? (
					<div className='space-y-1'>
						{deck.lords.map(lord => {
							const miniKey = miniBustupByCardId.get(lord.cardId);
							const miniUrl = miniKey ? images.get(miniKey) : undefined;
							return (
								<div
									className='flex items-center justify-between gap-2 bg-surface-mid px-3 py-1.5 font-sans text-sm'
									key={lord.cardId}
								>
									<span className='flex min-w-0 items-center gap-2'>
										{miniUrl ? (
											<img
												alt=''
												className='h-8 w-8 shrink-0 object-contain [image-rendering:pixelated]'
												height={64}
												src={miniUrl}
												width={64}
											/>
										) : null}
										<span className='min-w-0 truncate font-medium text-text'>
											{lord.name}{' '}
											<span className='text-text-dim'>{lord.nameJapanese}</span>
										</span>
									</span>
									<span className='shrink-0 text-text-faint text-xs'>
										{lord.cost} · {lord.unitType} · {lord.pow}/{lord.int}
									</span>
								</div>
							);
						})}
					</div>
				) : null}

				{/* Special units */}
				{deck.specialUnits.length > 0 && deck.lords.length === 0 ? (
					<div className='text-sm text-text-faint'>
						{deck.specialUnits.length} special unit
						{deck.specialUnits.length > 1 ? 's' : ''} (tutorial)
					</div>
				) : null}
			</div>
		</article>
	);
}
