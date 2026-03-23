import {useEffect} from 'react';

interface Props {
	title: string;
}

export function PageHead({title}: Props) {
	useEffect(() => {
		document.title = `${title} — TaisenFan`;
	}, [title]);

	return null;
}
