import type {Rarity} from '@/types/gamedata'

const RARITY_CLASS: Record<Rarity, string> = {
	C: 'bg-surface-highest text-text-faint',
	UC: 'bg-shu/20 text-shu',
	R: 'bg-wu/20 text-wu',
	SR: 'bg-han/20 text-han',
	LE: 'bg-gold-dark text-gold'
}

interface Props {
	rarity: Rarity
}

export function RarityBadge({rarity}: Props) {
	return (
		<span
			className={`inline-block px-1.5 py-0.5 font-black font-sans text-xs ${RARITY_CLASS[rarity]}`}
		>
			{rarity}
		</span>
	)
}
