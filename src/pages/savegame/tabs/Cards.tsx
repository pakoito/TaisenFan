import {useSuspenseQuery} from '@tanstack/react-query';
import {useCallback, useMemo, useState} from 'react';
import {getLords} from '@/api/gamedata';
import {SearchFilter, SelectFilter} from '@/components/FilterBar';
import {Button} from '@/components/ui/button';
import {useRom} from '@/contexts/useRom';
import {useSave} from '@/contexts/useSave';
import {cn} from '@/lib/utils';
import type {CardEntry, CardQuantity, SaveProfile} from '@/save-tools';
import {
	FACTIONS,
	type Faction,
	type LordCard,
	RARITIES,
} from '@/types/gamedata';
import {getFactionConfig, getFactionLabel} from '@/utils/faction';
import {cardIdForLord} from '../lord-card-map';

const RARITY_OPTS = RARITIES.map(r => ({value: r, label: r}));
const FACTION_OPTS = FACTIONS.map(f => ({value: f, label: getFactionLabel(f)}));

/* ------------------------------------------------------------------------ */

function effectiveQuantity(profile: SaveProfile, cardId: string): CardQuantity {
	if (profile.cards.unlockAll) {
		const entry = profile.cards.cards[cardId];
		return entry?.quantity ?? 1;
	}
	return profile.cards.cards[cardId]?.quantity ?? 0;
}

/**
 * Mutate the profile so the given card has `qty` copies. Collapsing the
 * `unlockAll` shorthand into explicit entries is necessary when the user
 * sets a single card to anything other than 1.
 */
function setCardQuantity(
	draft: SaveProfile,
	allLords: LordCard[],
	cardId: string,
	qty: CardQuantity,
	displayName: string,
): void {
	if (draft.cards.unlockAll) {
		// Materialize the implicit "1 copy each" baseline before diverging.
		const explicit: Record<string, CardEntry> = {};
		for (const lord of allLords) {
			const id = cardIdForLord(lord);
			explicit[id] = {quantity: 1, name: lord.name};
		}
		draft.cards = {cards: explicit};
	}
	if (qty === 0) {
		delete draft.cards.cards[cardId];
	} else {
		draft.cards.cards[cardId] = {quantity: qty, name: displayName};
	}
}

/* ------------------------------------------------------------------------ */

function PortraitTile({
	lord,
	quantity,
	onChange,
}: {
	lord: LordCard;
	quantity: CardQuantity;
	onChange: (q: CardQuantity) => void;
}) {
	const cfg = getFactionConfig(lord.faction);
	const {images} = useRom();
	const url = images.get(lord.miniBustupKey);
	const owned = quantity > 0;

	return (
		<div
			className={cn(
				'flex flex-col items-center gap-1 border p-1 transition-colors',
				owned ? 'border-gold bg-surface-low' : 'border-border-dim opacity-60',
			)}
		>
			<button
				aria-label={`Toggle ${lord.name}`}
				className='block focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2'
				onClick={() => {
					onChange(owned ? 0 : 1);
				}}
				title={lord.name}
				type='button'
			>
				{url ? (
					<img
						alt={lord.name}
						className='h-10 w-10 object-contain [image-rendering:pixelated]'
						height={64}
						src={url}
						width={64}
					/>
				) : (
					<span
						className={cn(
							'inline-flex h-10 w-10 items-center justify-center font-black font-serif text-xs',
							cfg.cls,
						)}
					>
						{cfg.kanji}
					</span>
				)}
			</button>
			<span className='line-clamp-1 text-center text-[10px] text-text-muted'>
				{lord.name}
			</span>
			<div className='flex items-center gap-1'>
				<Button
					disabled={quantity === 0}
					onClick={() => {
						onChange(Math.max(0, quantity - 1) as CardQuantity);
					}}
					size='icon-xs'
					variant='outline'
				>
					−
				</Button>
				<span className='w-4 text-center font-bold text-gold text-xs tabular-nums'>
					{quantity}
				</span>
				<Button
					disabled={quantity === 9}
					onClick={() => {
						onChange(Math.min(9, quantity + 1) as CardQuantity);
					}}
					size='icon-xs'
					variant='outline'
				>
					+
				</Button>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------------ */

const FACTION_ORDER: Faction[] = [
	'Wei',
	'Shu',
	'Wu',
	'Other',
	'LE',
	'EX',
	'DS',
];

/* ------------------------------------------------------------------------ */

function useFilteredLords(lords: LordCard[]) {
	const [factionFilter, setFactionFilter] = useState('');
	const [rarityFilter, setRarityFilter] = useState('');
	const [search, setSearch] = useState('');

	const filtered = useMemo(() => {
		const q = search.toLowerCase().trim();
		return lords.filter(l => {
			if (factionFilter && l.faction !== factionFilter) return false;
			if (rarityFilter && l.rarity !== rarityFilter) return false;
			if (q) {
				const hay = `${l.name} ${l.nameJapanese} ${l.cardIndex}`.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			return true;
		});
	}, [factionFilter, rarityFilter, search, lords]);

	const grouped = useMemo(() => {
		const groups = new Map<Faction, LordCard[]>();
		for (const lord of filtered) {
			const arr = groups.get(lord.faction) ?? [];
			arr.push(lord);
			groups.set(lord.faction, arr);
		}
		for (const arr of groups.values()) {
			arr.sort((a, b) => a.sortNo - b.sortNo);
		}
		return groups;
	}, [filtered]);

	return {
		factionFilter,
		setFactionFilter,
		rarityFilter,
		setRarityFilter,
		search,
		setSearch,
		grouped,
	};
}

/* ------------------------------------------------------------------------ */

function CardsToolbar({
	totalOwned,
	total,
	search,
	setSearch,
	factionFilter,
	setFactionFilter,
	rarityFilter,
	setRarityFilter,
	onUnlockAll,
	onLockAll,
}: {
	totalOwned: number;
	total: number;
	search: string;
	setSearch: (v: string) => void;
	factionFilter: string;
	setFactionFilter: (v: string) => void;
	rarityFilter: string;
	setRarityFilter: (v: string) => void;
	onUnlockAll: () => void;
	onLockAll: () => void;
}) {
	return (
		<div className='flex flex-wrap items-center gap-3'>
			<p className='font-sans text-text-muted text-xs uppercase tracking-wider'>
				{totalOwned} / {total} owned
			</p>
			<div className='flex flex-wrap gap-2'>
				<Button onClick={onUnlockAll} size='sm' variant='outline'>
					Unlock all
				</Button>
				<Button onClick={onLockAll} size='sm' variant='ghost'>
					Lock all
				</Button>
			</div>
			<div className='ml-auto flex flex-wrap items-end gap-3'>
				<SearchFilter onChange={setSearch} value={search} />
				<SelectFilter
					label='Faction'
					onChange={setFactionFilter}
					options={FACTION_OPTS}
					value={factionFilter}
				/>
				<SelectFilter
					label='Rarity'
					onChange={setRarityFilter}
					options={RARITY_OPTS}
					value={rarityFilter}
				/>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------------ */

function FactionGroupHeader({
	faction,
	owned,
	total,
	onAll,
	onNone,
}: {
	faction: Faction;
	owned: number;
	total: number;
	onAll: () => void;
	onNone: () => void;
}) {
	const cfg = getFactionConfig(faction);
	return (
		<header className='mb-2 flex flex-wrap items-center gap-3'>
			<span
				className={cn(
					'inline-flex h-7 items-center px-2 font-black font-serif text-xs tracking-wider',
					cfg.cls,
				)}
			>
				{cfg.label}
			</span>
			<span className='text-text-muted text-xs tabular-nums'>
				{owned} / {total}
			</span>
			<div className='ml-auto flex gap-2'>
				<Button onClick={onAll} size='xs' variant='outline'>
					All
				</Button>
				<Button onClick={onNone} size='xs' variant='ghost'>
					None
				</Button>
			</div>
		</header>
	);
}

function FactionGroup({
	faction,
	lords,
	allLords,
}: {
	faction: Faction;
	lords: LordCard[];
	allLords: LordCard[];
}) {
	const {profile, mutate} = useSave();
	const bulk = useCallback(
		(qty: CardQuantity) => {
			mutate(draft => {
				for (const lord of lords) {
					setCardQuantity(draft, allLords, cardIdForLord(lord), qty, lord.name);
				}
			});
		},
		[allLords, lords, mutate],
	);
	if (!profile) return null;

	const owned = lords.filter(
		l => effectiveQuantity(profile, cardIdForLord(l)) > 0,
	).length;

	return (
		<section key={faction}>
			<FactionGroupHeader
				faction={faction}
				onAll={() => {
					bulk(1);
				}}
				onNone={() => {
					bulk(0);
				}}
				owned={owned}
				total={lords.length}
			/>
			<div className='grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-10'>
				{lords.map(lord => {
					const cardId = cardIdForLord(lord);
					return (
						<PortraitTile
							key={cardId}
							lord={lord}
							onChange={q => {
								mutate(draft => {
									setCardQuantity(draft, allLords, cardId, q, lord.name);
								});
							}}
							quantity={effectiveQuantity(profile, cardId)}
						/>
					);
				})}
			</div>
		</section>
	);
}

/* ------------------------------------------------------------------------ */

export function Cards() {
	const {profile, mutate} = useSave();
	const {data: lords} = useSuspenseQuery({
		queryFn: getLords,
		queryKey: ['lords'],
	});
	const filters = useFilteredLords(lords);

	if (!profile) return null;

	const totalOwned = profile.cards.unlockAll
		? lords.length
		: Object.values(profile.cards.cards).filter(e => e.quantity > 0).length;

	return (
		<div className='flex flex-col gap-4'>
			<CardsToolbar
				factionFilter={filters.factionFilter}
				onLockAll={() => {
					mutate(draft => {
						draft.cards = {cards: {}};
					});
				}}
				onUnlockAll={() => {
					mutate(draft => {
						draft.cards = {unlockAll: true, cards: {}};
					});
				}}
				rarityFilter={filters.rarityFilter}
				search={filters.search}
				setFactionFilter={filters.setFactionFilter}
				setRarityFilter={filters.setRarityFilter}
				setSearch={filters.setSearch}
				total={lords.length}
				totalOwned={totalOwned}
			/>

			<div className='flex flex-col gap-6'>
				{FACTION_ORDER.map(faction => {
					const groupLords = filters.grouped.get(faction);
					if (!groupLords || groupLords.length === 0) return null;
					return (
						<FactionGroup
							allLords={lords}
							faction={faction}
							key={faction}
							lords={groupLords}
						/>
					);
				})}
			</div>
		</div>
	);
}
