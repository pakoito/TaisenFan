import {lazy, Suspense} from 'react'
import {Route, Routes} from 'react-router'
import {Layout} from '@/components/Layout'
import {Home} from '@/pages/Home'

const Lords = lazy(() =>
	import('@/pages/gamedata/Lords').then(m => ({default: m.Lords}))
)
const Sages = lazy(() =>
	import('@/pages/gamedata/Sages').then(m => ({default: m.Sages}))
)
const Decks = lazy(() =>
	import('@/pages/gamedata/Decks').then(m => ({default: m.Decks}))
)

function Loading() {
	return (
		<div className='flex min-h-[50vh] items-center justify-center'>
			<p className='text-ink-400 text-lg'>Loading…</p>
		</div>
	)
}

export function App() {
	return (
		<Layout>
			<Suspense fallback={<Loading />}>
				<Routes>
					<Route element={<Home />} index={true} />
					<Route element={<Lords />} path='gamedata/lords' />
					<Route element={<Sages />} path='gamedata/sages' />
					<Route element={<Decks />} path='gamedata/decks' />
				</Routes>
			</Suspense>
		</Layout>
	)
}
