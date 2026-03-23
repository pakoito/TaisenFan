import {useSuspenseQuery} from '@tanstack/react-query';
import {useCallback, useMemo, useState} from 'react';
import {getLords} from '@/api/gamedata';
import {SearchFilter, SelectFilter} from '@/components/FilterBar';
import {LordTable} from '@/components/LordTable';
import {PageHead} from '@/components/PageHead';
import {Button} from '@/components/ui/button';
import {
	ATTRIBUTES,
	FACTIONS,
	RARITIES,
	TRAITS,
	type Trait,
	UNIT_TYPES,
} from '@/types/gamedata';
import {getFactionLabel} from '@/utils/faction';
import {compareLords, type SortDir, type SortField} from '@/utils/sort';

const FACTION_OPTS = FACTIONS.map(f => ({value: f, label: getFactionLabel(f)}));
const UNIT_OPTS = UNIT_TYPES.map(u => ({value: u, label: u}));
const RARITY_OPTS = RARITIES.map(r => ({value: r, label: r}));
const ATTR_OPTS = ATTRIBUTES.map(a => ({value: a, label: a}));
const TRAIT_OPTS = TRAITS.map(t => ({value: t, label: t}));

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: page component with filter state
export function Lords() {
	const {data: lords} = useSuspenseQuery({
		queryFn: getLords,
		queryKey: ['lords'],
	});

	const [faction, setFaction] = useState('');
	const [unitType, setUnitType] = useState('');
	const [rarity, setRarity] = useState('');
	const [attribute, setAttribute] = useState('');
	const [trait, setTrait] = useState('');
	const [search, setSearch] = useState('');
	const [sortField, setSortField] = useState<SortField>('sortNo');
	const [sortDir, setSortDir] = useState<SortDir>('asc');
	const [expanded, setExpanded] = useState<number | null>(null);

	const toggleSort = useCallback((field: SortField) => {
		setSortField(prev => {
			if (prev === field) {
				setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
				return prev;
			}
			setSortDir('asc');
			return field;
		});
	}, []);

	const handleAccordionChange = useCallback((value: string) => {
		setExpanded(value ? Number(value) : null);
	}, []);

	const clearFilters = useCallback(() => {
		setFaction('');
		setUnitType('');
		setRarity('');
		setAttribute('');
		setTrait('');
		setSearch('');
	}, []);

	const filtered = useMemo(() => {
		const q = search.toLowerCase();
		// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: filter pipeline has multiple independent conditions
		const result = lords.filter(lord => {
			if (faction && lord.faction !== faction) return false;
			if (unitType && lord.unitType !== unitType) return false;
			if (rarity && lord.rarity !== rarity) return false;
			if (attribute && lord.attribute !== attribute) return false;
			if (trait && !lord.traits.includes(trait as Trait)) return false;
			if (
				q &&
				!`${lord.name} ${lord.nameJapanese} ${lord.skill.name}`
					.toLowerCase()
					.includes(q)
			)
				return false;
			return true;
		});
		return [...result].sort((a, b) => compareLords(a, b, sortField, sortDir));
	}, [
		lords,
		faction,
		unitType,
		rarity,
		attribute,
		trait,
		search,
		sortField,
		sortDir,
	]);

	const hasFilters = Boolean(
		faction || unitType || rarity || attribute || trait || search,
	);

	return (
		<>
			<PageHead title='Lord Cards' />
			<div className='mb-4 flex flex-wrap items-end gap-x-5 gap-y-3 bg-surface-high p-4'>
				<SearchFilter
					onChange={setSearch}
					placeholder='Name or skill…'
					value={search}
				/>
				<SelectFilter
					label='Faction'
					onChange={setFaction}
					options={FACTION_OPTS}
					value={faction}
				/>
				<SelectFilter
					label='Type'
					onChange={setUnitType}
					options={UNIT_OPTS}
					value={unitType}
				/>
				<SelectFilter
					label='Rarity'
					onChange={setRarity}
					options={RARITY_OPTS}
					value={rarity}
				/>
				<SelectFilter
					label='Attr'
					onChange={setAttribute}
					options={ATTR_OPTS}
					value={attribute}
				/>
				<SelectFilter
					label='Trait'
					onChange={setTrait}
					options={TRAIT_OPTS}
					value={trait}
				/>
				{hasFilters ? (
					<Button onClick={clearFilters} size='sm' variant='outline'>
						Clear
					</Button>
				) : null}
			</div>
			<div className='mb-3 font-sans text-sm text-text-faint'>
				{filtered.length} of {lords.length} cards
			</div>
			<LordTable
				expanded={expanded}
				lords={filtered}
				onToggleExpand={handleAccordionChange}
				onToggleSort={toggleSort}
				sortDir={sortDir}
				sortField={sortField}
			/>
			{filtered.length === 0 ? (
				<p className='py-12 text-center text-text-faint'>
					No cards match your filters.
				</p>
			) : null}
		</>
	);
}
