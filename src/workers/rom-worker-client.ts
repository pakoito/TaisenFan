/**
 * Typed wrapper around the ROM Web Worker.
 *
 * Provides a callback-based API so the React context can subscribe to
 * progress updates and results without managing raw postMessage.
 */

import type {WorkerCommand, WorkerResponse} from '@/workers/rom-worker-types';

export type RomWorkerCallbacks = {
	onProgress?: (
		phase: 'parsing' | 'unpacking' | 'decoding',
		current: number,
		total: number,
	) => void;
	onExtracted?: (images: {name: string; png: ArrayBuffer}[]) => void;
	onExtractError?: (error: string) => void;
	onPatchProgress?: (step: 'fetching' | 'verifying' | 'patching') => void;
	onPatched?: (data: ArrayBuffer, filename: string) => void;
	onPatchError?: (error: string) => void;
};

export class RomWorkerClient {
	private readonly worker: Worker;
	private callbacks: RomWorkerCallbacks = {};

	constructor() {
		this.worker = new Worker(new URL('./rom-worker.ts', import.meta.url), {
			type: 'module',
		});
		this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
			this.handleMessage(e.data);
		};
	}

	/** Set callbacks for worker responses. Can be updated at any time. */
	setCallbacks(cb: RomWorkerCallbacks): void {
		this.callbacks = cb;
	}

	/** Send ROM to worker for image extraction. Transfers the ArrayBuffer. */
	extract(rom: ArrayBuffer): void {
		const cmd: WorkerCommand = {type: 'extract', rom};
		this.worker.postMessage(cmd, {transfer: [rom]});
	}

	/** Request the worker to apply the BPS patch to the loaded ROM. */
	patch(baseUrl: string): void {
		const cmd: WorkerCommand = {type: 'patch', baseUrl};
		this.worker.postMessage(cmd);
	}

	/** Tell the worker to release the ROM from memory. */
	eject(): void {
		const cmd: WorkerCommand = {type: 'eject'};
		this.worker.postMessage(cmd);
	}

	/** Terminate the worker entirely. */
	dispose(): void {
		this.worker.terminate();
	}

	private handleMessage(msg: WorkerResponse): void {
		switch (msg.type) {
			case 'progress':
				this.callbacks.onProgress?.(msg.phase, msg.current, msg.total);
				break;
			case 'extract-done':
				this.callbacks.onExtracted?.(
					msg.images.map(img => ({
						name: img.name,
						png: img.png,
					})),
				);
				break;
			case 'extract-error':
				this.callbacks.onExtractError?.(msg.error);
				break;
			case 'patch-progress':
				this.callbacks.onPatchProgress?.(msg.step);
				break;
			case 'patch-done':
				this.callbacks.onPatched?.(msg.data, msg.filename);
				break;
			case 'patch-error':
				this.callbacks.onPatchError?.(msg.error);
				break;
			default:
				break;
		}
	}
}
