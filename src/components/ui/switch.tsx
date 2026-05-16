import {Switch as SwitchPrimitive} from 'radix-ui';
import type * as React from 'react';
import {cn} from '@/lib/utils';

function Switch({
	className,
	...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
	return (
		<SwitchPrimitive.Root
			className={cn(
				'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center border border-border-dim bg-surface-highest transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-gold data-[state=checked]:bg-cinnabar',
				className,
			)}
			data-slot='switch'
			{...props}
		>
			<SwitchPrimitive.Thumb
				className='pointer-events-none block h-3 w-3 bg-text-faint shadow transition-transform data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-gold data-[state=unchecked]:translate-x-[2px]'
				data-slot='switch-thumb'
			/>
		</SwitchPrimitive.Root>
	);
}

export {Switch};
