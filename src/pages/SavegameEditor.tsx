import {Suspense} from 'react';
import {PageHead} from '@/components/PageHead';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {useSave} from '@/contexts/useSave';
import {SaveSlot} from '@/pages/savegame/SaveSlot';
import {Campaign} from '@/pages/savegame/tabs/Campaign';
import {Cards} from '@/pages/savegame/tabs/Cards';
import {Duel} from '@/pages/savegame/tabs/Duel';
import {Overview} from '@/pages/savegame/tabs/Overview';
import {Sages} from '@/pages/savegame/tabs/Sages';
import {Stats} from '@/pages/savegame/tabs/Stats';

function TabFallback() {
	return (
		<p className='py-6 text-center font-serif text-text-faint text-sm'>
			Loading…
		</p>
	);
}

function EmptyState() {
	return (
		<div className='gold-stroke mt-6 flex flex-col gap-2 bg-surface-low p-6 text-center'>
			<p className='font-serif text-gold text-lg uppercase tracking-wider'>
				No save loaded
			</p>
			<p className='text-text-muted text-sm'>
				Use the Save Slot above to generate a fresh starter save, or upload your
				own <code className='text-gold-dim'>.sav</code> /{' '}
				<code className='text-gold-dim'>.dsv</code> exported from a flash cart
				or emulator. The editor remembers your work across page changes — the
				cartridge popup is unaffected.
			</p>
		</div>
	);
}

export function SavegameEditor() {
	const {status} = useSave();

	return (
		<div className='flex flex-col gap-4'>
			<PageHead title='Save Editor' />

			<header>
				<h1 className='font-black font-serif text-gold text-2xl tracking-wider'>
					Save Editor
				</h1>
				<p className='mt-1 text-text-muted text-xs'>
					Make a fresh save with every menu unlocked, or load your own and tweak
					unlock state. Changes ride along in your browser until you download.
				</p>
			</header>

			<SaveSlot />

			{status === 'empty' ? (
				<EmptyState />
			) : (
				<Tabs className='mt-4' defaultValue='overview'>
					<TabsList>
						<TabsTrigger value='overview'>Overview</TabsTrigger>
						<TabsTrigger value='cards'>Lords</TabsTrigger>
						<TabsTrigger value='sages'>Sages</TabsTrigger>
						<TabsTrigger value='duel'>DUEL</TabsTrigger>
						<TabsTrigger value='conquest'>CONQUEST</TabsTrigger>
						<TabsTrigger value='stats'>Stats &amp; Titles</TabsTrigger>
					</TabsList>
					<TabsContent value='overview'>
						<Overview />
					</TabsContent>
					<TabsContent value='cards'>
						<Suspense fallback={<TabFallback />}>
							<Cards />
						</Suspense>
					</TabsContent>
					<TabsContent value='sages'>
						<Suspense fallback={<TabFallback />}>
							<Sages />
						</Suspense>
					</TabsContent>
					<TabsContent value='duel'>
						<Duel />
					</TabsContent>
					<TabsContent value='conquest'>
						<Campaign />
					</TabsContent>
					<TabsContent value='stats'>
						<Stats />
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
