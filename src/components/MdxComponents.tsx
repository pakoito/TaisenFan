import type {MDXComponents} from 'mdx/types';
import {Link} from 'react-router';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';

/**
 * Maps standard HTML elements produced by MDX to our Digital Scribe
 * design system. Passed to MDXProvider so all guide pages render
 * consistently.
 */
export const mdxComponents: MDXComponents = {
	// Headings — gold leaf, inscription style
	h1: props => (
		<h1
			className='mt-10 mb-6 font-black font-serif text-3xl text-gold tracking-tight first:mt-0'
			{...props}
		/>
	),
	h2: props => (
		<h2
			className='mt-8 mb-4 font-bold font-serif text-gold-dim text-xl tracking-wide'
			{...props}
		/>
	),
	h3: props => (
		<h3
			className='mt-6 mb-3 font-bold font-serif text-text-muted tracking-wide'
			{...props}
		/>
	),
	h4: props => (
		<h4
			className='mt-4 mb-2 font-bold font-sans text-sm text-text-muted uppercase tracking-wider'
			{...props}
		/>
	),

	// Body text
	p: props => (
		<p className='mb-4 text-sm text-text leading-relaxed' {...props} />
	),

	// Links — rewrite internal .md links to SPA routes
	a: ({href, ...props}) => {
		if (href?.startsWith('/')) {
			return (
				<Link
					className='text-gold-dim underline underline-offset-2 transition-colors hover:text-gold'
					to={href}
					{...props}
				/>
			);
		}
		return (
			<a
				className='text-gold-dim underline underline-offset-2 transition-colors hover:text-gold'
				href={href}
				rel='noopener noreferrer'
				target='_blank'
				{...props}
			/>
		);
	},

	// Lists
	ul: props => (
		<ul
			className='mb-4 list-disc space-y-1 pl-6 text-sm text-text'
			{...props}
		/>
	),
	ol: props => (
		<ol
			className='mb-4 list-decimal space-y-1 pl-6 text-sm text-text'
			{...props}
		/>
	),
	li: props => <li className='leading-relaxed' {...props} />,

	// Blockquotes — chronicle scroll style
	blockquote: props => (
		<blockquote
			className='chronicle-scroll mb-4 bg-surface-low p-4 text-sm text-text-muted italic'
			{...props}
		/>
	),

	// Code — surface-mid for inline, transparent when inside pre
	code: ({className, ...props}) => (
		<code
			className={`font-mono text-text-muted text-xs ${
				className?.includes('language-') || props['data-language']
					? ''
					: 'bg-surface-mid px-1.5 py-0.5'
			} ${className ?? ''}`}
			{...props}
		/>
	),
	pre: ({children, ...props}) => (
		<pre
			className='mb-4 overflow-x-auto bg-surface-high p-4 font-mono text-text-muted text-xs leading-relaxed [&_code]:bg-transparent [&_code]:p-0'
			{...props}
		>
			{children}
		</pre>
	),

	// Horizontal rule — brushstroke separator
	hr: () => <div className='brushstroke-sep my-8' />,

	// Strong / emphasis
	strong: props => <strong className='font-bold text-text' {...props} />,
	em: props => <em className='text-text-muted' {...props} />,

	// Tables — shadcn Table with Digital Scribe surface hierarchy
	table: props => <Table className='mb-4 text-sm' {...props} />,
	thead: props => <TableHeader {...props} />,
	tbody: props => <TableBody {...props} />,
	tr: props => <TableRow {...props} />,
	th: props => (
		<TableHead className='bg-surface-highest text-text-faint' {...props} />
	),
	td: props => <TableCell className='text-text-muted' {...props} />,
};
