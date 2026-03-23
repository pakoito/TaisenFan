import {lazy, Suspense} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import {Route, Routes} from 'react-router';
import {Layout} from '@/components/Layout';
import {RouteErrorFallback} from '@/components/RouteErrorFallback';
import {Home} from '@/pages/Home';
import {NotFound} from '@/pages/NotFound';

const Lords = lazy(() =>
	import('@/pages/gamedata/Lords').then(m => ({default: m.Lords})),
);
const Sages = lazy(() =>
	import('@/pages/gamedata/Sages').then(m => ({default: m.Sages})),
);
const Decks = lazy(() =>
	import('@/pages/gamedata/Decks').then(m => ({default: m.Decks})),
);
const GuideIndex = lazy(() =>
	import('@/pages/guides/GuideIndex').then(m => ({default: m.GuideIndex})),
);
const GuidePage = lazy(() =>
	import('@/pages/guides/GuidePage').then(m => ({default: m.GuidePage})),
);

function Loading() {
	return (
		<div className='flex min-h-[50vh] items-center justify-center'>
			<p className='font-serif text-lg text-text-faint'>Loading…</p>
		</div>
	);
}

export function App() {
	return (
		<Layout>
			<ErrorBoundary FallbackComponent={RouteErrorFallback}>
				<Suspense fallback={<Loading />}>
					<Routes>
						<Route element={<Home />} index={true} />
						<Route element={<GuideIndex />} path='guides' />
						<Route element={<GuidePage />} path='guides/:slug' />
						<Route element={<Lords />} path='gamedata/lords' />
						<Route element={<Sages />} path='gamedata/sages' />
						<Route element={<Decks />} path='gamedata/decks' />
						<Route element={<NotFound />} path='*' />
					</Routes>
				</Suspense>
			</ErrorBoundary>
		</Layout>
	);
}
