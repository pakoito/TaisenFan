import type {FallbackProps} from 'react-error-boundary'
import {Link} from 'react-router'
import {Button} from '@/components/ui/button'

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
				<Button onClick={resetErrorBoundary} variant='outline'>
					Try Again
				</Button>

				<Button
					asChild={true}
					className='bg-cinnabar font-bold text-gold uppercase tracking-wider hover:bg-cinnabar-light'
				>
					<Link to='/'>Return to the Chronicle</Link>
				</Button>
			</div>
		</section>
	)
}
