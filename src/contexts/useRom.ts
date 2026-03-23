import {useContext} from 'react';
import {RomContext, type RomContextValue} from '@/contexts/rom-types';

export function useRom(): RomContextValue {
	const ctx = useContext(RomContext);
	if (!ctx) {
		throw new Error('useRom must be used within a RomProvider');
	}
	return ctx;
}
