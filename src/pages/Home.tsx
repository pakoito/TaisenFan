import {Link} from 'react-router';
import {PageHead} from '@/components/PageHead';

export function Home() {
	return (
		<>
			<PageHead title='Home' />

			{/* Hero — Embrace the Void */}
			<section className='py-20 text-center'>
				<h1 className='mb-4 font-black text-5xl text-gold tracking-tight md:text-7xl'>
					三国志大戦
					<span className='text-cinnabar-light'>天</span>
				</h1>
				<p className='mb-2 font-serif text-text-muted text-xl tracking-wide'>
					Sangokushi Taisen Ten
				</p>
				<div className='brushstroke-sep mx-auto my-6 max-w-xs' />
				<p className='mx-auto max-w-lg text-text-faint leading-relaxed'>
					A fan translation patch for the Nintendo DS real-time strategy card
					game set in the Three Kingdoms era of China. All menus, cards, skills,
					cutscenes, and guides — in English.
				</p>
			</section>

			{/* ROM loader prompt */}
			<section className='mx-auto mb-20 max-w-2xl'>
				<div className='gold-stroke bg-surface-high p-8 text-center'>
					<h2 className='mb-4 font-black font-serif text-gold text-lg uppercase tracking-widest'>
						Load Your ROM
					</h2>
					<p className='mb-2 text-sm text-text-faint'>
						Use the cartridge slot in the top-right corner to load your original
						Japanese ROM. Portraits will appear across the site and you can
						download the English translation patch.
					</p>
					<p className='text-text-dim text-xs'>
						Everything runs locally in your browser — nothing is uploaded.
					</p>
				</div>
			</section>

			{/* What's Translated */}
			<section className='mx-auto mb-20 max-w-3xl'>
				<InscriptionHeader>What's Translated</InscriptionHeader>
				<div className='mt-8 grid grid-cols-2 gap-6 md:grid-cols-4'>
					<StatBlock label='Card Data' value='192 Lords' />
					<StatBlock label='Sage Cards' value='20 Sages' />
					<StatBlock label='Scripts' value='200+ Scenes' />
					<StatBlock label='UI Strings' value='Menus & HUD' />
				</div>
				<div className='mt-6 grid grid-cols-2 gap-6 md:grid-cols-4'>
					<StatBlock label='Skill Descriptions' value='All 192' />
					<StatBlock label='Campaign' value='6 Chapters' />
					<StatBlock label='Duel Mode' value='80 CPU Decks' />
					<StatBlock label='Tutorials' value='All Modes' />
				</div>
			</section>

			{/* Game Data */}
			<section className='mx-auto mb-20 max-w-3xl'>
				<InscriptionHeader>Game Data</InscriptionHeader>
				<div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-3'>
					<DataLink
						description='All 192 warriors — stats, skills, traits, and lore.'
						title='Lord Cards'
						to='/gamedata/lords'
					/>
					<DataLink
						description='20 advisors with tactics and formation abilities.'
						title='Sage Cards'
						to='/gamedata/sages'
					/>
					<DataLink
						description='80 CPU decks across Easy, Normal, and Hard.'
						title='Duel Decks'
						to='/gamedata/decks'
					/>
				</div>
			</section>

			{/* Guides */}
			<section className='mx-auto mb-20 max-w-3xl'>
				<InscriptionHeader>Guides</InscriptionHeader>
				<div className='mt-8 grid grid-cols-1 gap-6 md:grid-cols-2'>
					<DataLink
						description='Factions, units, mechanics, and terminology.'
						title="Beginner's Guide"
						to='/guides/beginners'
					/>
					<DataLink
						description='All 6 chapters plus Warring States mode.'
						title='Campaign Walkthrough'
						to='/guides/campaign'
					/>
					<DataLink
						description='Damage formulas, speed tables, and counters.'
						title='Combat Mechanics'
						to='/guides/combat'
					/>
					<DataLink
						description='Proven decks for S-rank Duel clears.'
						title='Deck Strategies'
						to='/guides/deck-strategies'
					/>
				</div>
				<div className='mt-4 text-center'>
					<Link
						className='font-sans text-text-faint text-xs uppercase tracking-wider hover:text-gold'
						to='/guides'
					>
						View all 8 guides →
					</Link>
				</div>
			</section>

			{/* About — Chronicle Scroll */}
			<section className='mx-auto mb-20 max-w-3xl'>
				<InscriptionHeader>About the Game</InscriptionHeader>
				<div className='chronicle-scroll mt-8 bg-surface-low p-6 text-sm text-text-muted leading-relaxed'>
					<p className='mb-4'>
						<strong className='text-gold-dim'>Sangokushi Taisen Ten</strong>{' '}
						(三国志大戦・天) is the Nintendo DS adaptation of SEGA's popular
						arcade card game. Command legendary Three Kingdoms heroes in
						real-time tactical battles — place cards on the touch screen,
						maneuver units, and activate devastating skills to breach the enemy
						castle.
					</p>
					<p className='mb-4'>
						The game features a 6-chapter campaign, 80 duel stages across 3
						difficulties, 192 lord cards across 4 factions (Wei, Shu, Wu, and
						Other), 20 sage advisors, and deep deck-building mechanics with an
						8-cost system.
					</p>
					<p>
						Originally released only in Japan, this fan translation project
						makes the full game accessible to English-speaking players for the
						first time.
					</p>
				</div>
			</section>
		</>
	);
}

/* ======================================================================== */
/* Inscription Header — gold text, cinnabar underline                       */
/* ======================================================================== */

function InscriptionHeader({children}: {children: string}) {
	return (
		<div className='text-center'>
			<h2 className='font-bold font-serif text-gold text-sm uppercase tracking-[0.2em]'>
				{children}
			</h2>
			<div className='mx-auto mt-2 h-0.5 w-12 bg-cinnabar' />
		</div>
	);
}

/* ======================================================================== */
/* Stat Block — tonal lift, no borders                                     */
/* ======================================================================== */

function StatBlock({label, value}: {label: string; value: string}) {
	return (
		<div className='bg-surface-high p-4 text-center'>
			<div className='font-bold font-serif text-gold text-lg'>{value}</div>
			<div className='mt-1 font-sans text-text-dim text-xs uppercase tracking-wider'>
				{label}
			</div>
		</div>
	);
}

/* ======================================================================== */
/* Data Link — tonal layering with gold hover                              */
/* ======================================================================== */

function DataLink({
	to,
	title,
	description,
}: {
	to: string;
	title: string;
	description: string;
}) {
	return (
		<Link
			className='group bg-surface-high p-5 transition-colors duration-150 hover:bg-surface-highest'
			to={to}
		>
			<h3 className='mb-2 font-bold font-serif text-text group-hover:text-gold'>
				{title}
			</h3>
			<p className='text-sm text-text-faint'>{description}</p>
			<div className='mt-3 font-sans text-cinnabar-light text-xs uppercase tracking-wider opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
				View →
			</div>
		</Link>
	);
}
