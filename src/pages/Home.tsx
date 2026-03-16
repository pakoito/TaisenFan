import {lazy, Suspense} from 'react'
import {Link} from 'react-router'
import {PageHead} from '@/components/PageHead'

const Patcher = lazy(() =>
	import('@/components/Patcher').then(m => ({default: m.Patcher}))
)

export function Home() {
	return (
		<>
			<PageHead title='Home' />

			{/* Hero */}
			<section className='py-12 text-center'>
				<h1 className='mb-2 text-4xl font-bold text-crimson-600 md:text-5xl'>
					三国志大戦<span className='text-gold-500'>DS</span>
				</h1>
				<p className='mb-1 text-xl font-medium text-ink-700 dark:text-parchment-200'>
					Sangokushi Taisen Ten — English Translation
				</p>
				<p className='mx-auto max-w-xl text-ink-500 dark:text-parchment-400'>
					A fan translation patch for the Nintendo DS real-time strategy
					card game set in the Three Kingdoms era of China. All menus,
					cards, skills, cutscenes, and guides — in English.
				</p>
			</section>

			{/* Patcher */}
			<section className='mx-auto mb-12 max-w-2xl'>
				<div className='rounded-lg border-2 border-gold-500 bg-gradient-to-b from-parchment-50 to-parchment-100 p-6 shadow-md dark:from-ink-800 dark:to-ink-900'>
					<h2 className='mb-3 text-center text-lg font-bold text-crimson-600'>
						Patch Your ROM
					</h2>
					<p className='mb-4 text-center text-sm text-ink-500 dark:text-parchment-400'>
						Select your original Japanese ROM and the patch will be
						applied in your browser. Nothing is uploaded — everything
						runs locally.
					</p>

					<Suspense
						fallback={
							<div className='py-8 text-center text-sm text-ink-400'>
								Loading patcher…
							</div>
						}
					>
						<Patcher />
					</Suspense>
				</div>
			</section>

			{/* What's translated */}
			<section className='mx-auto mb-12 max-w-3xl'>
				<SectionHeader>What's Translated</SectionHeader>
				<div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
					<StatBox label='Card Data' value='192 Lords' />
					<StatBox label='Sage Cards' value='20 Sages' />
					<StatBox label='Scripts' value='200+ Scenes' />
					<StatBox label='UI Strings' value='Menus & HUD' />
				</div>
				<div className='mt-3 grid grid-cols-2 gap-3 md:grid-cols-4'>
					<StatBox label='Skill Descriptions' value='All 192' />
					<StatBox label='Campaign' value='6 Chapters' />
					<StatBox label='Duel Mode' value='80 CPU Decks' />
					<StatBox label='Tutorials' value='All Modes' />
				</div>
			</section>

			{/* Game data */}
			<section className='mx-auto mb-12 max-w-3xl'>
				<SectionHeader>Game Data</SectionHeader>
				<div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
					<SectionLink
						description='All 192 warriors — stats, skills, traits, and lore.'
						to='/gamedata/lords'
						title='Lord Cards'
					/>
					<SectionLink
						description='20 advisors with tactics and formation abilities.'
						to='/gamedata/sages'
						title='Sage Cards'
					/>
					<SectionLink
						description='80 CPU decks across Easy, Normal, and Hard.'
						to='/gamedata/decks'
						title='Duel Decks'
					/>
				</div>
			</section>

			{/* Guides */}
			<section className='mx-auto mb-12 max-w-3xl'>
				<SectionHeader>Guides</SectionHeader>
				<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
					<GuideLink
						description='Factions, units, mechanics, and terminology.'
						title="Beginner's Guide"
					/>
					<GuideLink
						description='All 6 chapters plus Warring States mode.'
						title='Campaign Walkthrough'
					/>
					<GuideLink
						description='Damage formulas, speed tables, and counters.'
						title='Combat Mechanics'
					/>
					<GuideLink
						description='Proven decks for S-rank Duel clears.'
						title='Deck Strategies'
					/>
				</div>
			</section>

			{/* About */}
			<section className='mx-auto mb-12 max-w-3xl'>
				<SectionHeader>About the Game</SectionHeader>
				<div className='rounded-lg border border-parchment-300 bg-white p-4 text-sm leading-relaxed text-ink-600 dark:border-ink-600 dark:bg-ink-800 dark:text-parchment-300'>
					<p className='mb-3'>
						<strong>Sangokushi Taisen Ten</strong> (三国志大戦・天) is the
						Nintendo DS adaptation of SEGA's popular arcade card game.
						Command legendary Three Kingdoms heroes in real-time tactical
						battles — place cards on the touch screen, maneuver units,
						and activate devastating skills to breach the enemy castle.
					</p>
					<p className='mb-3'>
						The game features a 6-chapter campaign, 80 duel stages across
						3 difficulties, 192 lord cards across 4 factions (Wei, Shu,
						Wu, and Other), 20 sage advisors, and deep deck-building
						mechanics with an 8-cost system.
					</p>
					<p>
						Originally released only in Japan, this fan translation
						project makes the full game accessible to English-speaking
						players for the first time.
					</p>
				</div>
			</section>
		</>
	)
}

function SectionHeader({children}: {children: string}) {
	return (
		<div className='mb-3 border-y-2 border-gold-500 bg-gradient-to-r from-crimson-700 via-crimson-600 to-crimson-700 px-4 py-2'>
			<h2 className='text-center text-sm font-bold uppercase tracking-widest text-gold-300'>
				{children}
			</h2>
		</div>
	)
}

function StatBox({label, value}: {label: string; value: string}) {
	return (
		<div className='rounded-lg border border-parchment-300 bg-white p-3 text-center dark:border-ink-600 dark:bg-ink-800'>
			<div className='text-lg font-bold text-crimson-600'>{value}</div>
			<div className='text-xs text-ink-400'>{label}</div>
		</div>
	)
}

function SectionLink({
	to,
	title,
	description,
}: {
	to: string
	title: string
	description: string
}) {
	return (
		<Link
			className='group rounded-lg border border-parchment-300 bg-white p-4 transition-colors hover:border-emerald-600 dark:border-ink-600 dark:bg-ink-800 dark:hover:border-emerald-600'
			to={to}
		>
			<h3 className='mb-1 font-bold text-ink-800 group-hover:text-emerald-600 dark:text-parchment-100'>
				{title}
			</h3>
			<p className='text-sm text-ink-500 dark:text-parchment-400'>
				{description}
			</p>
		</Link>
	)
}

function GuideLink({
	title,
	description,
}: {
	title: string
	description: string
}) {
	return (
		<div className='rounded-lg border border-parchment-300 bg-white p-4 opacity-75 dark:border-ink-600 dark:bg-ink-800'>
			<h3 className='mb-1 font-bold text-ink-600 dark:text-parchment-300'>
				{title}
				<span className='ml-2 text-xs font-normal text-ink-400'>
					Coming soon
				</span>
			</h3>
			<p className='text-sm text-ink-400 dark:text-parchment-500'>
				{description}
			</p>
		</div>
	)
}
