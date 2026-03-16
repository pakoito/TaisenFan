import {useCallback} from 'react'

interface SelectFilterProps {
	label: string
	value: string
	onChange: (value: string) => void
	options: readonly {value: string; label: string}[]
}

export function SelectFilter({
	label,
	value,
	onChange,
	options
}: SelectFilterProps) {
	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLSelectElement>) => {
			onChange(e.target.value)
		},
		[onChange]
	)

	return (
		<label className='flex items-center gap-2 text-sm'>
			<span className='font-medium text-ink-600 dark:text-parchment-400'>
				{label}
			</span>
			<select
				className='rounded border border-parchment-300 bg-white px-2 py-1.5 text-ink-800 text-sm dark:border-ink-600 dark:bg-ink-800 dark:text-parchment-100'
				onChange={handleChange}
				value={value}
			>
				<option value=''>All</option>
				{options.map(opt => (
					<option key={opt.value} value={opt.value}>
						{opt.label}
					</option>
				))}
			</select>
		</label>
	)
}

interface SearchFilterProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
}

export function SearchFilter({
	value,
	onChange,
	placeholder = 'Search…'
}: SearchFilterProps) {
	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			onChange(e.target.value)
		},
		[onChange]
	)

	return (
		<label className='flex items-center gap-2 text-sm'>
			<span className='font-medium text-ink-600 dark:text-parchment-400'>
				Search
			</span>
			<input
				className='rounded border border-parchment-300 bg-white px-2 py-1.5 text-ink-800 text-sm dark:border-ink-600 dark:bg-ink-800 dark:text-parchment-100'
				onChange={handleChange}
				placeholder={placeholder}
				spellCheck={false}
				type='text'
				value={value}
			/>
		</label>
	)
}
