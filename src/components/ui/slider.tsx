import {Slider as SliderPrimitive} from 'radix-ui';
import type * as React from 'react';
import {cn} from '@/lib/utils';

function Slider({
	className,
	...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
	return (
		<SliderPrimitive.Root
			className={cn(
				'relative flex w-full touch-none select-none items-center',
				className,
			)}
			data-slot='slider'
			{...props}
		>
			<SliderPrimitive.Track
				className='relative h-1 grow overflow-hidden bg-surface-highest'
				data-slot='slider-track'
			>
				<SliderPrimitive.Range
					className='absolute h-full bg-gold-dim'
					data-slot='slider-range'
				/>
			</SliderPrimitive.Track>
			<SliderPrimitive.Thumb
				aria-label='Value'
				className='block h-3 w-3 border border-gold bg-surface-dim outline-none transition-colors hover:bg-gold focus-visible:ring-1 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-50'
				data-slot='slider-thumb'
			/>
		</SliderPrimitive.Root>
	);
}

export {Slider};
