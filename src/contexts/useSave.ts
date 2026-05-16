import {useContext} from 'react';
import {SaveContext, type SaveContextValue} from '@/contexts/save-types';

export function useSave(): SaveContextValue {
	const ctx = useContext(SaveContext);
	if (!ctx) {
		throw new Error('useSave must be used within a SaveProvider');
	}
	return ctx;
}
