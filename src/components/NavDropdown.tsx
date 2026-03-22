import {useCallback, useEffect, useRef, useState} from 'react'
import {NavLink, useLocation} from 'react-router'

export interface NavDropdownItem {
	readonly to: string
	readonly label: string
	readonly disabled?: boolean
}

interface Props {
	readonly label: string
	readonly items: readonly NavDropdownItem[]
	/** Route prefix that marks this dropdown as "active" (e.g. "/gamedata") */
	readonly activePrefix: string
}

export function NavDropdown({label, items, activePrefix}: Props) {
	const [open, setOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const location = useLocation()

	const isGroupActive = location.pathname.startsWith(activePrefix)

	// Close on route change
	useEffect(() => {
		setOpen(false)
	}, [location.pathname])

	// Close on outside click
	useEffect(() => {
		if (!open) return
		function handleClick(e: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false)
			}
		}
		document.addEventListener('click', handleClick)
		return () => {
			document.removeEventListener('click', handleClick)
		}
	}, [open])

	// Close on Escape
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === 'Escape' && open) {
				setOpen(false)
			}
		},
		[open]
	)

	const toggle = useCallback(() => {
		setOpen(prev => !prev)
	}, [])

	const triggerClass = [
		'flex items-center gap-1 px-4 py-2 text-sm font-sans font-medium tracking-wide uppercase transition-colors duration-150',
		'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-reduce:transition-none',
		isGroupActive
			? 'bg-cinnabar text-gold'
			: 'text-text-muted hover:bg-surface-highest hover:text-gold'
	].join(' ')

	return (
		<div className='relative' onKeyDown={handleKeyDown} ref={containerRef}>
			<button
				aria-expanded={open}
				aria-haspopup='true'
				className={triggerClass}
				onClick={toggle}
				type='button'
			>
				{label}
				<Chevron open={open} />
			</button>

			{open ? (
				<div
					className='absolute top-full left-0 z-50 mt-px min-w-56 bg-surface-high shadow-[0_0_40px_rgba(0,0,0,0.6)]'
					role='menu'
				>
					{items.map(item =>
						item.disabled ? (
							<span
								aria-disabled='true'
								className='block px-4 py-2.5 font-sans text-sm text-text-dim'
								key={item.to}
								role='menuitem'
							>
								{item.label}
								<span className='ml-2 text-xs text-text-dim opacity-60'>
									Soon
								</span>
							</span>
						) : (
							<NavLink
								className={({isActive}) =>
									[
										'block px-4 py-2.5 font-sans text-sm transition-colors duration-100 motion-reduce:transition-none',
										isActive
											? 'bg-cinnabar text-gold'
											: 'text-text-muted hover:bg-surface-highest hover:text-gold'
									].join(' ')
								}
								key={item.to}
								role='menuitem'
								to={item.to}
							>
								{item.label}
							</NavLink>
						)
					)}
				</div>
			) : null}
		</div>
	)
}

function Chevron({open}: {open: boolean}) {
	return (
		<svg
			aria-hidden='true'
			className={`h-3 w-3 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
			fill='none'
			stroke='currentColor'
			strokeWidth={2.5}
			viewBox='0 0 12 12'
		>
			<path d='M2.5 4.5 6 8 9.5 4.5' strokeLinecap='square' />
		</svg>
	)
}
