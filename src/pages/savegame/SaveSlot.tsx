import {useCallback, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type {SaveFormat, SaveStatus} from '@/contexts/save-types';
import {useSave} from '@/contexts/useSave';

/* ======================================================================== */
/* Memory-card SVG icons                                                    */
/* (Visual sibling to CartridgeOutline/CartridgeFilled — a chip silhouette)  */
/* ======================================================================== */

function ChipOutline({className}: {className?: string}) {
	return (
		<svg
			aria-hidden={true}
			className={className}
			fill='none'
			height='22'
			viewBox='0 0 24 22'
			width='24'
			xmlns='http://www.w3.org/2000/svg'
		>
			<title>Save slot</title>
			<path
				d='M3 2 H17 L21 6 V20 H3 Z'
				stroke='currentColor'
				strokeWidth='1.5'
			/>
			<path
				d='M7 6 H15'
				stroke='currentColor'
				strokeLinecap='round'
				strokeWidth='1.2'
			/>
			<path
				d='M7 9 H15'
				stroke='currentColor'
				strokeLinecap='round'
				strokeWidth='1.2'
			/>
			<rect
				height='6'
				stroke='currentColor'
				strokeWidth='1'
				width='10'
				x='7'
				y='12'
			/>
		</svg>
	);
}

function ChipFilled({className}: {className?: string}) {
	return (
		<svg
			aria-hidden={true}
			className={className}
			fill='none'
			height='22'
			viewBox='0 0 24 22'
			width='24'
			xmlns='http://www.w3.org/2000/svg'
		>
			<title>Save slot loaded</title>
			<path
				d='M3 2 H17 L21 6 V20 H3 Z'
				fill='currentColor'
				opacity='0.85'
				stroke='currentColor'
				strokeWidth='1.5'
			/>
			<path
				d='M7 6 H15'
				opacity='0.4'
				stroke='var(--color-surface-dim, #1a1a1a)'
				strokeLinecap='round'
				strokeWidth='1.2'
			/>
			<path
				d='M7 9 H15'
				opacity='0.4'
				stroke='var(--color-surface-dim, #1a1a1a)'
				strokeLinecap='round'
				strokeWidth='1.2'
			/>
			<rect
				fill='var(--color-surface-dim, #1a1a1a)'
				height='6'
				opacity='0.55'
				width='10'
				x='7'
				y='12'
			/>
		</svg>
	);
}

function SaveIcon({status, dirty}: {status: SaveStatus; dirty: boolean}) {
	if (status === 'empty') {
		return <ChipOutline className='text-text-dim' />;
	}
	const pulse = dirty ? 'animate-pulse text-gold-dim' : 'text-gold';
	return <ChipFilled className={pulse} />;
}

function statusLabel(
	status: SaveStatus,
	filename: string | null,
	dirty: boolean,
): string {
	if (status === 'empty') return 'No save loaded';
	if (status === 'new') return dirty ? 'New save · unsaved' : 'New save';
	return `${filename ?? 'sav file'}${dirty ? ' · edited' : ''}`;
}

/* ======================================================================== */
/* Status panel                                                             */
/* ======================================================================== */

function StatusPanel({
	status,
	filename,
	isDirty,
	error,
}: {
	status: SaveStatus;
	filename: string | null;
	isDirty: boolean;
	error: string | null;
}) {
	return (
		<>
			<SaveIcon dirty={isDirty} status={status} />
			<div className='min-w-0 flex-1'>
				<p className='truncate font-sans text-text text-xs uppercase tracking-wider'>
					{statusLabel(status, filename, isDirty)}
				</p>
				{error ? (
					<p className='mt-0.5 text-cinnabar-light text-xs'>{error}</p>
				) : (
					<p className='mt-0.5 text-text-faint text-[10px]'>
						{status === 'empty'
							? 'Generate a clean save, or upload an existing .sav / .dsv to edit.'
							: 'Changes persist across pages. Download to keep them after closing the tab.'}
					</p>
				)}
			</div>
		</>
	);
}

/* ======================================================================== */
/* Empty-state actions                                                      */
/* ======================================================================== */

function EmptyActions({
	onNew,
	onUpload,
	inputRef,
}: {
	onNew: () => void;
	onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
	inputRef: React.RefObject<HTMLInputElement | null>;
}) {
	return (
		<>
			<Button
				className='bg-cinnabar font-bold text-gold uppercase tracking-wider hover:bg-cinnabar-light'
				onClick={onNew}
				size='sm'
			>
				New Save
			</Button>
			<label className='cursor-pointer'>
				<Button asChild={true} size='sm' variant='outline'>
					<span>Upload .sav / .dsv</span>
				</Button>
				<input
					accept='.sav,.dsv'
					className='sr-only'
					onChange={onUpload}
					ref={inputRef}
					type='file'
				/>
			</label>
		</>
	);
}

/* ======================================================================== */
/* Loaded-state actions                                                     */
/* ======================================================================== */

function LoadedActions({
	status,
	format,
	onFormatChange,
	onDownload,
	onClear,
}: {
	status: SaveStatus;
	format: SaveFormat;
	onFormatChange: (f: SaveFormat) => void;
	onDownload: () => void;
	onClear: () => void;
}) {
	return (
		<>
			<Select
				onValueChange={v => {
					onFormatChange(v as SaveFormat);
				}}
				value={format}
			>
				<SelectTrigger
					aria-label='Download format'
					className='h-7 w-20 border-border-dim bg-transparent font-sans text-text text-xs uppercase tracking-wider'
				>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value='sav'>.sav</SelectItem>
					<SelectItem value='dsv'>.dsv</SelectItem>
				</SelectContent>
			</Select>
			<Button
				className='bg-cinnabar font-bold text-gold uppercase tracking-wider hover:bg-cinnabar-light'
				onClick={onDownload}
				size='sm'
			>
				Download .{format}
			</Button>
			<Button onClick={onClear} size='sm' variant='ghost'>
				{status === 'uploaded' ? 'Eject' : 'Discard'}
			</Button>
		</>
	);
}

/* ======================================================================== */
/* SaveSlot strip                                                           */
/* ======================================================================== */

function inferFormat(name: string | null): SaveFormat {
	return name?.toLowerCase().endsWith('.dsv') ? 'dsv' : 'sav';
}

// Promise rejections are surfaced via SaveContext's error state.
function noop(): undefined {
	return;
}

function useSaveSlotHandlers(
	format: SaveFormat,
	setFormat: (f: SaveFormat) => void,
) {
	const {loadFile, download, clear} = useSave();
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				setFormat(inferFormat(file.name));
				loadFile(file).catch(noop);
			}
			if (inputRef.current) inputRef.current.value = '';
		},
		[loadFile, setFormat],
	);

	const handleDownload = useCallback(() => {
		download(format).catch(noop);
	}, [download, format]);

	const handleClear = useCallback(() => {
		clear().catch(noop);
	}, [clear]);

	return {inputRef, handleFileChange, handleDownload, handleClear};
}

export function SaveSlot() {
	const {status, filename, isDirty, error, newStarter} = useSave();
	const [format, setFormat] = useState<SaveFormat>(() => inferFormat(filename));
	const {inputRef, handleFileChange, handleDownload, handleClear} =
		useSaveSlotHandlers(format, setFormat);

	return (
		<section
			aria-label='Save slot'
			className='gold-stroke flex flex-wrap items-center gap-3 bg-surface-low px-4 py-3'
		>
			<StatusPanel
				error={error}
				filename={filename}
				isDirty={isDirty}
				status={status}
			/>
			<div className='flex shrink-0 flex-wrap items-center gap-2'>
				{status === 'empty' ? (
					<EmptyActions
						inputRef={inputRef}
						onNew={newStarter}
						onUpload={handleFileChange}
					/>
				) : (
					<LoadedActions
						format={format}
						onClear={handleClear}
						onDownload={handleDownload}
						onFormatChange={setFormat}
						status={status}
					/>
				)}
			</div>
		</section>
	);
}
