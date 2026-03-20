import {useCallback, useRef, useState} from 'react'
import {applyPatch, downloadBlob, type PatchResult} from '@/utils/patcher'

type PatchStep = 'idle' | 'reading' | 'patching' | 'success' | 'error'

function noop() {
	/* intentionally empty */
}

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: patcher state machine requires unified handler
export function Patcher() {
	const [step, setStep] = useState<PatchStep>('idle')
	const [result, setResult] = useState<PatchResult | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const handleFile = useCallback(async (file: File) => {
		setStep('reading')
		try {
			const romBuffer = await file.arrayBuffer()
			setStep('patching')
			const patchResult = await applyPatch(romBuffer)
			setResult(patchResult)
			setStep(patchResult.success ? 'success' : 'error')
			if (patchResult.success && patchResult.data && patchResult.filename) {
				downloadBlob(patchResult.data, patchResult.filename)
			}
		} catch {
			setResult({success: false, error: 'Failed to read ROM file.'})
			setStep('error')
		}
	}, [])

	const onFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const [file] = e.target.files ?? []
			if (file) handleFile(file).catch(noop)
		},
		[handleFile]
	)

	const onDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			const [file] = e.dataTransfer.files
			if (file) handleFile(file).catch(noop)
		},
		[handleFile]
	)

	const onDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault()
	}, [])

	const reset = useCallback(() => {
		setStep('idle')
		setResult(null)
		if (inputRef.current) inputRef.current.value = ''
	}, [])

	const redownload = useCallback(() => {
		if (result?.data && result.filename) {
			downloadBlob(result.data, result.filename)
		}
	}, [result])

	const isProcessing = step === 'reading' || step === 'patching'

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: drop zone requires drag handlers
		// biome-ignore lint/a11y/noNoninteractiveElementInteractions: drop zone requires drag handlers
		<div
			aria-live='polite'
			className={`relative flex flex-col items-center gap-4 border-2 border-dashed py-10 transition-colors motion-reduce:transition-none ${zoneClass(step)}`}
			onDragOver={isProcessing ? undefined : onDragOver}
			onDrop={isProcessing ? undefined : onDrop}
		>
			{step === 'idle' ? (
				<IdleState inputRef={inputRef} onFileChange={onFileChange} />
			) : null}
			{step === 'reading' ? <ProcessingState message='Reading ROM…' /> : null}
			{step === 'patching' ? (
				<ProcessingState
					message='Applying patch…'
					subtitle='Downloading patch file &amp; patching in your browser'
				/>
			) : null}
			{step === 'success' ? (
				<SuccessState onRedownload={redownload} onReset={reset} />
			) : null}
			{step === 'error' ? (
				<ErrorState error={result?.error ?? 'Unknown error'} onReset={reset} />
			) : null}
		</div>
	)
}

function zoneClass(step: PatchStep): string {
	// biome-ignore lint/nursery/noUnnecessaryConditions: switch on union type is idiomatic
	switch (step) {
		case 'reading':
		case 'patching':
			return 'cursor-wait border-gold-dim bg-gold/5'
		case 'success':
			return 'border-shu bg-shu/5'
		case 'error':
			return 'border-cinnabar bg-cinnabar/5'
		default:
			return 'cursor-pointer border-border-dim bg-surface-mid hover:border-gold-muted hover:bg-surface-high'
	}
}

function IdleState({
	inputRef,
	onFileChange
}: {
	inputRef: React.RefObject<HTMLInputElement | null>
	onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
	return (
		<>
			<span aria-hidden='true' className='text-3xl'>
				🎮
			</span>
			<p className='font-medium text-sm text-text-muted'>
				Drop your ROM here or click to select
			</p>
			<p className='text-text-dim text-xs'>
				Expects the original Japanese .nds file
			</p>
			{/* Imperial Seal — cinnabar action button */}
			<label className='cursor-pointer bg-cinnabar px-6 py-2.5 font-bold font-sans text-gold text-sm uppercase tracking-wider transition-colors focus-within:outline-2 focus-within:outline-gold focus-within:outline-offset-2 hover:bg-cinnabar-light motion-reduce:transition-none'>
				Select ROM File
				<input
					accept='.nds'
					className='sr-only'
					name='rom-file'
					onChange={onFileChange}
					ref={inputRef}
					type='file'
				/>
			</label>
		</>
	)
}

function ProcessingState({
	message,
	subtitle
}: {
	message: string
	subtitle?: string
}) {
	return (
		<>
			<output className='block h-8 w-8 animate-spin border-4 border-gold-muted border-t-gold motion-reduce:animate-none motion-reduce:border-gold'>
				<span className='sr-only'>Processing…</span>
			</output>
			<p className='font-bold font-serif text-gold text-sm'>{message}</p>
			{subtitle ? <p className='text-text-dim text-xs'>{subtitle}</p> : null}
		</>
	)
}

function SuccessState({
	onRedownload,
	onReset
}: {
	onRedownload: () => void
	onReset: () => void
}) {
	return (
		<>
			<span aria-hidden='true' className='text-3xl'>
				✅
			</span>
			<p className='font-bold font-serif text-shu text-sm'>
				Patched successfully!
			</p>
			<p className='text-text-dim text-xs'>
				Your download should start automatically.
			</p>
			<div className='flex gap-3'>
				<button
					className='bg-cinnabar px-5 py-2 font-bold font-sans text-gold text-sm uppercase tracking-wider transition-colors hover:bg-cinnabar-light focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 motion-reduce:transition-none'
					onClick={onRedownload}
					type='button'
				>
					Download Again
				</button>
				<ResetButton onClick={onReset} />
			</div>
		</>
	)
}

function ErrorState({error, onReset}: {error: string; onReset: () => void}) {
	return (
		<>
			<span aria-hidden='true' className='text-3xl'>
				❌
			</span>
			<p className='font-bold font-serif text-cinnabar-light text-sm'>
				Patching failed
			</p>
			<p className='max-w-sm text-center text-text-faint text-xs'>{error}</p>
			<ResetButton onClick={onReset} />
		</>
	)
}

function ResetButton({onClick}: {onClick: () => void}) {
	return (
		<button
			className='border border-border bg-transparent px-5 py-2 font-medium font-sans text-sm text-text-muted uppercase tracking-wider transition-colors hover:bg-surface-highest hover:text-gold focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 motion-reduce:transition-none'
			onClick={onClick}
			type='button'
		>
			Try Again
		</button>
	)
}
