import {createContext} from 'react';
import type {PresetName, SaveProfile} from '@/save-tools';

export type SaveStatus = 'empty' | 'new' | 'uploaded';
export type SaveFormat = 'sav' | 'dsv';

export type SaveContextValue = {
	status: SaveStatus;
	filename: string | null;
	profile: SaveProfile | null;
	isDirty: boolean;
	error: string | null;
	/** Build a fresh save from the bundled vanilla template + starter preset */
	newStarter: () => Promise<void>;
	/** Reset the entire save to the chosen preset, rebuilt from the template */
	applyPresetReset: (preset: PresetName) => Promise<void>;
	/** Load a .sav or .dsv file from disk */
	loadFile: (file: File) => Promise<void>;
	/** Mutate the current profile via a recipe function */
	mutate: (recipe: (draft: SaveProfile) => void) => void;
	/** Build and download the current state in the chosen format */
	download: (format: SaveFormat) => Promise<void>;
	/** Forget the current save (discard / eject) */
	clear: () => Promise<void>;
};

export const SaveContext = createContext<SaveContextValue | null>(null);
