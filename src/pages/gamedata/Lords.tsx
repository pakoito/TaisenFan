import {useSuspenseQuery} from '@tanstack/react-query'
import {useCallback, useMemo, useState} from 'react'
import {getLords} from '@/api/gamedata'
import {LordTable} from '@/components/LordTable'
import {PageHead} from '@/components/PageHead'
import {
	ATTRIBUTES,
	FACTIONS,
	RARITIES,
	TRAITS,
	type Trait,
	UNIT_TYPES
} from '@/types/gamedata'
import {getFactionLabel} from '@/utils/faction'
import {compareLords, type SortDir, type SortField} from '@/utils/sort'

const FACTION_OPTS = FACTIONS.map(f => ({value: f, label: getFactionLabel(f)}))
const UNIT_OPTS = UNIT_TYPES.map(u => ({value: u, label: u}))
const RARITY_OPTS = RARITIES.map(r => ({value: r, label: r}))
const ATTR_OPTS = ATTRIBUTES.map(a => ({value: a, label: a}))
const TRAIT_OPTS = TRAITS.map(t => ({value: t, label: t}))

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: page component with filter state
export function Lords() {
	const {data: lords} = useSuspenseQuery({
		queryFn: getLords,
		queryKey: ['lords']
	})

	const [faction, setFaction] = useState('')
	const [unitType, setUnitType] = useState('')
	const [rarity, setRarity] = useState('')
	const [attribute, setAttribute] = useState('')
	const [trait, setTrait] = useState('')
	const [search, setSearch] = useState('')
	const [sortField, setSortField] = useState<SortField>('sortNo')
	const [sortDir, setSortDir] = useState<SortDir>('asc')
	const [expanded, setExpanded] = useState<number | null>(null)

	const toggleSort = useCallback((field: SortField) => {
		setSortField(prev => {
			if (prev === field) {
				setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
				return prev
			}
			setSortDir('asc')
			return field
		})
	}, [])

	const toggleExpand = useCallback((cardId: number) => {
		setExpanded(prev => (prev === cardId ? null : cardId))
	}, [])

	const clearFilters = useCallback(() => {
		setFaction('')
		setUnitType('')
		setRarity('')
		setAttribute('')
		setTrait('')
		setSearch('')
	}, [])

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: filter pipeline has multiple independent conditions
		const result = lords.filter(lord => {
			if (faction && lord.faction !== faction) return false
			if (unitType && lord.unitType !== unitType) return false
			if (rarity && lord.rarity !== rarity) return false
			if (attribute && lord.attribute !== attribute) return false
			if (trait && !lord.traits.includes(trait as Trait)) return false
			if (
				q &&
				!`${lord.name} ${lord.nameJapanese} ${lord.skill.name}`
					.toLowerCase()
					.includes(q)
			)
				return false
			return true
		})
		return [...result].sort((a, b) => compareLords(a, b, sortField, sortDir))
	}, [
		lords,
		faction,
		unitType,
		rarity,
		attribute,
		trait,
		search,
		sortField,
		sortDir
	])

	const hasFilters = Boolean(
		faction || unitType || rarity || attribute || trait || search
	)

	return (
		<>
			<PageHead title='Lord Cards' />
			<FilterBar
				attribute={attribute}
				faction={faction}
				hasFilters={hasFilters}
				onClear={clearFilters}
				rarity={rarity}
				search={search}
				setAttribute={setAttribute}
				setFaction={setFaction}
				setRarity={setRarity}
				setSearch={setSearch}
				setTrait={setTrait}
				setUnitType={setUnitType}
				trait={trait}
				unitType={unitType}
			/>
			<div className='mb-2 text-ink-400 text-sm'>
				{filtered.length} of {lords.length} cards
			</div>
			<LordTable
				expanded={expanded}
				lords={filtered}
				onToggleExpand={toggleExpand}
				onToggleSort={toggleSort}
				sortDir={sortDir}
				sortField={sortField}
			/>
			{filtered.length === 0 ? (
				<p className='py-12 text-center text-ink-400'>
					No cards match your filters.
				</p>
			) : null}
		</>
	)
}

// ============================================================================
// Filter bar (private to this page)
// ============================================================================

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: filter bar has 6 controlled selects requiring individual callbacks
function FilterBar(props: {
	search: string
	setSearch: (v: string) => void
	faction: string
	setFaction: (v: string) => void
	unitType: string
	setUnitType: (v: string) => void
	rarity: string
	setRarity: (v: string) => void
	attribute: string
	setAttribute: (v: string) => void
	trait: string
	setTrait: (v: string) => void
	hasFilters: boolean
	onClear: () => void
}) {
	const onSearch = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			props.setSearch(e.target.value)
		},
		[props.setSearch]
	)
	const onFaction = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			props.setFaction(e.target.value)
		},
		[props.setFaction]
	)
	const onUnit = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			props.setUnitType(e.target.value)
		},
		[props.setUnitType]
	)
	const onRarity = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			props.setRarity(e.target.value)
		},
		[props.setRarity]
	)
	const onAttr = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			props.setAttribute(e.target.value)
		},
		[props.setAttribute]
	)
	const onTrait = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			props.setTrait(e.target.value)
		},
		[props.setTrait]
	)

	return (
		<div className='mb-3 flex flex-wrap items-end gap-x-4 gap-y-2 rounded-lg border border-parchment-300 bg-parchment-100 p-3 dark:border-ink-600 dark:bg-ink-800'>
			<Field label='Search'>
				<input
					className='h-8 w-48 rounded border border-parchment-300 bg-white px-2 text-sm dark:border-ink-600 dark:bg-ink-800 dark:text-parchment-100'
					onChange={onSearch}
					placeholder='Name or skill…'
					spellCheck={false}
					type='text'
					value={props.search}
				/>
			</Field>
			<Select
				label='Faction'
				onChange={onFaction}
				options={FACTION_OPTS}
				value={props.faction}
			/>
			<Select
				label='Type'
				onChange={onUnit}
				options={UNIT_OPTS}
				value={props.unitType}
			/>
			<Select
				label='Rarity'
				onChange={onRarity}
				options={RARITY_OPTS}
				value={props.rarity}
			/>
			<Select
				label='Attr'
				onChange={onAttr}
				options={ATTR_OPTS}
				value={props.attribute}
			/>
			<Select
				label='Trait'
				onChange={onTrait}
				options={TRAIT_OPTS}
				value={props.trait}
			/>
			{props.hasFilters ? (
				<button
					className='h-8 rounded bg-ink-200 px-3 font-medium text-ink-600 text-xs hover:bg-ink-300 dark:bg-ink-700 dark:text-parchment-300'
					onClick={props.onClear}
					type='button'
				>
					Clear
				</button>
			) : null}
		</div>
	)
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
	return (
		<div className='flex flex-col gap-0.5'>
			<span className='font-medium text-[10px] text-ink-400 uppercase tracking-wider'>
				{label}
			</span>
			{children}
		</div>
	)
}

function Select({
	label,
	value,
	onChange,
	options
}: {
	label: string
	value: string
	onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
	options: readonly {value: string; label: string}[]
}) {
	return (
		<Field label={label}>
			<select
				className='h-8 rounded border border-parchment-300 bg-white px-2 pr-6 text-sm dark:border-ink-600 dark:bg-ink-800 dark:text-parchment-100'
				onChange={onChange}
				value={value}
			>
				<option value=''>All</option>
				{options.map(o => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</Field>
	)
}
