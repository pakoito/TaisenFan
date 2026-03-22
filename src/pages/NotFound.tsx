import {useMemo} from 'react'
import {Link} from 'react-router'
import {PageHead} from '@/components/PageHead'

const EXCUSES = [
	{
		line: 'Kongming foresaw your arrival and set this page on fire.',
		subline: 'The flames of the Empty Fort Strategy spare no scroll.'
	},
	{
		line: 'Cao Cao fled with this page on horseback.',
		subline: 'He was last seen retreating through Huarong Trail.'
	},
	{
		line: 'Lu Bu stood guard here. Nobody dared deliver the page.',
		subline: 'Do not pursue Lu Bu.'
	},
	{
		line: 'Zhou Yu devised a brilliant plan for this page — then coughed blood and died.',
		subline: '"Why was I born if Zhuge Liang was also born?"'
	},
	{
		line: 'Guan Yu let this page cross the five passes.',
		subline: 'It slew six generals on its way out.'
	},
	{
		line: 'Zhang Fei screamed at this page from Changban Bridge.',
		subline: "The page retreated in terror. Cao Cao's army followed."
	},
	{
		line: 'Sima Yi suspects this page is an ambush and refuses to approach.',
		subline: 'He has ordered a full retreat, just to be safe.'
	},
	{
		line: 'This page swore an oath in a peach garden and left to fight injustice.',
		subline: 'It will return when the Han dynasty is restored.'
	},
	{
		line: 'Huang Gai volunteered to suffer so this page could be sacrificed.',
		subline: '"If not for the bitter, how would we know the sweet?"'
	},
	{
		line: 'Jiang Wei inherited this page, but lost it in his seventh northern expedition.',
		subline: 'Some say an eighth attempt is planned.'
	}
] as const

export function NotFound() {
	const excuse = useMemo(() => {
		const idx = Math.floor(Math.random() * EXCUSES.length)
		return EXCUSES[idx] ?? EXCUSES[0]
	}, [])

	return (
		<>
			<PageHead title='Page Not Found' />

			<section className='flex min-h-[60vh] flex-col items-center justify-center text-center'>
				{/* Display-sized 404 — gold leaf, stamped authority */}
				<h1 className='mb-2 font-black font-serif text-7xl text-gold tracking-tight md:text-9xl'>
					404
				</h1>

				<div className='brushstroke-sep mx-auto my-6 w-24' />

				<p className='mb-2 font-serif text-text-muted text-xl tracking-wide'>
					{excuse.line}
				</p>
				<p className='mx-auto mb-10 max-w-md text-sm text-text-faint italic leading-relaxed'>
					{excuse.subline}
				</p>

				{/* Imperial Seal — cinnabar action button */}
				<Link
					className='bg-cinnabar px-8 py-3 font-bold font-sans text-gold text-sm uppercase tracking-wider transition-colors hover:bg-cinnabar-light focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 motion-reduce:transition-none'
					to='/'
				>
					Return to the Chronicle
				</Link>
			</section>
		</>
	)
}
