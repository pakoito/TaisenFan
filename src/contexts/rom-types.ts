/**
 * Types for the ROM context state machine.
 */

import {createContext} from 'react';

export type RomStatus =
	| 'empty'
	| 'stale'
	| 'cached'
	| 'loading'
	| 'extracting'
	| 'loaded';

export type RomProgress = {
	phase: 'parsing' | 'unpacking' | 'decoding';
	current: number;
	total: number;
};

export type PatchProgress = {
	step: 'fetching' | 'verifying' | 'patching';
};

export type RomContextValue = {
	/** Current state of the ROM loader */
	status: RomStatus;
	/** Extraction progress (only meaningful during 'extracting') */
	progress: RomProgress | null;
	/** Patch progress (only meaningful during patching) */
	patchProgress: PatchProgress | null;
	/** Whether patching is in progress */
	isPatching: boolean;
	/** Decoded images as blob URLs, keyed by KPC filename */
	images: Map<string, string>;
	/** Whether images are available (cached, stale, or loaded) */
	hasImages: boolean;
	/** Load a ROM file — triggers extraction and caching */
	loadRom: (file: File) => void;
	/** Apply BPS patch to the loaded ROM and trigger download */
	patchAndDownload: () => void;
	/** Clear ROM from worker memory (images stay cached) */
	eject: () => void;
	/** Clear everything — worker memory + IndexedDB cache */
	clearAll: () => void;
	/** Last error message, if any */
	error: string | null;
};

export const RomContext = createContext<RomContextValue | null>(null);
