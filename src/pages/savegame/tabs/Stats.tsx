import {Input} from '@/components/ui/input';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {useSave} from '@/contexts/useSave';
import type {SaveProfile} from '@/save-tools';
import {EXPLAINERS} from '../explainers';

type MasteryKey = keyof SaveProfile['stats']['mastery'];

const MASTERY_FIELDS: {key: MasteryKey; label: string; explainer: string}[] = [
	{
		key: 'cavalry',
		label: 'Cavalry charge',
		explainer: EXPLAINERS.masteryCavalry,
	},
	{key: 'spear', label: 'Spear thrust', explainer: EXPLAINERS.masterySpear},
	{key: 'bow', label: 'Bow run-shot', explainer: EXPLAINERS.masteryBow},
	{key: 'defeat', label: 'Defeats', explainer: EXPLAINERS.masteryDefeat},
	{key: 'siege', label: 'Siege damage', explainer: EXPLAINERS.masterySiege},
	{key: 'defense', label: 'Defense', explainer: EXPLAINERS.masteryDefense},
	{key: 'duel', label: 'Duel wins', explainer: EXPLAINERS.masteryDuel},
];

function NumberField({
	label,
	value,
	onChange,
	max,
	min = 0,
	explainer,
}: {
	label: string;
	value: number;
	onChange: (v: number) => void;
	max: number;
	min?: number;
	explainer?: string;
}) {
	return (
		<div className='flex flex-col gap-1' title={explainer}>
			<span className='font-sans text-[10px] text-text-faint uppercase tracking-wider'>
				{label}
			</span>
			<Input
				className='w-full max-w-24 border-0 border-border-dim border-b bg-transparent font-mono text-sm text-text'
				inputMode='numeric'
				max={max}
				min={min}
				onChange={e => {
					const v = Math.max(min, Math.min(max, Number(e.target.value) || 0));
					onChange(v);
				}}
				type='number'
				value={value}
			/>
		</div>
	);
}

function SectionShell({
	title,
	hint,
	children,
}: {
	title: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<section className='gold-stroke flex flex-col gap-3 bg-surface-low p-4'>
			<header>
				<p className='font-medium font-serif text-gold text-sm uppercase tracking-wider'>
					{title}
				</p>
				{hint ? <p className='text-text-faint text-xs'>{hint}</p> : null}
			</header>
			{children}
		</section>
	);
}

function PlayerNameSection() {
	const {profile, mutate} = useSave();
	if (!profile) return null;
	return (
		<SectionShell
			hint='The nickname the game shows you (and your opponent in Wi-Fi).
				Stored in the save header as Shift_JIS. Limit: 6 full-width
				characters (12 bytes).'
			title='Player name'
		>
			<Input
				autoComplete='off'
				className='w-64 border-0 border-border-dim border-b bg-transparent font-sans text-base text-text'
				maxLength={12}
				onChange={e => {
					const v = e.target.value;
					mutate(d => {
						d.playerName = v;
					});
				}}
				placeholder='ニックネーム'
				spellCheck={false}
				value={profile.playerName}
			/>
		</SectionShell>
	);
}

function WinLossSection() {
	const {profile, mutate} = useSave();
	if (!profile) return null;
	return (
		<SectionShell hint={EXPLAINERS.winsLosses} title='Win / loss records'>
			<div className='grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5'>
				<NumberField
					label='Offline wins'
					max={65_535}
					onChange={v => {
						mutate(d => {
							d.stats.offline.wins = v;
						});
					}}
					value={profile.stats.offline.wins}
				/>
				<NumberField
					label='Offline losses'
					max={65_535}
					onChange={v => {
						mutate(d => {
							d.stats.offline.losses = v;
						});
					}}
					value={profile.stats.offline.losses}
				/>
				<NumberField
					label='Offline draws'
					max={65_535}
					onChange={v => {
						mutate(d => {
							d.stats.offline.draws = v;
						});
					}}
					value={profile.stats.offline.draws}
				/>
				<NumberField
					explainer={EXPLAINERS.offlineRank}
					label='Offline rank'
					max={99_999}
					onChange={v => {
						mutate(d => {
							d.stats.offlineRank = v;
						});
					}}
					value={profile.stats.offlineRank}
				/>
				<NumberField
					explainer={EXPLAINERS.onlineRank}
					label='Online rank'
					max={12_000}
					onChange={v => {
						mutate(d => {
							d.stats.onlineRank = v;
						});
					}}
					value={profile.stats.onlineRank}
				/>
			</div>
		</SectionShell>
	);
}

function MasteryRow({field}: {field: (typeof MASTERY_FIELDS)[number]}) {
	const {profile, mutate} = useSave();
	if (!profile) return null;
	const value = profile.stats.mastery[field.key];
	return (
		<div className='flex flex-col gap-1'>
			<div className='flex items-center justify-between'>
				<span className='font-sans text-text-muted text-xs'>{field.label}</span>
				<span className='font-bold text-gold text-xs tabular-nums'>
					{value}
				</span>
			</div>
			<Slider
				max={999}
				min={0}
				onValueChange={values => {
					const v = values[0];
					if (typeof v !== 'number') return;
					mutate(d => {
						d.stats.mastery[field.key] = v;
					});
				}}
				step={1}
				value={[value]}
			/>
			<span className='text-text-faint text-[10px]'>{field.explainer}</span>
		</div>
	);
}

function MasterySection() {
	return (
		<SectionShell hint='0–999 per skill.' title='Mastery skills'>
			<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
				{MASTERY_FIELDS.map(field => (
					<MasteryRow field={field} key={field.key} />
				))}
			</div>
		</SectionShell>
	);
}

function TitlesSection() {
	const {profile, mutate} = useSave();
	if (!profile) return null;
	const hasPartial = profile.achievements.titlesRaw !== undefined;
	const isAll = profile.achievements.titlesUnlocked === 'all';
	const offLabel = hasPartial ? 'Preserve in-game progress' : 'No titles';
	return (
		<SectionShell title='Titles'>
			<div className='flex items-center justify-between gap-3 text-xs'>
				<span className='flex flex-col'>
					<span className='font-medium text-text'>
						{isAll ? 'All titles unlocked' : offLabel}
					</span>
					<span className='text-text-faint'>{EXPLAINERS.titlesUnlocked}</span>
				</span>
				<Switch
					aria-label='Unlock all titles'
					checked={isAll}
					onCheckedChange={checked => {
						mutate(d => {
							if (checked) {
								d.achievements.titlesUnlocked = 'all';
							} else {
								// Off restores whatever the source had — partial (if we
								// captured raw bytes from an uploaded save) or none.
								d.achievements.titlesUnlocked = d.achievements.titlesRaw
									? 'partial'
									: 'none';
							}
						});
					}}
				/>
			</div>
			<div className='flex flex-col gap-1' title={EXPLAINERS.selectedTitle}>
				<div className='flex items-center justify-between'>
					<span className='font-sans text-[10px] text-text-faint uppercase tracking-wider'>
						Selected title #
					</span>
					<span className='font-bold text-gold text-xs tabular-nums'>
						{profile.achievements.selectedTitle + 1}
					</span>
				</div>
				<Slider
					max={110}
					min={1}
					onValueChange={values => {
						const v = values[0];
						if (typeof v !== 'number') return;
						mutate(d => {
							d.achievements.selectedTitle = v - 1;
						});
					}}
					step={1}
					value={[profile.achievements.selectedTitle + 1]}
				/>
				<span className='text-text-faint text-[10px]'>
					{EXPLAINERS.selectedTitle}
				</span>
			</div>
		</SectionShell>
	);
}

export function Stats() {
	return (
		<div className='flex flex-col gap-5'>
			<PlayerNameSection />
			<WinLossSection />
			<MasterySection />
			<TitlesSection />
		</div>
	);
}
