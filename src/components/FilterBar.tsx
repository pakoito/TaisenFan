import {useCallback} from 'react';
import {Input} from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

/* ======================================================================== */
/* SelectFilter                                                             */
/* ======================================================================== */

type SelectFilterProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: readonly {value: string; label: string}[];
};

export function SelectFilter({
	label,
	value,
	onChange,
	options,
}: SelectFilterProps) {
	const handleChange = useCallback(
		(v: string) => {
			onChange(v === '__all__' ? '' : v);
		},
		[onChange],
	);

	return (
		<div className='flex flex-col gap-0.5'>
			<span className='font-medium font-sans text-[10px] text-text-dim uppercase tracking-wider'>
				{label}
			</span>
			<Select onValueChange={handleChange} value={value || '__all__'}>
				<SelectTrigger className='h-8 w-auto min-w-24 border-0 border-border-dim border-b bg-transparent font-sans text-sm text-text'>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value='__all__'>All</SelectItem>
					{options.map(opt => (
						<SelectItem key={opt.value} value={opt.value}>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

/* ======================================================================== */
/* SearchFilter                                                             */
/* ======================================================================== */

type SearchFilterProps = {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
};

export function SearchFilter({
	value,
	onChange,
	placeholder = 'Search…',
}: SearchFilterProps) {
	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			onChange(e.target.value);
		},
		[onChange],
	);

	return (
		<div className='flex flex-col gap-0.5'>
			<span className='font-medium font-sans text-[10px] text-text-dim uppercase tracking-wider'>
				Search
			</span>
			<Input
				autoComplete='off'
				className='h-8 w-48 border-0 border-border-dim border-b bg-transparent px-1 font-sans text-sm text-text placeholder:text-text-dim focus-visible:border-gold'
				name='search'
				onChange={handleChange}
				placeholder={placeholder}
				spellCheck={false}
				type='text'
				value={value}
			/>
		</div>
	);
}
