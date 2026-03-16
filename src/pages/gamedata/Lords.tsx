import {useMemo, useState} from 'react'
import {useSuspenseQuery} from '@tanstack/react-query'
import {getLords} from '@/api/gamedata'
import {PageHead} from '@/components/PageHead'
import {RangeImage} from '@/components/RangeImage'
import {
	FACTIONS,
	UNIT_TYPES,
	RARITIES,
	ATTRIBUTES,
	TRAITS,
	type LordCard,
	type Trait,
} from '@/types/gamedata'

// ============================================================================
// Sort
// ============================================================================

type SortField =
	| 'sortNo'
	| 'name'
	| 'cost'
	| 'pow'
	| 'int'
	| 'morale'
	| 'rarity'
type SortDir = 'asc' | 'desc'

const RARITY_ORDER: Record<string, number> = {C: 0, UC: 1, R: 2, SR: 3, LE: 4}

function compareLords(
	a: LordCard,
	b: LordCard,
	field: SortField,
	dir: SortDir
): number {
	let cmp = 0
	switch (field) {
		case 'sortNo':
			cmp = a.sortNo - b.sortNo
			break
		case 'name':
			cmp = a.name.localeCompare(b.name)
			break
		case 'cost':
			cmp = a.cost - b.cost
			break
		case 'pow':
			cmp = a.pow - b.pow
			break
		case 'int':
			cmp = a.int - b.int
			break
		case 'morale':
			cmp = a.skill.morale - b.skill.morale
			break
		case 'rarity':
			cmp = (RARITY_ORDER[a.rarity] ?? 0) - (RARITY_ORDER[b.rarity] ?? 0)
			break
	}
	return dir === 'desc' ? -cmp : cmp
}

// ============================================================================
// Faction styling
// ============================================================================

const FACTION_CFG: Record<
	string,
	{kanji: string; cls: string; rowBg: string; label: string}
> = {
	Wei: {
		kanji: '魏',
		cls: 'bg-wei text-white',
		rowBg: 'bg-wei/5',
		label: 'Wei (魏)',
	},
	Shu: {
		kanji: '蜀',
		cls: 'bg-shu text-white',
		rowBg: 'bg-shu/5',
		label: 'Shu (蜀)',
	},
	Wu: {
		kanji: '呉',
		cls: 'bg-wu text-white',
		rowBg: 'bg-wu/5',
		label: 'Wu (呉)',
	},
	Other: {
		kanji: '群',
		cls: 'bg-gun text-white',
		rowBg: 'bg-gun/5',
		label: 'Other (群)',
	},
	LE: {
		kanji: 'LE',
		cls: 'bg-gold-400 text-ink-900',
		rowBg: 'bg-gold-300/10',
		label: 'Legendary',
	},
	DS: {
		kanji: 'DS',
		cls: 'bg-emerald-600 text-white',
		rowBg: 'bg-emerald-600/5',
		label: 'DS',
	},
	EX: {
		kanji: 'EX',
		cls: 'bg-crimson-500 text-white',
		rowBg: 'bg-crimson-500/5',
		label: 'EX',
	},
}

function factionCfg(faction: string) {
	return FACTION_CFG[faction] ?? FACTION_CFG['Other']!
}

// ============================================================================
// Filter options
// ============================================================================

const FACTION_OPTS = FACTIONS.map(f => ({
	value: f,
	label: factionCfg(f).label,
}))
const UNIT_OPTS = UNIT_TYPES.map(u => ({value: u, label: u}))
const RARITY_OPTS = RARITIES.map(r => ({value: r, label: r}))
const ATTR_OPTS = ATTRIBUTES.map(a => ({value: a, label: a}))
const TRAIT_OPTS = TRAITS.map(t => ({value: t, label: t}))

// ============================================================================
// Component
// ============================================================================

export function Lords() {
	const {data: lords} = useSuspenseQuery({
		queryFn: getLords,
		queryKey: ['lords'],
	})

	// Filters
	const [faction, setFaction] = useState('')
	const [unitType, setUnitType] = useState('')
	const [rarity, setRarity] = useState('')
	const [attribute, setAttribute] = useState('')
	const [trait, setTrait] = useState('')
	const [search, setSearch] = useState('')

	// Sort
	const [sortField, setSortField] = useState<SortField>('sortNo')
	const [sortDir, setSortDir] = useState<SortDir>('asc')

	// Expand
	const [expanded, setExpanded] = useState<number | null>(null)

	function toggleSort(field: SortField) {
		if (sortField === field) {
			setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
		} else {
			setSortField(field)
			setSortDir('asc')
		}
	}

	const filtered = useMemo(() => {
		const q = search.toLowerCase()
		let result = lords.filter(lord => {
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
		result = [...result].sort((a, b) =>
			compareLords(a, b, sortField, sortDir)
		)
		return result
	}, [lords, faction, unitType, rarity, attribute, trait, search, sortField, sortDir])

	const hasFilters =
		faction || unitType || rarity || attribute || trait || search

	return (
		<>
			<PageHead title='Lord Cards' />

			{/* Filters */}
			<div className='mb-3 flex flex-wrap items-end gap-x-4 gap-y-2 rounded-lg border border-parchment-300 bg-parchment-100 p-3 dark:border-ink-600 dark:bg-ink-800'>
				<div className='flex flex-col gap-0.5'>
					<span className='text-[10px] font-medium uppercase tracking-wider text-ink-400'>
						Search
					</span>
					<input
						className='h-8 w-48 rounded border border-parchment-300 bg-white px-2 text-sm dark:border-ink-600 dark:bg-ink-800 dark:text-parchment-100'
						onChange={e => setSearch(e.target.value)}
						placeholder='Name or skill…'
						spellCheck={false}
						type='text'
						value={search}
					/>
				</div>
				<Filter
					label='Faction'
					onChange={setFaction}
					options={FACTION_OPTS}
					value={faction}
				/>
				<Filter
					label='Type'
					onChange={setUnitType}
					options={UNIT_OPTS}
					value={unitType}
				/>
				<Filter
					label='Rarity'
					onChange={setRarity}
					options={RARITY_OPTS}
					value={rarity}
				/>
				<Filter
					label='Attr'
					onChange={setAttribute}
					options={ATTR_OPTS}
					value={attribute}
				/>
				<Filter
					label='Trait'
					onChange={setTrait}
					options={TRAIT_OPTS}
					value={trait}
				/>
				{hasFilters && (
					<button
						className='h-8 rounded bg-ink-200 px-3 text-xs font-medium text-ink-600 hover:bg-ink-300 dark:bg-ink-700 dark:text-parchment-300 dark:hover:bg-ink-600'
						onClick={() => {
							setFaction('')
							setUnitType('')
							setRarity('')
							setAttribute('')
							setTrait('')
							setSearch('')
						}}
						type='button'
					>
						Clear
					</button>
				)}
			</div>

			{/* Count */}
			<div className='mb-2 text-sm text-ink-400'>
				{filtered.length} of {lords.length} cards
			</div>

			{/* Table */}
			<div className='overflow-x-auto rounded-lg border border-parchment-300 shadow-sm dark:border-ink-600'>
				<table className='w-full border-collapse text-sm'>
					<thead>
						<tr className='bg-ink-700 text-[11px] uppercase tracking-wider text-parchment-200'>
							<th className='w-8 px-2 py-2.5' />
							<SortTh
								active={sortField === 'name'}
								dir={sortDir}
								label='Name'
								left
								onClick={() => toggleSort('name')}
							/>
							<SortTh
								active={sortField === 'rarity'}
								dir={sortDir}
								label='Rarity'
								onClick={() => toggleSort('rarity')}
							/>
							<SortTh
								active={sortField === 'cost'}
								dir={sortDir}
								label='Cost'
								onClick={() => toggleSort('cost')}
							/>
							<SortTh
								active={sortField === 'pow'}
								dir={sortDir}
								label='POW'
								onClick={() => toggleSort('pow')}
							/>
							<SortTh
								active={sortField === 'int'}
								dir={sortDir}
								label='INT'
								onClick={() => toggleSort('int')}
							/>
							<th className='px-2 py-2.5 text-center font-medium'>
								Type
							</th>
							<th className='px-2 py-2.5 text-center font-medium'>
								Attr
							</th>
							<th className='px-2 py-2.5 text-left font-medium'>
								Traits
							</th>
							<th className='px-2 py-2.5 text-left font-medium'>
								Skill
							</th>
							<SortTh
								active={sortField === 'morale'}
								dir={sortDir}
								label='MP'
								onClick={() => toggleSort('morale')}
							/>
							<th className='w-11 px-2 py-2.5 text-center font-medium'>
								Range
							</th>
						</tr>
					</thead>
					<tbody>
						{filtered.map(lord => (
							<LordRow
								expanded={expanded === lord.cardId}
								key={lord.cardId}
								lord={lord}
								onToggle={() =>
									setExpanded(e =>
										e === lord.cardId ? null : lord.cardId
									)
								}
							/>
						))}
					</tbody>
				</table>
			</div>

			{filtered.length === 0 && (
				<p className='py-12 text-center text-ink-400'>
					No cards match your filters.
				</p>
			)}
		</>
	)
}

// ============================================================================
// Table row
// ============================================================================

function LordRow({
	lord,
	expanded,
	onToggle,
}: {
	lord: LordCard
	expanded: boolean
	onToggle: () => void
}) {
	const cfg = factionCfg(lord.faction)

	return (
		<>
			<tr
				className={`cursor-pointer border-b border-parchment-200 transition-colors duration-75 hover:bg-parchment-200/60 dark:border-ink-700 dark:hover:bg-ink-700/50 ${cfg.rowBg}`}
				onClick={onToggle}
			>
				{/* Faction badge */}
				<td className='px-2 py-1.5 text-center'>
					<span
						className={`inline-flex h-7 w-7 items-center justify-center rounded text-[11px] font-black ${cfg.cls}`}
						title={cfg.label}
					>
						{cfg.kanji}
					</span>
				</td>

				{/* Name */}
				<td className='px-2 py-1.5'>
					<span className='font-medium text-ink-800 dark:text-parchment-100'>
						{lord.name}
					</span>
					<span className='ml-1.5 text-xs text-ink-400'>
						{lord.nameJapanese}
					</span>
				</td>

				{/* Rarity */}
				<td className='px-2 py-1.5 text-center'>
					<span className={`text-xs font-bold ${rarityColor(lord.rarity)}`}>
						{lord.rarity}
					</span>
				</td>

				{/* Cost */}
				<td className='px-2 py-1.5 text-center font-bold tabular-nums'>
					{lord.cost}
				</td>

				{/* POW */}
				<td className='px-2 py-1.5 text-center tabular-nums'>
					{lord.pow}
				</td>

				{/* INT */}
				<td className='px-2 py-1.5 text-center tabular-nums'>
					{lord.int}
				</td>

				{/* Unit type */}
				<td className='px-2 py-1.5 text-center text-xs'>
					{lord.unitType}
				</td>

				{/* Attribute */}
				<td
					className={`px-2 py-1.5 text-center text-xs font-medium ${attrColor(lord.attribute)}`}
				>
					{lord.attribute}
				</td>

				{/* Traits */}
				<td className='px-2 py-1.5'>
					{lord.traits.length > 0 ? (
						<div className='flex flex-wrap gap-0.5'>
							{lord.traits.map(t => (
								<span
									className='rounded bg-emerald-700/15 px-1 py-px text-[10px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
									key={t}
								>
									{t}
								</span>
							))}
						</div>
					) : (
						<span className='text-xs text-ink-300'>—</span>
					)}
				</td>

				{/* Skill */}
				<td className='px-2 py-1.5'>
					<span className='font-medium text-gold-600 dark:text-gold-400'>
						{lord.skill.name}
					</span>
				</td>

				{/* Morale */}
				<td className='px-2 py-1.5 text-center tabular-nums'>
					{lord.skill.morale}
				</td>

				{/* Range */}
				<td className='px-2 py-1.5 text-center'>
					<RangeImage
						className='mx-auto rounded border border-parchment-300 bg-parchment-50 dark:border-ink-600 dark:bg-ink-800'
						range={lord.skill.range}
					/>
				</td>
			</tr>

			{/* Expanded detail */}
			{expanded && <ExpandedRow lord={lord} />}
		</>
	)
}

// ============================================================================
// Expanded detail row
// ============================================================================

function ExpandedRow({lord}: {lord: LordCard}) {
	const cfg = factionCfg(lord.faction)

	return (
		<tr
			className={`border-b-2 border-gold-500/30 ${cfg.rowBg}`}
		>
			<td className='px-4 py-4' colSpan={12}>
				<div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
					{/* Skill detail */}
					<div className='rounded-lg border border-gold-500/20 bg-white/60 p-3 dark:bg-ink-900/60'>
						<div className='mb-2 flex items-center justify-between'>
							<span className='font-bold text-gold-600 dark:text-gold-400'>
								{lord.skill.name}
							</span>
							<div className='flex items-center gap-2'>
								<RangeImage
									className='rounded border border-parchment-300 bg-parchment-50 dark:border-ink-600 dark:bg-ink-800'
									range={lord.skill.range}
								/>
								<span className='rounded bg-crimson-600 px-1.5 py-0.5 text-[10px] font-bold text-white'>
									{lord.skill.morale} MP
								</span>
							</div>
						</div>
						<div className='mb-1 text-xs text-ink-400'>
							{lord.skill.range.replaceAll('_', ' ')} ·{' '}
							{lord.skill.duration}
						</div>
						<p className='whitespace-pre-line text-sm leading-relaxed text-ink-600 dark:text-parchment-300'>
							{lord.skill.description}
						</p>
					</div>

					{/* Lore */}
					<div className='rounded-lg border border-gold-500/20 bg-white/60 p-3 dark:bg-ink-900/60'>
						<p className='mb-3 whitespace-pre-line border-l-2 border-gold-400/50 pl-3 text-sm italic leading-relaxed text-ink-500 dark:text-parchment-400'>
							{lord.lore}
						</p>
						<p className='whitespace-pre-line text-sm text-ink-600 dark:text-parchment-300'>
							"{lord.battleCry}"
						</p>
						<div className='mt-3 flex justify-between text-[10px] text-ink-400'>
							<span>Art: {lord.artist}</span>
							<span>
								{lord.birthYear ?? '?'}–{lord.deathYear ?? '?'}
							</span>
						</div>
					</div>
				</div>
			</td>
		</tr>
	)
}

// ============================================================================
// Sortable column header
// ============================================================================

function SortTh({
	label,
	active,
	dir,
	onClick,
	left = false,
}: {
	label: string
	active: boolean
	dir: SortDir
	onClick: () => void
	left?: boolean
}) {
	const arrow = active ? (dir === 'asc' ? ' ▲' : ' ▼') : ''
	return (
		<th
			className={`cursor-pointer select-none px-2 py-2.5 font-medium transition-colors hover:text-gold-300 ${
				left ? 'text-left' : 'text-center'
			} ${active ? 'text-gold-300' : ''}`}
			onClick={onClick}
		>
			{label}
			{arrow}
		</th>
	)
}

// ============================================================================
// Filter dropdown
// ============================================================================

function Filter({
	label,
	value,
	onChange,
	options,
}: {
	label: string
	value: string
	onChange: (v: string) => void
	options: readonly {value: string; label: string}[]
}) {
	return (
		<div className='flex flex-col gap-0.5'>
			<span className='text-[10px] font-medium uppercase tracking-wider text-ink-400'>
				{label}
			</span>
			<select
				className='h-8 rounded border border-parchment-300 bg-white px-2 pr-6 text-sm dark:border-ink-600 dark:bg-ink-800 dark:text-parchment-100'
				onChange={e => onChange(e.target.value)}
				value={value}
			>
				<option value=''>All</option>
				{options.map(o => (
					<option key={o.value} value={o.value}>
						{o.label}
					</option>
				))}
			</select>
		</div>
	)
}

// ============================================================================
// Helpers
// ============================================================================

function rarityColor(rarity: string): string {
	switch (rarity) {
		case 'SR':
			return 'text-han'
		case 'R':
			return 'text-wu'
		case 'UC':
			return 'text-emerald-600 dark:text-emerald-400'
		case 'LE':
			return 'text-gold-500'
		default:
			return 'text-ink-400'
	}
}

function attrColor(attr: string): string {
	switch (attr) {
		case 'Heaven':
			return 'text-sky-600 dark:text-sky-400'
		case 'Earth':
			return 'text-amber-600 dark:text-amber-400'
		case 'Man':
			return 'text-green-600 dark:text-green-400'
		default:
			return ''
	}
}
