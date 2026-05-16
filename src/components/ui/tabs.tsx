import {Tabs as TabsPrimitive} from 'radix-ui';
import type * as React from 'react';
import {cn} from '@/lib/utils';

function Tabs({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			className={cn('flex flex-col gap-4', className)}
			data-slot='tabs'
			{...props}
		/>
	);
}

function TabsList({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			className={cn(
				'flex flex-wrap items-center gap-1 border-border-dim border-b text-xs',
				className,
			)}
			data-slot='tabs-list'
			{...props}
		/>
	);
}

function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			className={cn(
				'inline-flex items-center justify-center whitespace-nowrap border-b-2 border-transparent px-3 py-2 font-medium font-sans text-text-muted text-xs tracking-wider uppercase transition-colors duration-100 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-gold data-[state=active]:text-gold motion-reduce:transition-none',
				className,
			)}
			data-slot='tabs-trigger'
			{...props}
		/>
	);
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			className={cn('flex-1 outline-none', className)}
			data-slot='tabs-content'
			{...props}
		/>
	);
}

export {Tabs, TabsList, TabsTrigger, TabsContent};
