import type {ComponentType} from 'react'

export interface GuideEntry {
	readonly slug: string
	readonly title: string
	readonly load: () => Promise<{default: ComponentType}>
}

/**
 * All guides, lazily loaded. The MDX plugin compiles each .md to a React
 * component at build time — the import returns { default: MDXContent }.
 */
export const GUIDES: readonly GuideEntry[] = [
	{
		slug: 'beginners',
		title: "Beginner's Guide",
		load: () => import('@/content/guides/beginners-guide.md')
	},
	{
		slug: 'campaign',
		title: 'Campaign Walkthrough',
		load: () => import('@/content/guides/campaign-guide.md')
	},
	{
		slug: 'campaign-merchants',
		title: 'Campaign Merchants',
		load: () => import('@/content/guides/campaign-merchants.md')
	},
	{
		slug: 'combat',
		title: 'Combat Mechanics',
		load: () => import('@/content/guides/combat-mechanics.md')
	},
	{
		slug: 'deck-archetypes',
		title: 'Deck Archetypes',
		load: () => import('@/content/guides/deck-archetypes.md')
	},
	{
		slug: 'deck-strategies',
		title: 'Deck Strategies',
		load: () => import('@/content/guides/deck-strategies.md')
	},
	{
		slug: 'duel',
		title: 'DUEL Guide',
		load: () => import('@/content/guides/duel-guide.md')
	},
	{
		slug: 'tactics',
		title: 'Tactics Guide',
		load: () => import('@/content/guides/tactics-guide.md')
	}
]
