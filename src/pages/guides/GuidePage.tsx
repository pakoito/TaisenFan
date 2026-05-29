import {MDXProvider} from '@mdx-js/react';
import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {Link, useParams} from 'react-router';
import {GuideToc} from '@/components/GuideToc';
import {mdxComponents} from '@/components/MdxComponents';
import {PageHead} from '@/components/PageHead';
import {type TocEntry, tocFromHeadings} from '@/lib/guide-toc';
import {GUIDES} from '@/pages/guides/guide-registry';

const HASH_PREFIX = /^#/u;

export function GuidePage() {
	const {slug} = useParams<{slug: string}>();
	const guide = GUIDES.find(g => g.slug === slug);
	const articleRef = useRef<HTMLElement>(null);
	const [toc, setToc] = useState<readonly TocEntry[]>([]);
	const [tocSlug, setTocSlug] = useState(slug);

	// useMemo must be called unconditionally — use a fallback loader
	const Content = useMemo(
		() => (guide ? lazy(guide.load) : () => null),
		[guide],
	);

	// Build the TOC once the lazy guide body has committed (see GuideReady).
	// rehype-slug has stamped ids on the headings by then, so the rendered DOM
	// is the single source of truth for anchor targets.
	const handleReady = useCallback(() => {
		const el = articleRef.current;
		setToc(el ? tocFromHeadings(el) : []);
		scrollToHash();
	}, []);

	// Drop the previous guide's TOC immediately on navigation (no stale flash).
	if (tocSlug !== slug) {
		setTocSlug(slug);
		setToc([]);
	}

	if (!guide) {
		return <GuideNotFound />;
	}

	return (
		<>
			<PageHead title={guide.title} />

			{/* Back link */}
			<Link
				className='mb-6 inline-block font-sans text-text-faint text-xs uppercase tracking-wider hover:text-gold'
				to='/guides'
			>
				← All Guides
			</Link>

			<article className='mx-auto max-w-3xl' ref={articleRef}>
				<GuideToc entries={toc} />
				<Suspense fallback={<GuideLoading />} key={slug}>
					<MDXProvider components={mdxComponents}>
						<Content />
					</MDXProvider>
					<GuideReady onReady={handleReady} />
				</Suspense>
			</article>
		</>
	);
}

/**
 * Renders nothing; exists only to fire `onReady` after the sibling lazy guide
 * body commits. Suspense mounts both children together once the chunk loads,
 * so by this effect the headings (and their ids) are in the DOM.
 */
function GuideReady({onReady}: {onReady: () => void}) {
	useEffect(() => {
		onReady();
	}, [onReady]);
	return null;
}

/** Scroll to the heading named by the current URL hash, if present. */
function scrollToHash(): void {
	const id = decodeURIComponent(window.location.hash.replace(HASH_PREFIX, ''));
	const el = id ? document.getElementById(id) : null;
	if (!el) {
		return;
	}
	const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	el.scrollIntoView({behavior: reduce ? 'auto' : 'smooth'});
}

function GuideLoading() {
	return (
		<p className='py-20 text-center font-serif text-text-faint'>
			Loading guide…
		</p>
	);
}

function GuideNotFound() {
	return (
		<div className='py-20 text-center'>
			<p className='font-serif text-text-muted text-xl'>Guide not found</p>
			<Link
				className='mt-4 inline-block text-gold-dim underline underline-offset-2 hover:text-gold'
				to='/guides'
			>
				Back to all guides
			</Link>
		</div>
	);
}
