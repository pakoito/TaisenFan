import {MDXProvider} from '@mdx-js/react'
import {lazy, Suspense, useMemo} from 'react'
import {Link, useParams} from 'react-router'
import {mdxComponents} from '@/components/MdxComponents'
import {PageHead} from '@/components/PageHead'
import {GUIDES} from '@/pages/guides/guide-registry'

export function GuidePage() {
	const {slug} = useParams<{slug: string}>()
	const guide = GUIDES.find(g => g.slug === slug)

	// useMemo must be called unconditionally — use a fallback loader
	const Content = useMemo(
		() => (guide ? lazy(guide.load) : () => null),
		[guide]
	)

	if (!guide) {
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
		)
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

			<article className='mx-auto max-w-3xl'>
				<Suspense
					fallback={
						<p className='py-20 text-center font-serif text-text-faint'>
							Loading guide…
						</p>
					}
				>
					<MDXProvider components={mdxComponents}>
						<Content />
					</MDXProvider>
				</Suspense>
			</article>
		</>
	)
}
