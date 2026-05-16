/**
 * Trigger a browser download of binary data.
 *
 * Accepts an ArrayBuffer or any ArrayBufferView (Uint8Array, etc.). Wraps it
 * in an octet-stream Blob, generates a temporary object URL, clicks a
 * synthetic anchor, then revokes the URL.
 */
export function downloadBinary(
	data: ArrayBuffer | ArrayBufferView,
	filename: string,
): void {
	const blob = new Blob([data as BlobPart], {
		type: 'application/octet-stream',
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
