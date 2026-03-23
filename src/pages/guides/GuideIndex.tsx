import {Link} from 'react-router';
import {PageHead} from '@/components/PageHead';
import {GUIDES} from '@/pages/guides/guide-registry';

export function GuideIndex() {
	return (
		<>
			<PageHead title='Guides' />

			<section className='py-10 text-center'>
				<h1 className='mb-2 font-black font-serif text-4xl text-gold tracking-tight'>
					Guides
				</h1>
				<div className='brushstroke-sep mx-auto my-6 w-24' />
				<p className='mx-auto max-w-md text-sm text-text-faint leading-relaxed'>
					Strategy guides, walkthroughs, and reference material for Sangokushi
					Taisen Ten.
				</p>
			</section>

			<div className='mx-auto grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2'>
				{GUIDES.map(guide => (
					<Link
						className='group bg-surface-high p-5 transition-colors duration-150 hover:bg-surface-highest'
						key={guide.slug}
						to={`/guides/${guide.slug}`}
					>
						<h2 className='mb-1 font-bold font-serif text-text group-hover:text-gold'>
							{guide.title}
						</h2>
						<span className='font-sans text-cinnabar-light text-xs uppercase tracking-wider opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
							Read →
						</span>
					</Link>
				))}
			</div>
		</>
	);
}
