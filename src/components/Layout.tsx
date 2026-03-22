import type {PropsWithChildren} from 'react'
import {NavLink} from 'react-router'
import {NavDropdown, type NavDropdownItem} from '@/components/NavDropdown'

const GUIDE_ITEMS: readonly NavDropdownItem[] = [
	{to: '/guides/beginners', label: "Beginner's Guide", disabled: true},
	{to: '/guides/campaign', label: 'Campaign Walkthrough', disabled: true},
	{to: '/guides/campaign-merchants', label: 'Campaign Merchants', disabled: true},
	{to: '/guides/combat', label: 'Combat Mechanics', disabled: true},
	{to: '/guides/deck-archetypes', label: 'Deck Archetypes', disabled: true},
	{to: '/guides/deck-strategies', label: 'Deck Strategies', disabled: true},
	{to: '/guides/duel', label: 'DUEL Guide', disabled: true},
	{to: '/guides/tactics', label: 'Tactics Guide', disabled: true}
]

const GAMEDATA_ITEMS: readonly NavDropdownItem[] = [
	{to: '/gamedata/lords', label: 'Lord Cards'},
	{to: '/gamedata/sages', label: 'Sage Cards'},
	{to: '/gamedata/decks', label: 'Duel Decks'}
]

function navLinkClass({isActive}: {isActive: boolean}): string {
	const base =
		'px-4 py-2 text-sm font-sans font-medium tracking-wide uppercase transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-reduce:transition-none'
	return isActive
		? `${base} bg-cinnabar text-gold`
		: `${base} text-text-muted hover:bg-surface-highest hover:text-gold`
}

export function Layout({children}: PropsWithChildren) {
	return (
		<div className='flex min-h-screen flex-col'>
			{/* Header — obsidian bar with gold branding */}
			<header className='border-border-dim border-b bg-surface-dim'>
				<nav
					aria-label='Main navigation'
					className='mx-auto flex max-w-7xl items-center gap-1 px-6 py-4'
				>
					<NavLink
						className='mr-8 font-black font-serif text-gold text-xl tracking-widest focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2'
						to='/'
					>
						<span className='text-cinnabar-light'>大戦</span>
						<span className='text-gold-dim'>FAN</span>
					</NavLink>

					<div className='flex items-center gap-0.5'>
						<NavLink className={navLinkClass} end={true} to='/'>
							Home
						</NavLink>

						<NavDropdown
							activePrefix='/guides'
							items={GUIDE_ITEMS}
							label='Guides'
						/>

						<NavDropdown
							activePrefix='/gamedata'
							items={GAMEDATA_ITEMS}
							label='Game Data'
						/>

						<span
							aria-disabled='true'
							className='px-4 py-2 font-sans text-sm font-medium uppercase tracking-wide text-text-dim'
							title='Coming soon'
						>
							Save Editor
						</span>
					</div>
				</nav>
			</header>

			{/* Main content */}
			{/* biome-ignore lint/correctness/useUniqueElementIds: static landmark ID for skip-link */}
			<main
				className='mx-auto w-full max-w-7xl flex-1 px-6 py-10'
				id='main-content'
			>
				{children}
			</main>

			{/* Footer — subtle, receding */}
			<footer className='bg-surface-dim px-6 py-6'>
				<div className='brushstroke-sep mx-auto mb-4 max-w-7xl' />
				<p className='text-center font-sans text-text-dim text-xs uppercase tracking-wider'>
					TaisenFan — Fan site for Sangokushi Taisen Ten (三国志大戦DS)
				</p>
			</footer>
		</div>
	)
}
