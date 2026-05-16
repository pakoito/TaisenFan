import {createContext} from 'react';
import type {SaveProfile} from '@/save-tools';

export type SaveStatus = 'empty' | 'new' | 'uploaded';
export type SaveFormat = 'sav' | 'dsv';

export type SaveContextValue = {
	status: SaveStatus;
	filename: string | null;
	profile: SaveProfile | null;
	isDirty: boolean;
	error: string | null;
	/** Replace the profile with a starter preset (no file backing) */
	newStarter: () => void;
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
