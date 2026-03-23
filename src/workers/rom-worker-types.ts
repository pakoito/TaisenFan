/**
 * Message protocol between the main thread and the ROM worker.
 *
 * Main → Worker: commands
 * Worker → Main: responses + progress updates
 */

// ============================================================================
// Main → Worker
// ============================================================================

export interface ExtractCommand {
	type: 'extract';
	rom: ArrayBuffer;
}

export interface PatchCommand {
	type: 'patch';
	/** Base URL for fetching patch.bps (import.meta.env.BASE_URL from main thread) */
	baseUrl: string;
}

export interface EjectCommand {
	type: 'eject';
}

export type WorkerCommand = ExtractCommand | PatchCommand | EjectCommand;

// ============================================================================
// Worker → Main
// ============================================================================

export interface ProgressMessage {
	type: 'progress';
	phase: 'parsing' | 'unpacking' | 'decoding';
	current: number;
	total: number;
}

export interface ExtractedImage {
	name: string;
	rgba: ArrayBuffer;
	width: number;
	height: number;
}

export interface ExtractDoneMessage {
	type: 'extract-done';
	images: ExtractedImage[];
}

export interface ExtractErrorMessage {
	type: 'extract-error';
	error: string;
}

export interface PatchProgressMessage {
	type: 'patch-progress';
	step: 'fetching' | 'verifying' | 'patching';
}

export interface PatchDoneMessage {
	type: 'patch-done';
	data: ArrayBuffer;
	filename: string;
}

export interface PatchErrorMessage {
	type: 'patch-error';
	error: string;
}

export type WorkerResponse =
	| ProgressMessage
	| ExtractDoneMessage
	| ExtractErrorMessage
	| PatchProgressMessage
	| PatchDoneMessage
	| PatchErrorMessage;
