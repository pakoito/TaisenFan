/**
 * Render the social preview HTML to a 1280×640 PNG using Playwright.
 *
 * Usage: node scripts/social-preview/render.ts
 *
 * Output: social-preview.png at the repo root, ready to upload via
 * GitHub repo Settings → Social preview.
 */

import {existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';

const HTML_PATH = path.resolve(
	import.meta.dirname,
	'index.html',
);
const OUT_PATH = path.resolve(import.meta.dirname, '../../social-preview.png');

const WIDTH = 1280;
const HEIGHT = 640;

if (!existsSync(HTML_PATH)) {
	console.error(`Source HTML not found at ${HTML_PATH}`);
	process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: {width: WIDTH, height: HEIGHT},
	deviceScaleFactor: 2,
});

await page.goto(pathToFileURL(HTML_PATH).href, {waitUntil: 'networkidle'});
// Give web fonts an extra beat to settle after networkidle fires
await page.waitForTimeout(500);

await page.screenshot({
	path: OUT_PATH,
	clip: {x: 0, y: 0, width: WIDTH, height: HEIGHT},
	type: 'png',
});

await browser.close();

console.log(`Wrote ${OUT_PATH}`);
