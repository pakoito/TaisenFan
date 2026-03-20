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

	const fieldName = label.toLowerCase().replaceAll(' ', '-')

	return (
		<label className='flex items-center gap-2 font-sans text-sm'>
			<span className='font-medium text-text-faint text-xs uppercase tracking-wider'>
				{label}
			</span>
			<select
				autoComplete='off'
				className='border-0 border-border-dim border-b bg-transparent px-1 py-1.5 text-text focus-visible:border-gold focus-visible:outline-none'
				name={fieldName}
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
		<label className='flex items-center gap-2 font-sans text-sm'>
			<span className='font-medium text-text-faint text-xs uppercase tracking-wider'>
				Search
			</span>
			<input
				autoComplete='off'
				className='border-0 border-border-dim border-b bg-transparent px-1 py-1.5 text-text placeholder:text-text-dim focus-visible:border-gold focus-visible:outline-none'
				name='search'
				onChange={handleChange}
				placeholder={placeholder}
				spellCheck={false}
				type='text'
				value={value}
			/>
		</label>
	)
}
