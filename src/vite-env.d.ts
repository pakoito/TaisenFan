/// <reference types="vite/client" />

import type DetachedWindowApi from 'happy-dom/lib/window/DetachedWindowAPI.js';

declare global {
	var happyDOM: DetachedWindowApi | undefined;
	const __BUILD_TIMESTAMP__: string;
}
