/**
 * Message protocol between the main thread and the ROM worker.
 *
 * Main → Worker: commands
 * Worker → Main: responses + progress updates
 */

// ============================================================================
// Main → Worker
// ============================================================================

export type ExtractCommand = {
	type: 'extract';
	rom: ArrayBuffer;
};

export type PatchCommand = {
	type: 'patch';
	/** Base URL for fetching patch.bps (import.meta.env.BASE_URL from main thread) */
	baseUrl: string;
};

export type EjectCommand = {
	type: 'eject';
};

export type WorkerCommand = ExtractCommand | PatchCommand | EjectCommand;

// ============================================================================
// Worker → Main
// ============================================================================

export type ProgressMessage = {
	type: 'progress';
	phase: 'parsing' | 'unpacking' | 'decoding';
	current: number;
	total: number;
};

export type ExtractedImage = {
	name: string;
	rgba: ArrayBuffer;
	width: number;
	height: number;
};

export type ExtractDoneMessage = {
	type: 'extract-done';
	images: ExtractedImage[];
};

export type ExtractErrorMessage = {
	type: 'extract-error';
	error: string;
};

export type PatchProgressMessage = {
	type: 'patch-progress';
	step: 'fetching' | 'verifying' | 'patching';
};

export type PatchDoneMessage = {
	type: 'patch-done';
	data: ArrayBuffer;
	filename: string;
};

export type PatchErrorMessage = {
	type: 'patch-error';
	error: string;
};

export type WorkerResponse =
	| ProgressMessage
	| ExtractDoneMessage
	| ExtractErrorMessage
	| PatchProgressMessage
	| PatchDoneMessage
	| PatchErrorMessage;
