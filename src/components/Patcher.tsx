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
			className={`relative flex flex-col items-center gap-3 rounded-lg border-2 border-dashed py-8 transition-colors ${zoneClass(step)}`}
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
					subtitle='Downloading patch file & patching in your browser'
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
			return 'cursor-wait border-gold-400 bg-gold-50/30 dark:bg-gold-500/5'
		case 'success':
			return 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5'
		case 'error':
			return 'border-crimson-400 bg-crimson-50/30 dark:bg-crimson-500/5'
		default:
			return 'cursor-pointer border-parchment-400 bg-parchment-50/50 hover:border-emerald-500 hover:bg-emerald-50/20 dark:border-ink-600 dark:bg-ink-800/50 dark:hover:border-emerald-600'
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
			<span className='text-3xl'>🎮</span>
			<p className='font-medium text-ink-500 text-sm dark:text-parchment-400'>
				Drop your ROM here or click to select
			</p>
			<p className='text-ink-400 text-xs'>
				Expects the original Japanese .nds file
			</p>
			<label className='cursor-pointer rounded bg-emerald-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-emerald-700'>
				Select ROM File
				<input
					accept='.nds'
					className='hidden'
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
			<div className='h-8 w-8 animate-spin rounded-full border-4 border-gold-300 border-t-gold-600' />
			<p className='font-medium text-gold-600 text-sm'>{message}</p>
			{subtitle ? <p className='text-ink-400 text-xs'>{subtitle}</p> : null}
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
			<span className='text-3xl'>✅</span>
			<p className='font-bold text-emerald-600 text-sm'>
				Patched successfully!
			</p>
			<p className='text-ink-400 text-xs'>
				Your download should start automatically.
			</p>
			<div className='flex gap-2'>
				<button
					className='rounded bg-emerald-600 px-3 py-1.5 font-medium text-sm text-white transition-colors hover:bg-emerald-700'
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

function ErrorState({error, onReset}: {error?: string; onReset: () => void}) {
	return (
		<>
			<span className='text-3xl'>❌</span>
			<p className='font-bold text-crimson-600 text-sm'>Patching failed</p>
			{error ? (
				<p className='max-w-sm text-center text-ink-500 text-xs'>{error}</p>
			) : null}
			<ResetButton onClick={onReset} />
		</>
	)
}

function ResetButton({onClick}: {onClick: () => void}) {
	return (
		<button
			className='rounded bg-ink-200 px-3 py-1.5 font-medium text-ink-600 text-sm transition-colors hover:bg-ink-300 dark:bg-ink-700 dark:text-parchment-300'
			onClick={onClick}
			type='button'
		>
			Try Again
		</button>
	)
}
