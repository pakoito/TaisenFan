import {type PropsWithChildren, useCallback, useEffect, useState} from 'react';
import {Link, NavLink, useLocation} from 'react-router';
import {CartridgeSlot} from '@/components/CartridgeSlot';
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {navigationMenuTriggerStyle} from '@/components/ui/navigation-menu-styles';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import {cn} from '@/lib/utils';

/* ======================================================================== */
/* Menu data                                                                */
/* ======================================================================== */

type DropdownItem = {
	readonly to: string;
	readonly label: string;
	readonly disabled?: boolean;
};

const GUIDE_ITEMS: readonly DropdownItem[] = [
	{to: '/guides/beginners', label: "Beginner's Guide"},
	{to: '/guides/campaign', label: 'Campaign Walkthrough'},
	{to: '/guides/campaign-merchants', label: 'Campaign Merchants'},
	{to: '/guides/combat', label: 'Combat Mechanics'},
	{to: '/guides/deck-archetypes', label: 'Deck Archetypes'},
	{to: '/guides/deck-strategies', label: 'Deck Strategies'},
	{to: '/guides/duel', label: 'DUEL Guide'},
	{to: '/guides/tactics', label: 'Tactics Guide'},
];

const GAMEDATA_ITEMS: readonly DropdownItem[] = [
	{to: '/gamedata/lords', label: 'Lord Cards'},
	{to: '/gamedata/sages', label: 'Sage Cards'},
	{to: '/gamedata/decks', label: 'Duel Decks'},
];

/* ======================================================================== */
/* Shared styles                                                            */
/* ======================================================================== */

const LINK_BASE =
	'px-4 py-2 text-sm font-sans font-medium tracking-wide uppercase transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold motion-reduce:transition-none';

function navLinkClass({isActive}: {isActive: boolean}): string {
	return isActive
		? `${LINK_BASE} bg-cinnabar text-gold`
		: `${LINK_BASE} text-text-muted hover:bg-surface-highest hover:text-gold`;
}

/* ======================================================================== */
/* Layout                                                                   */
/* ======================================================================== */

export function Layout({children}: PropsWithChildren) {
	return (
		<div className='flex min-h-screen flex-col'>
			{/* Header — obsidian bar with gold branding */}
			<header className='border-border-dim border-b bg-surface-dim'>
				<nav
					aria-label='Main navigation'
					className='mx-auto flex max-w-7xl items-center gap-1 px-4 py-3 md:px-6 md:py-4'
				>
					{/* Logo */}
					<NavLink
						className='shrink-0 font-black font-serif text-gold text-xl tracking-widest focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2'
						to='/'
					>
						<span className='text-cinnabar-light'>大戦</span>
						<span className='text-gold-dim'>FAN</span>
					</NavLink>

					{/* Desktop nav — hidden on mobile */}
					<div className='ml-8 hidden md:block'>
						<DesktopNav />
					</div>

					{/* Spacer */}
					<div className='flex-1' />

					{/* Cartridge slot — always visible */}
					<CartridgeSlot />

					{/* Mobile hamburger — hidden on desktop */}
					<MobileNav />
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
			<footer className='relative bg-surface-dim px-6 py-6'>
				<div className='brushstroke-sep mx-auto mb-4 max-w-7xl' />
				<div className='mx-auto max-w-7xl'>
					<p className='text-center font-sans text-text-dim text-xs uppercase tracking-wider'>
						TaisenFan — Fan site for Sangokushi Taisen Ten (三国志大戦DS)
					</p>
					<p className='mt-2 text-center font-sans text-text-dim text-[10px] leading-relaxed'>
						Sangokushi Taisen DS (三国志大戦DS) © 2008 SEGA / ALPHA-UNIT. This
						is an unofficial fan project with no affiliation to SEGA or
						ALPHA-UNIT. All game assets belong to their respective owners.
					</p>
				</div>
				<span className='absolute right-2 bottom-1 font-mono text-[8px] text-text-dim opacity-30'>
					{__BUILD_TIMESTAMP__}
				</span>
			</footer>
		</div>
	);
}

/* ======================================================================== */
/* Desktop nav (hidden on mobile)                                           */
/* ======================================================================== */

function DesktopNav() {
	return (
		<NavigationMenu viewport={false}>
			<NavigationMenuList>
				<NavigationMenuItem>
					<NavLink className={navLinkClass} end={true} to='/'>
						Home
					</NavLink>
				</NavigationMenuItem>

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

				<NavigationMenuItem>
					<span
						aria-disabled='true'
						className={cn(LINK_BASE, 'cursor-default text-text-dim')}
						title='Coming soon'
					>
						Save Editor
					</span>
				</NavigationMenuItem>
			</NavigationMenuList>
		</NavigationMenu>
	);
}

/* ======================================================================== */
/* Mobile nav — sheet drawer (hidden on desktop)                            */
/* ======================================================================== */

function MobileNav() {
	const [open, setOpen] = useState(false);
	const location = useLocation();

	// Close sheet on navigation
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentionally re-run on pathname change
	useEffect(() => {
		setOpen(false);
	}, [location.pathname]);

	const close = useCallback(() => {
		setOpen(false);
	}, []);

	return (
		<Sheet onOpenChange={setOpen} open={open}>
			<SheetTrigger
				aria-label='Open menu'
				className='ml-2 flex h-9 w-9 items-center justify-center text-text-muted hover:text-gold md:hidden'
			>
				<HamburgerIcon />
			</SheetTrigger>
			<SheetContent className='w-72 bg-surface-dim p-0' side='right'>
				<SheetHeader className='border-border-dim border-b px-4 py-4'>
					<SheetTitle className='font-black font-serif text-gold tracking-widest'>
						<span className='text-cinnabar-light'>大戦</span>
						<span className='text-gold-dim'>FAN</span>
					</SheetTitle>
				</SheetHeader>

				<div className='flex flex-col py-2'>
					<MobileLink label='Home' onClick={close} to='/' />

					<MobileSection label='Guides'>
						{GUIDE_ITEMS.map(item => (
							<MobileLink
								key={item.to}
								label={item.label}
								onClick={close}
								to={item.to}
							/>
						))}
					</MobileSection>

					<MobileSection label='Game Data'>
						{GAMEDATA_ITEMS.map(item => (
							<MobileLink
								key={item.to}
								label={item.label}
								onClick={close}
								to={item.to}
							/>
						))}
					</MobileSection>

					<span className='px-4 py-2 font-sans text-sm text-text-dim'>
						Save Editor — Coming soon
					</span>
				</div>
			</SheetContent>
		</Sheet>
	);
}

function MobileLink({
	to,
	label,
	onClick,
}: {
	to: string;
	label: string;
	onClick: () => void;
}) {
	return (
		<NavLink
			className={({isActive}) =>
				cn(
					'block px-4 py-2.5 font-sans text-sm transition-colors',
					isActive
						? 'bg-cinnabar text-gold'
						: 'text-text-muted hover:bg-surface-highest hover:text-gold',
				)
			}
			onClick={onClick}
			to={to}
		>
			{label}
		</NavLink>
	);
}

function MobileSection({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div>
			<div className='mt-2 px-4 py-1 font-bold font-sans text-[10px] text-text-dim uppercase tracking-wider'>
				{label}
			</div>
			{children}
		</div>
	);
}

function HamburgerIcon() {
	return (
		<svg
			aria-hidden='true'
			className='h-5 w-5'
			fill='none'
			stroke='currentColor'
			strokeLinecap='square'
			strokeWidth={2}
			viewBox='0 0 24 24'
		>
			<path d='M4 6h16M4 12h16M4 18h16' />
		</svg>
	);
}

/* ======================================================================== */
/* NavDropdown — shadcn NavigationMenu item (desktop only)                  */
/* ======================================================================== */

function NavDropdown({
	label,
	items,
	activePrefix,
}: {
	label: string;
	items: readonly DropdownItem[];
	activePrefix: string;
}) {
	const location = useLocation();
	const isGroupActive = location.pathname.startsWith(activePrefix);

	return (
		<NavigationMenuItem>
			<NavigationMenuTrigger
				className={cn(
					navigationMenuTriggerStyle(),
					LINK_BASE,
					'h-auto bg-transparent',
					isGroupActive
						? 'bg-cinnabar text-gold hover:bg-cinnabar'
						: 'text-text-muted hover:bg-surface-highest hover:text-gold',
				)}
			>
				{label}
			</NavigationMenuTrigger>
			<NavigationMenuContent className='min-w-56'>
				<ul className='flex flex-col'>
					{items.map(item => (
						<li key={item.to}>
							{item.disabled ? (
								<span className='flex items-center justify-between px-4 py-2.5 font-sans text-sm text-text-dim'>
									{item.label}
									<span className='text-xs opacity-60'>Soon</span>
								</span>
							) : (
								<NavigationMenuLink asChild={true}>
									<Link
										className={cn(
											'block px-4 py-2.5 font-sans text-sm text-text-muted transition-colors duration-100 hover:bg-surface-highest hover:text-gold motion-reduce:transition-none',
											location.pathname === item.to && 'bg-cinnabar text-gold',
										)}
										to={item.to}
									>
										{item.label}
									</Link>
								</NavigationMenuLink>
							)}
						</li>
					))}
				</ul>
			</NavigationMenuContent>
		</NavigationMenuItem>
	);
}
