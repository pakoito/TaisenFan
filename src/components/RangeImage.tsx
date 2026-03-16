interface Props {
	range: string
	sage?: boolean
	className?: string
}

export function RangeImage({range, sage = false, className = ''}: Props) {
	const src = sage ? `/ranges/sage/${range}.png` : `/ranges/${range}.png`
	const label = range.replaceAll('_', ' ')

	return (
		<img
			alt={`Range: ${label}`}
			className={`[image-rendering:pixelated] ${className}`}
			height={40}
			loading='lazy'
			src={src}
			title={label}
			width={40}
		/>
	)
}
