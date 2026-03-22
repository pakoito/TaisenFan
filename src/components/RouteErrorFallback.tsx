import type {FallbackProps} from 'react-error-boundary'
import {Link} from 'react-router'

export function RouteErrorFallback({error, resetErrorBoundary}: FallbackProps) {
	return (
		<section className='flex min-h-[60vh] flex-col items-center justify-center text-center'>
			<h1 className='mb-2 font-black font-serif text-5xl text-cinnabar-light tracking-tight md:text-7xl'>
				災
			</h1>

			<div className='brushstroke-sep mx-auto my-6 w-24' />

			<p className='mb-2 font-serif text-text-muted text-xl tracking-wide'>
				Something went wrong
			</p>
			<p className='mx-auto mb-4 max-w-md text-sm text-text-faint leading-relaxed'>
				An unexpected error occurred while rendering this page.
			</p>

			{/* Error detail — chronicle scroll container */}
			<div className='chronicle-scroll mx-auto mb-8 max-w-lg bg-surface-low p-4 text-left'>
				<pre className='overflow-x-auto whitespace-pre-wrap font-mono text-text-dim text-xs'>
					{error instanceof Error ? error.message : String(error)}
				</pre>
			</div>

			<div className='flex items-center gap-4'>
				{/* Secondary ghost button */}
				<button
					className='border border-border bg-transparent px-8 py-3 font-bold font-sans text-gold text-sm uppercase tracking-wider transition-colors hover:bg-surface-highest focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 motion-reduce:transition-none'
					onClick={resetErrorBoundary}
					type='button'
				>
					Try Again
				</button>

				{/* Imperial Seal — cinnabar action button */}
				<Link
					className='bg-cinnabar px-8 py-3 font-bold font-sans text-gold text-sm uppercase tracking-wider transition-colors hover:bg-cinnabar-light focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 motion-reduce:transition-none'
					to='/'
				>
					Return to the Chronicle
				</Link>
			</div>
		</section>
	)
}
