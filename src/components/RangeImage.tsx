interface Props {
	range: string;
	sage?: boolean;
	className?: string;
}

export function RangeImage({range, sage = false, className = ''}: Props) {
	const base = import.meta.env.BASE_URL;
	const src = sage
		? `${base}ranges/sage/${range}.png`
		: `${base}ranges/${range}.png`;
	const label = range.replaceAll('_', ' ');

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
	);
}
