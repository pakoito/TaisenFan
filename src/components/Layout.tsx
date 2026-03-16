import type {PropsWithChildren} from 'react'
import {NavLink} from 'react-router'

const NAV_LINKS = [
	{to: '/', label: 'Home'},
	{to: '/gamedata/lords', label: 'Lord Cards'},
	{to: '/gamedata/sages', label: 'Sage Cards'},
	{to: '/gamedata/decks', label: 'Duel Decks'}
] as const

function navClass({isActive}: {isActive: boolean}): string {
	const base =
		'px-3 py-2 text-sm font-medium rounded transition-colors duration-150'
	return isActive
		? `${base} bg-crimson-600 text-white`
		: `${base} text-parchment-200 hover:bg-emerald-700 hover:text-white`
}

export function Layout({children}: PropsWithChildren) {
	return (
		<div className='flex min-h-screen flex-col'>
			<header className='bg-emerald-700'>
				<nav className='mx-auto flex max-w-7xl items-center gap-1 px-4 py-3'>
					<NavLink className='mr-4 font-bold text-gold-300 text-lg' to='/'>
						TaisenFan
					</NavLink>
					{NAV_LINKS.map(({to, label}) => (
						<NavLink className={navClass} key={to} to={to}>
							{label}
						</NavLink>
					))}
				</nav>
			</header>
			<main className='mx-auto w-full max-w-7xl flex-1 px-4 py-6'>
				{children}
			</main>
			<footer className='border-parchment-300 border-t bg-parchment-100 py-4 text-center text-ink-400 text-sm dark:border-ink-700 dark:bg-ink-900'>
				TaisenFan — Fan site for Sangokushi Taisen Ten (三国志大戦DS)
			</footer>
		</div>
	)
}
