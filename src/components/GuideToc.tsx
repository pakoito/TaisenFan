import {useState} from 'react';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type {TocEntry} from '@/lib/guide-toc';
import {cn} from '@/lib/utils';

type GuideTocProps = {
	readonly entries: readonly TocEntry[];
};

/** Indentation + type treatment per heading depth. */
const DEPTH_CLASS: Record<1 | 2 | 3, string> = {
	1: 'pl-0 font-serif text-gold',
	2: 'pl-5 font-serif text-gold-dim',
	3: 'pl-10 text-sm text-text-muted',
};

/**
 * Smooth-scroll to a heading and reflect it in the URL hash without a full
 * navigation, so deep links like `…/guides/conquest#place-names` keep working
 * but in-page clicks stay snappy.
 *
 * Clicking an entry also collapses the TOC, which removes its expanded list
 * from the layout and pulls every heading upward. We reflect the hash now but
 * defer the scroll across two frames — after React commits the collapse and
 * the browser relays out — otherwise we aim at the pre-collapse position and
 * overshoot the target. The scroll is instant: a TOC entry can be thousands of
 * pixels away, and animating that far is both slow and lands imprecisely.
 */
function scrollToHeading(id: string): void {
	window.history.pushState(null, '', `#${id}`);

	function jump() {
		document.getElementById(id)?.scrollIntoView({block: 'start'});
	}

	requestAnimationFrame(() => requestAnimationFrame(jump));
}

/**
 * The "目次" — a guide's index, styled as an Imperial Chronicler scroll panel.
 * Collapsed by default; the cinnabar seal invites expansion. Renders a
 * depth-1-to-3 outline whose links scroll to the matching heading and update
 * the URL hash.
 */
export function GuideToc({entries}: GuideTocProps) {
	const [open, setOpen] = useState(false);

	if (entries.length === 0) {
		return null;
	}

	return (
		<Collapsible
			className='mb-10 bg-surface-low gold-stroke'
			onOpenChange={setOpen}
			open={open}
		>
			<CollapsibleTrigger className='group flex w-full items-center gap-4 px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-[-2px]'>
				{/* Cinnabar seal with vertical 目次 (mokuji — "index") */}
				<span
					aria-hidden='true'
					className='flex h-10 w-10 shrink-0 items-center justify-center bg-cinnabar font-serif text-base text-gold leading-none [writing-mode:vertical-rl]'
				>
					目次
				</span>

				<span className='flex flex-col'>
					<span className='font-serif text-gold-dim tracking-wide'>Index</span>
					<span className='font-sans text-text-faint text-xs uppercase tracking-wider'>
						{entries.length} sections · {open ? 'collapse' : 'expand'}
					</span>
				</span>

				{/* Brush-caret indicator — a fine gold stroke, not a stock icon */}
				<span
					aria-hidden='true'
					className={cn(
						'ml-auto h-2 w-2 border-gold-muted border-r border-b transition-transform duration-200 motion-reduce:transition-none',
						open ? '-translate-y-px rotate-[225deg]' : 'rotate-45',
					)}
				/>
			</CollapsibleTrigger>

			<CollapsibleContent>
				<div className='brushstroke-sep mx-4' />
				<nav aria-label='Guide contents' className='px-4 py-3'>
					<ul className='space-y-1.5'>
						{entries.map(entry => (
							// rehype-slug guarantees ids are unique within a page.
							<li className={DEPTH_CLASS[entry.depth]} key={entry.id}>
								<a
									className='inline-block tracking-wide no-underline transition-colors duration-150 hover:text-gold motion-reduce:transition-none'
									href={`#${entry.id}`}
									onClick={e => {
										e.preventDefault();
										// Collapse first; scrollToHeading defers the scroll until the
										// resulting layout change has committed.
										setOpen(false);
										scrollToHeading(entry.id);
									}}
								>
									{entry.text}
								</a>
							</li>
						))}
					</ul>
				</nav>
			</CollapsibleContent>
		</Collapsible>
	);
}
