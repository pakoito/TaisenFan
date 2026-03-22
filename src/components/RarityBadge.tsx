import {Badge} from '@/components/ui/badge'
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
		<Badge className={`font-black ${RARITY_CLASS[rarity]}`} variant='ghost'>
			{rarity}
		</Badge>
	)
}
