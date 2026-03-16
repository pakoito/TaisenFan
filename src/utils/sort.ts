import type {LordCard} from '@/types/gamedata'

export type SortField =
	| 'sortNo'
	| 'name'
	| 'cost'
	| 'pow'
	| 'int'
	| 'morale'
	| 'rarity'
export type SortDir = 'asc' | 'desc'

const RARITY_ORDER: Record<string, number> = {C: 0, UC: 1, R: 2, SR: 3, LE: 4}

export function compareLords(
	a: LordCard,
	b: LordCard,
	field: SortField,
	dir: SortDir
): number {
	let cmp = 0
	// biome-ignore lint/nursery/noUnnecessaryConditions: switch on union type is idiomatic
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
		default:
			break
	}
	return dir === 'desc' ? -cmp : cmp
}
