import {useCallback, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import type {RomStatus} from '@/contexts/rom-types';
import {useRom} from '@/contexts/useRom';

// ============================================================================
// Placeholder cartridge SVGs (swap for custom art later)
// ============================================================================

function CartridgeOutline({className = ''}: {className?: string}) {
	return (
		<svg
			aria-hidden='true'
			className={className}
			fill='none'
			height='24'
			stroke='currentColor'
			strokeWidth='1.5'
			viewBox='0 0 20 24'
			width='20'
		>
			<rect height='20' rx='1' width='16' x='2' y='2' />
			<rect height='4' width='8' x='6' y='18' />
			<rect height='6' opacity='0.4' width='10' x='5' y='5' />
		</svg>
	);
}

function CartridgeFilled({className = ''}: {className?: string}) {
	return (
		<svg
			aria-hidden='true'
			className={className}
			fill='currentColor'
			height='24'
			viewBox='0 0 20 24'
			width='20'
		>
			<rect height='20' rx='1' width='16' x='2' y='2' />
			<rect
				fill='currentColor'
				height='4'
				opacity='0.6'
				width='8'
				x='6'
				y='18'
			/>
			<rect fill='black' height='6' opacity='0.3' width='10' x='5' y='5' />
		</svg>
	);
}

// ============================================================================
// Trigger icon + label
// ============================================================================

function CartridgeIcon({status}: {status: RomStatus}) {
	switch (status) {
		case 'loading':
		case 'extracting':
			return (
				<div className='flex items-center gap-1.5'>
					<CartridgeOutline className='animate-pulse text-gold-dim' />
				</div>
			);
		case 'stale':
			return (
				<div className='relative'>
					<CartridgeFilled className='text-text-faint' />
					<span className='absolute -top-0.5 -right-0.5 h-2 w-2 bg-gold' />
				</div>
			);
		case 'cached':
			return <CartridgeFilled className='text-text-faint' />;
		case 'loaded':
			return <CartridgeFilled className='text-gold' />;
		default:
			return <CartridgeOutline className='text-text-dim' />;
	}
}

function statusLabel(status: RomStatus): string {
	switch (status) {
		case 'loading':
			return 'Reading…';
		case 'extracting':
			return 'Extracting…';
		case 'stale':
			return 'Update available';
		case 'cached':
			return 'Cached';
		case 'loaded':
			return 'Loaded';
		default:
			return 'Load ROM';
	}
}

// ============================================================================
// Popover content by state
// ============================================================================

function EmptyContent({
	onFileChange,
}: {
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	return (
		<div className='flex flex-col items-center gap-3 py-2'>
			<p className='text-center text-sm text-text-muted'>
				Load your ROM to unlock portraits and the English translation patch.
			</p>
			<FilePickerButton onFileChange={onFileChange} />
		</div>
	);
}

function ExtractingContent() {
	const {progress} = useRom();
	const label = progress
		? `${progress.phase} ${progress.current}/${progress.total}`
		: 'Starting…';
	return (
		<div className='flex flex-col items-center gap-3 py-4'>
			<div className='h-6 w-6 animate-spin border-2 border-gold-muted border-t-gold' />
			<p className='font-sans text-sm text-text-muted'>{label}</p>
		</div>
	);
}

function StaleContent({
	onFileChange,
}: {
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	const {images, clearAll} = useRom();
	return (
		<div className='flex flex-col gap-3'>
			<p className='text-sm text-text-muted'>
				{images.size} portraits loaded from cache.
			</p>
			<p className='text-text-faint text-xs'>
				New image types available — load ROM to update.
			</p>
			<FilePickerButton onFileChange={onFileChange} />
			<button
				className='text-text-dim text-xs hover:text-gold'
				onClick={clearAll}
				type='button'
			>
				Clear cache
			</button>
		</div>
	);
}

function CachedContent({
	onFileChange,
}: {
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	const {images, clearAll} = useRom();
	return (
		<div className='flex flex-col gap-3'>
			<p className='text-sm text-text-muted'>
				{images.size} portraits loaded from cache.
			</p>
			<p className='text-text-faint text-xs'>
				Load ROM to enable the English translation patch.
			</p>
			<FilePickerButton onFileChange={onFileChange} />
			<button
				className='text-text-dim text-xs hover:text-gold'
				onClick={clearAll}
				type='button'
			>
				Clear cache
			</button>
		</div>
	);
}

function LoadedContent() {
	const {
		images,
		patchAndDownload,
		isPatching,
		patchProgress,
		eject,
		clearAll,
		error,
	} = useRom();

	return (
		<div className='flex flex-col gap-3'>
			<p className='text-sm text-text-muted'>
				ROM verified ✓ — {images.size} portraits extracted.
			</p>

			{error ? <p className='text-cinnabar-light text-xs'>{error}</p> : null}

			{isPatching ? (
				<div className='flex items-center gap-2'>
					<div className='h-4 w-4 animate-spin border-2 border-gold-muted border-t-gold' />
					<span className='text-text-faint text-xs'>
						{patchProgress?.step ?? 'Patching…'}
					</span>
				</div>
			) : (
				<Button
					className='bg-cinnabar font-bold text-gold uppercase tracking-wider hover:bg-cinnabar-light'
					onClick={patchAndDownload}
				>
					Download English Patch
				</Button>
			)}

			<div className='flex gap-4'>
				<button
					className='text-text-dim text-xs hover:text-gold'
					onClick={eject}
					type='button'
				>
					Eject ROM
				</button>
				<button
					className='text-text-dim text-xs hover:text-gold'
					onClick={clearAll}
					type='button'
				>
					Clear all
				</button>
			</div>
		</div>
	);
}

// ============================================================================
// Shared file picker
// ============================================================================

function FilePickerButton({
	onFileChange,
}: {
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	return (
		<label className='cursor-pointer'>
			<Button
				asChild={true}
				className='bg-cinnabar font-bold text-gold uppercase tracking-wider hover:bg-cinnabar-light'
			>
				<span>Select ROM File</span>
			</Button>
			<input
				accept='.nds'
				className='sr-only'
				onChange={onFileChange}
				type='file'
			/>
		</label>
	);
}

// ============================================================================
// Main component
// ============================================================================

export function CartridgeSlot() {
	const {status, loadRom} = useRom();
	const inputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) loadRom(file);
			// Reset input so the same file can be re-selected
			if (inputRef.current) inputRef.current.value = '';
		},
		[loadRom],
	);

	const isProcessing = status === 'loading' || status === 'extracting';

	return (
		<Popover>
			<PopoverTrigger
				className='ml-auto flex shrink-0 items-center gap-1.5 px-3 py-2 font-medium font-sans text-xs uppercase tracking-wide transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2'
				disabled={isProcessing}
			>
				<CartridgeIcon status={status} />
				<span className='hidden sm:inline'>{statusLabel(status)}</span>
			</PopoverTrigger>
			<PopoverContent align='end' className='w-72 bg-surface-high p-4'>
				<PopoverBody onFileChange={handleFileChange} status={status} />
			</PopoverContent>
		</Popover>
	);
}

function PopoverBody({
	status,
	onFileChange,
}: {
	status: RomStatus;
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
	switch (status) {
		case 'loading':
		case 'extracting':
			return <ExtractingContent />;
		case 'stale':
			return <StaleContent onFileChange={onFileChange} />;
		case 'cached':
			return <CachedContent onFileChange={onFileChange} />;
		case 'loaded':
			return <LoadedContent />;
		default:
			return <EmptyContent onFileChange={onFileChange} />;
	}
}
