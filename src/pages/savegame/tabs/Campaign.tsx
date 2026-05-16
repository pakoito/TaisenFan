import {Switch} from '@/components/ui/switch';
import {useSave} from '@/contexts/useSave';
import type {ChapterProgress, SaveProfile} from '@/save-tools';
import {EXPLAINERS} from '../explainers';

function EventGallerySection() {
	const {profile, mutate} = useSave();
	if (!profile) return null;
	return (
		<section className='gold-stroke flex items-center justify-between gap-3 bg-surface-low p-4 text-xs'>
			<span className='flex flex-col'>
				<span className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
					Event gallery
				</span>
				<span className='text-text-faint'>
					{EXPLAINERS.campaignEventsUnlocked}
				</span>
			</span>
			<Switch
				aria-label='Campaign event gallery unlocked'
				checked={profile.achievements.campaignEventsUnlocked === 'all'}
				onCheckedChange={checked => {
					mutate(draft => {
						draft.achievements.campaignEventsUnlocked = checked
							? 'all'
							: 'none';
					});
				}}
			/>
		</section>
	);
}

type ChapterKey = keyof SaveProfile['campaign']['chapters'];

const CHAPTERS: {key: ChapterKey; title: string; subtitle: string}[] = [
	{
		key: 'chapter1',
		title: 'Chapter 1',
		subtitle: 'Yellow Turban Rebellion (黄巾の乱)',
	},
	{
		key: 'chapter2',
		title: 'Chapter 2',
		subtitle: 'The Tyrant Demon King (暴虐の魔王)',
	},
	{
		key: 'chapter3',
		title: 'Chapter 3',
		subtitle: 'Rival Warlords (群雄割拠)',
	},
	{
		key: 'chapter4',
		title: 'Chapter 4',
		subtitle: 'The Strongest Warrior (最強の武)',
	},
	{
		key: 'chapter5',
		title: 'Chapter 5',
		subtitle: 'Battle of Red Cliffs (赤壁の戦い)',
	},
	{
		key: 'chapter6',
		title: 'Chapter 6',
		subtitle: 'Three Kingdoms (天下三分)',
	},
];

type Ch3Variant = keyof SaveProfile['campaign']['chapter3Variants'];
const VARIANT_LABELS: {key: Ch3Variant; label: string}[] = [
	{key: 'yellowTurbanRebellion', label: 'Yellow Turban Rebellion'},
	{key: 'tyrantDemonKing', label: 'Tyrant Demon King'},
	{key: 'rivalWarlords', label: 'Rival Warlords'},
	{key: 'redCliffs', label: 'Red Cliffs'},
	{key: 'threeKingdomsDivision', label: 'Three Kingdoms Division'},
	{key: 'mightiestWarrior', label: 'Mightiest Warrior'},
];

type FieldKey = keyof ChapterProgress;
const FIELDS: {key: FieldKey; label: string; explainer: string}[] = [
	{key: 'unlocked', label: 'Open', explainer: EXPLAINERS.chapterUnlocked},
	{key: 'stage1Completed', label: 'Ep. 1', explainer: EXPLAINERS.chapterStage1},
	{key: 'stage2Completed', label: 'Ep. 2', explainer: EXPLAINERS.chapterStage2},
	{key: 'stage3Completed', label: 'Ep. 3', explainer: EXPLAINERS.chapterStage3},
	{
		key: 'rewardCardObtained',
		label: 'Reward',
		explainer: EXPLAINERS.chapterReward,
	},
];

function ChapterRow({chapter}: {chapter: (typeof CHAPTERS)[number]}) {
	const {profile, mutate} = useSave();
	if (!profile) return null;
	const state = profile.campaign.chapters[chapter.key];

	return (
		<section className='gold-stroke flex flex-col gap-3 bg-surface-low p-4'>
			<header>
				<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
					{chapter.title}
				</p>
				<p className='text-text-faint text-xs'>{chapter.subtitle}</p>
			</header>
			<div className='grid grid-cols-2 gap-3 md:grid-cols-5'>
				{FIELDS.map(field => (
					<div
						className='flex flex-col gap-1 text-xs'
						key={field.key}
						title={field.explainer}
					>
						<span className='font-sans text-[10px] text-text-faint uppercase tracking-wider'>
							{field.label}
						</span>
						<Switch
							aria-label={`${chapter.title} ${field.label}`}
							checked={state[field.key]}
							onCheckedChange={checked => {
								mutate(draft => {
									draft.campaign.chapters[chapter.key][field.key] = checked;
								});
							}}
						/>
					</div>
				))}
			</div>
		</section>
	);
}

export function Campaign() {
	const {profile, mutate} = useSave();
	if (!profile) return null;

	return (
		<div className='flex flex-col gap-5'>
			<div className='flex flex-col gap-3'>
				{CHAPTERS.map(c => (
					<ChapterRow chapter={c} key={c.key} />
				))}
			</div>

			<section className='gold-stroke flex flex-col gap-3 bg-surface-low p-4'>
				<header>
					<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
						Chapter 3 — branch unlocks
					</p>
					<p className='text-text-faint text-xs'>
						{EXPLAINERS.chapter3Variants}
					</p>
				</header>
				<div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
					{VARIANT_LABELS.map(v => (
						<div className='flex items-center gap-2 text-xs' key={v.key}>
							<Switch
								aria-label={v.label}
								checked={profile.campaign.chapter3Variants[v.key]}
								onCheckedChange={checked => {
									mutate(draft => {
										draft.campaign.chapter3Variants[v.key] = checked;
									});
								}}
							/>
							<span className='text-text-muted'>{v.label}</span>
						</div>
					))}
				</div>
			</section>

			<section className='gold-stroke flex flex-col gap-3 bg-surface-low p-4'>
				<header>
					<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
						Warring States
					</p>
					<p className='text-text-faint text-xs'>{EXPLAINERS.warringStates}</p>
				</header>
				<div className='flex flex-wrap items-center gap-4 text-xs'>
					<div className='flex items-center gap-2'>
						<Switch
							aria-label='Warring States unlocked'
							checked={profile.campaign.warringStates.unlocked}
							onCheckedChange={checked => {
								mutate(draft => {
									draft.campaign.warringStates.unlocked = checked;
								});
							}}
						/>
						<span className='text-text-muted'>Unlocked</span>
					</div>
					<div className='flex items-center gap-2'>
						<Switch
							aria-label='Warring States completed'
							checked={profile.campaign.warringStates.completed}
							onCheckedChange={checked => {
								mutate(draft => {
									draft.campaign.warringStates.completed = checked;
								});
							}}
						/>
						<span className='text-text-muted'>Completed</span>
					</div>
				</div>
			</section>

			<EventGallerySection />
		</div>
	);
}
