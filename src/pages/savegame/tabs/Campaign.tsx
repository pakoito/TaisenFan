import {Input} from '@/components/ui/input';
import {Switch} from '@/components/ui/switch';
import {useSave} from '@/contexts/useSave';
import {
	CAMPAIGN,
	type CampaignEntry,
	type ChapterKey,
	type SaveProfile,
	type ScenarioRecord,
	setCampaignEntryListed,
} from '@/save-tools';
import {EXPLAINERS} from '../explainers';

function EventGallerySection() {
	const {profile, mutate} = useSave();
	if (!profile) return null;
	const hasPartial = profile.achievements.campaignEventsRaw !== undefined;
	const isAll = profile.achievements.campaignEventsUnlocked === 'all';
	const offLabel = hasPartial ? 'Preserve in-game progress' : 'No events';
	return (
		<section className='gold-stroke flex items-center justify-between gap-3 bg-surface-low p-4 text-xs'>
			<span className='flex flex-col'>
				<span className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
					Event gallery
				</span>
				<span className='text-text-faint'>
					{EXPLAINERS.campaignEventsUnlocked}
				</span>
				<span className='mt-1 text-text-faint'>
					{isAll ? 'All unlocked.' : `${offLabel}.`}
				</span>
			</span>
			<Switch
				aria-label='Unlock all campaign events'
				checked={isAll}
				onCheckedChange={checked => {
					mutate(draft => {
						if (checked) {
							draft.achievements.campaignEventsUnlocked = 'all';
						} else {
							draft.achievements.campaignEventsUnlocked = draft.achievements
								.campaignEventsRaw
								? 'partial'
								: 'none';
						}
					});
				}}
			/>
		</section>
	);
}

const CHAPTERS: {key: ChapterKey; title: string; subtitle: string}[] = [
	{
		key: 'chapter1',
		title: 'Chapter 1',
		subtitle: 'Yellow Turban Rebellion (第一章 黄巾の乱)',
	},
	{
		key: 'chapter2',
		title: 'Chapter 2',
		subtitle: 'The Tyrant Demon King (第二章 暴虐の魔王)',
	},
	{
		key: 'chapter3',
		title: 'Chapter 3',
		subtitle: 'Rival Warlords (第三章 群雄割拠)',
	},
	{
		key: 'chapter4',
		title: 'Chapter 4',
		subtitle: 'The Strongest Warrior (第四章 最強の武)',
	},
	{
		key: 'chapter5',
		title: 'Chapter 5',
		subtitle: 'Battle of Red Cliffs (第五章 赤壁の戦い)',
	},
	{
		key: 'chapter6',
		title: 'Chapter 6',
		subtitle: 'Three Kingdoms (第六章 天下三分)',
	},
];

const STAGE_LABELS = ['Stage I', 'Stage II', 'Stage III'] as const;

/** The record of `entry`'s stage `stage` inside a draft profile. */
function recordOf(
	draft: SaveProfile,
	entry: CampaignEntry,
	stage: number,
): ScenarioRecord {
	return entry === 'warringStates'
		? draft.campaign.warringStates.record
		: draft.campaign.chapters[entry].stages[stage as 0 | 1 | 2];
}

function clampInput(value: string, max: number): number {
	return Math.max(0, Math.min(max, Math.trunc(Number(value)) || 0));
}

function ScenarioFields({
	entry,
	stage,
	label,
	record,
	open,
}: {
	entry: CampaignEntry;
	stage: number;
	label: string;
	record: ScenarioRecord;
	open: boolean;
}) {
	const {mutate} = useSave();
	return (
		<div className='flex flex-col gap-1 text-xs'>
			<span className='font-sans text-[10px] text-text-faint uppercase tracking-wider'>
				{label}
			</span>
			<span
				className='flex items-center justify-between gap-2'
				title={EXPLAINERS.scenarioClears}
			>
				<span className='text-text-muted'>Clears</span>
				<Input
					aria-label={`${label} clears`}
					className='w-16 border-0 border-border-dim border-b bg-transparent text-right font-mono text-text text-xs'
					disabled={!open}
					inputMode='numeric'
					max={CAMPAIGN.MAX_CLEARS}
					min={0}
					onChange={e => {
						const value = clampInput(e.target.value, CAMPAIGN.MAX_CLEARS);
						mutate(draft => {
							recordOf(draft, entry, stage).clears = value;
						});
					}}
					placeholder='-'
					type='number'
					value={open ? (record.clears ?? 0) : ''}
				/>
			</span>
			<span
				className='flex items-center justify-between gap-2'
				title={EXPLAINERS.scenarioBest}
			>
				<span className='text-text-muted'>Best</span>
				<Input
					aria-label={`${label} best score`}
					className='w-20 border-0 border-border-dim border-b bg-transparent text-right font-mono text-text text-xs'
					inputMode='numeric'
					max={CAMPAIGN.MAX_BEST}
					min={0}
					onChange={e => {
						const value = clampInput(e.target.value, CAMPAIGN.MAX_BEST);
						mutate(draft => {
							recordOf(draft, entry, stage).bestScore = value;
						});
					}}
					type='number'
					value={record.bestScore}
				/>
			</span>
		</div>
	);
}

function ListedSwitch({
	entry,
	title,
	listed,
}: {
	entry: CampaignEntry;
	title: string;
	listed: boolean;
}) {
	const {mutate} = useSave();
	const always = entry === 'chapter1';
	return (
		<span
			className='flex items-center gap-2 text-xs'
			title={always ? EXPLAINERS.chapterAlwaysListed : EXPLAINERS.chapterListed}
		>
			<span className='font-sans text-[10px] text-text-faint uppercase tracking-wider'>
				{always ? 'Always listed' : 'Listed'}
			</span>
			<Switch
				aria-label={`${title} listed`}
				checked={listed}
				disabled={always}
				onCheckedChange={checked => {
					mutate(draft => {
						setCampaignEntryListed(draft.campaign, entry, checked);
					});
				}}
			/>
		</span>
	);
}

function ChapterRow({chapter}: {chapter: (typeof CHAPTERS)[number]}) {
	const {profile, mutate} = useSave();
	if (!profile) return null;
	const state = profile.campaign.chapters[chapter.key];

	return (
		<section className='gold-stroke flex flex-col gap-3 bg-surface-low p-4'>
			<header className='flex flex-wrap items-start justify-between gap-3'>
				<span>
					<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
						{chapter.title}
					</p>
					<p className='text-text-faint text-xs'>{chapter.subtitle}</p>
				</span>
				<span className='flex flex-wrap items-center gap-4'>
					<ListedSwitch
						entry={chapter.key}
						listed={state.listed}
						title={chapter.title}
					/>
					<span
						className='flex items-center gap-2 text-xs'
						title={EXPLAINERS.chapterStage3}
					>
						<span className='font-sans text-[10px] text-text-faint uppercase tracking-wider'>
							Stage III offered
						</span>
						<Switch
							aria-label={`${chapter.title} stage III offered`}
							checked={state.stage3}
							disabled={!state.listed}
							onCheckedChange={checked => {
								mutate(draft => {
									draft.campaign.chapters[chapter.key].stage3 = checked;
								});
							}}
						/>
					</span>
				</span>
			</header>
			<div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
				{state.stages.map((record, i) => (
					<ScenarioFields
						entry={chapter.key}
						key={STAGE_LABELS[i]}
						label={`${chapter.title} ${STAGE_LABELS[i]}`}
						open={state.listed}
						record={record}
						stage={i}
					/>
				))}
			</div>
		</section>
	);
}

function WarringStatesRow() {
	const {profile} = useSave();
	if (!profile) return null;
	const ws = profile.campaign.warringStates;
	return (
		<section className='gold-stroke flex flex-col gap-3 bg-surface-low p-4'>
			<header className='flex flex-wrap items-start justify-between gap-3'>
				<span>
					<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
						Warring States
					</p>
					<p className='text-text-faint text-xs'>
						戦乱: {EXPLAINERS.warringStates}
					</p>
				</span>
				<ListedSwitch
					entry='warringStates'
					listed={ws.listed}
					title='Warring States'
				/>
			</header>
			<div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
				<ScenarioFields
					entry='warringStates'
					label='Warring States'
					open={ws.listed}
					record={ws.record}
					stage={0}
				/>
			</div>
		</section>
	);
}

export function Campaign() {
	const {profile} = useSave();
	if (!profile) return null;

	return (
		<div className='flex flex-col gap-5'>
			<section className='border-border-dim border-l-2 bg-surface-low/40 p-3 text-text-faint text-xs'>
				The CONQUEST (戦略ノ章) chapter list always has the prologue (序章) and
				Chapter 1. Each later chapter, then Warring States, is{' '}
				<span className='text-text-muted'>LISTED</span> once a stage of the one
				before it is cleared. A chapter offers stages I and II;{' '}
				<span className='text-text-muted'>STAGE III</span> appears once both are
				cleared. Clear counts and best scores are kept in the campaign save
				block and survive starting a new campaign. A campaign in progress is
				kept as it is.
			</section>
			<div className='flex flex-col gap-3'>
				{CHAPTERS.map(c => (
					<ChapterRow chapter={c} key={c.key} />
				))}
				<WarringStatesRow />
			</div>

			<EventGallerySection />
		</div>
	);
}
