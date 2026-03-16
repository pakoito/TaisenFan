import type {Rarity} from '@/types/gamedata'

const RARITY_CLASS: Record<Rarity, string> = {
	C: 'bg-ink-500 text-white',
	UC: 'bg-emerald-600 text-white',
	R: 'bg-wu text-white',
	SR: 'bg-han text-white',
	LE: 'bg-gold-400 text-ink-900'
}

interface Props {
	rarity: Rarity
}

export function RarityBadge({rarity}: Props) {
	return (
		<span
			className={`inline-block rounded px-1.5 py-0.5 font-bold text-xs ${RARITY_CLASS[rarity]}`}
		>
			{rarity}
		</span>
	)
}
