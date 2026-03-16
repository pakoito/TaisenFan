import {useCallback, useRef, useState} from 'react'
import {applyPatch, downloadBlob, type PatchResult} from '@/utils/patcher'

type PatchState =
	| {step: 'idle'}
	| {step: 'reading'}
	| {step: 'patching'}
	| {step: 'done'; result: PatchResult}

export function Patcher() {
	const [state, setState] = useState<PatchState>({step: 'idle'})
	const inputRef = useRef<HTMLInputElement>(null)

	const handleFile = useCallback(async (file: File) => {
		setState({step: 'reading'})

		try {
			const romBuffer = await file.arrayBuffer()
			setState({step: 'patching'})

			const result = await applyPatch(romBuffer)
			setState({step: 'done', result})

			if (result.success && result.data && result.filename) {
				downloadBlob(result.data, result.filename)
			}
		} catch {
			setState({
				step: 'done',
				result: {success: false, error: 'Failed to read ROM file.'},
			})
		}
	}, [])

	const onFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (file) handleFile(file)
		},
		[handleFile]
	)

	const onDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			const file = e.dataTransfer.files[0]
			if (file) handleFile(file)
		},
		[handleFile]
	)

	const reset = useCallback(() => {
		setState({step: 'idle'})
		if (inputRef.current) inputRef.current.value = ''
	}, [])

	const isProcessing = state.step === 'reading' || state.step === 'patching'
	const isDone = state.step === 'done'
	const isSuccess = isDone && state.result.success
	const isError = isDone && !state.result.success

	return (
		<div>
			{/* Drop zone / file picker */}
			<div
				className={`relative flex flex-col items-center gap-3 rounded-lg border-2 border-dashed py-8 transition-colors ${
					isProcessing
						? 'cursor-wait border-gold-400 bg-gold-50/30 dark:bg-gold-500/5'
						: isSuccess
							? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5'
							: isError
								? 'border-crimson-400 bg-crimson-50/30 dark:bg-crimson-500/5'
								: 'cursor-pointer border-parchment-400 bg-parchment-50/50 hover:border-emerald-500 hover:bg-emerald-50/20 dark:border-ink-600 dark:bg-ink-800/50 dark:hover:border-emerald-600'
				}`}
				onDragOver={e => e.preventDefault()}
				onDrop={isProcessing ? undefined : onDrop}
			>
				{/* Idle */}
				{state.step === 'idle' && (
					<>
						<span className='text-3xl'>🎮</span>
						<p className='text-sm font-medium text-ink-500 dark:text-parchment-400'>
							Drop your ROM here or click to select
						</p>
						<p className='text-xs text-ink-400'>
							Expects the original Japanese .nds file
						</p>
						<label className='cursor-pointer rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700'>
							Select ROM File
							<input
								ref={inputRef}
								accept='.nds'
								className='hidden'
								onChange={onFileChange}
								type='file'
							/>
						</label>
					</>
				)}

				{/* Reading ROM */}
				{state.step === 'reading' && (
					<>
						<Spinner />
						<p className='text-sm font-medium text-gold-600'>
							Reading ROM…
						</p>
					</>
				)}

				{/* Patching */}
				{state.step === 'patching' && (
					<>
						<Spinner />
						<p className='text-sm font-medium text-gold-600'>
							Applying patch…
						</p>
						<p className='text-xs text-ink-400'>
							Downloading patch file &amp; patching in your browser
						</p>
					</>
				)}

				{/* Success */}
				{isSuccess && (
					<>
						<span className='text-3xl'>✅</span>
						<p className='text-sm font-bold text-emerald-600'>
							Patched successfully!
						</p>
						<p className='text-xs text-ink-400'>
							Your download should start automatically.
						</p>
						<div className='flex gap-2'>
							{state.result.data && state.result.filename && (
								<button
									className='rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700'
									onClick={() =>
										downloadBlob(
											state.result.data!,
											state.result.filename!
										)
									}
									type='button'
								>
									Download Again
								</button>
							)}
							<button
								className='rounded bg-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-300 dark:bg-ink-700 dark:text-parchment-300'
								onClick={reset}
								type='button'
							>
								Patch Another
							</button>
						</div>
					</>
				)}

				{/* Error */}
				{isError && (
					<>
						<span className='text-3xl'>❌</span>
						<p className='text-sm font-bold text-crimson-600'>
							Patching failed
						</p>
						<p className='max-w-sm text-center text-xs text-ink-500'>
							{state.result.error}
						</p>
						<button
							className='rounded bg-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-ink-300 dark:bg-ink-700 dark:text-parchment-300'
							onClick={reset}
							type='button'
						>
							Try Again
						</button>
					</>
				)}
			</div>
		</div>
	)
}

function Spinner() {
	return (
		<div className='h-8 w-8 animate-spin rounded-full border-4 border-gold-300 border-t-gold-600' />
	)
}
