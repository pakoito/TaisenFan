import {Link} from 'react-router'
import {PageHead} from '@/components/PageHead'

const SECTIONS = [
	{
		to: '/gamedata/lords',
		title: 'Lord Cards',
		description: '192 warrior cards with stats, skills, and lore',
		color: 'border-crimson-600 hover:bg-crimson-600/5',
	},
	{
		to: '/gamedata/sages',
		title: 'Sage Cards',
		description: '20 advisor cards with tactics and formations',
		color: 'border-emerald-600 hover:bg-emerald-600/5',
	},
	{
		to: '/gamedata/decks',
		title: 'Duel Decks',
		description: '80 CPU decks across 3 difficulties',
		color: 'border-gold-500 hover:bg-gold-500/5',
	},
] as const

export function Home() {
	return (
		<>
			<PageHead title='Home' />

			<div className='flex flex-col items-center gap-8 py-12'>
				<div className='text-center'>
					<h1 className='mb-2 text-4xl font-bold text-crimson-600'>
						TaisenFan
					</h1>
					<p className='max-w-lg text-lg text-ink-500 dark:text-parchment-400'>
						Guides, game data, and English translation patches for
						Sangokushi Taisen Ten (三国志大戦DS).
					</p>
				</div>

				<div className='grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-3'>
					{SECTIONS.map(({to, title, description, color}) => (
						<Link
							className={`rounded-lg border-2 bg-white p-5 shadow transition-all duration-150 dark:bg-ink-800 ${color}`}
							key={to}
							to={to}
						>
							<h2 className='mb-1 text-lg font-bold text-ink-800 dark:text-parchment-100'>
								{title}
							</h2>
							<p className='text-sm text-ink-500 dark:text-parchment-400'>
								{description}
							</p>
						</Link>
					))}
				</div>
			</div>
		</>
	)
}
