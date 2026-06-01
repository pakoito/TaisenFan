import {expect, test} from '@playwright/test';

const SAVE_MAGIC = '3GOKUTEN';
const SAV_SIZE = 65_536;

const NEW_SAVE_LOADED = /^New save( ·|$)/u;

// Each Playwright test runs in its own browser context, so IndexedDB
// starts empty without any per-test cleanup. The save editor relies on
// IndexedDB writes; we serialize to avoid concurrent dev-server load.
test.describe.configure({mode: 'serial'});

test('renders empty state then shows tabs after New Save', async ({page}) => {
	await page.goto('./savegame-editor');

	await expect(
		page.getByRole('heading', {level: 1, name: 'Save Editor'}),
	).toBeVisible();
	const slot = page.getByRole('region', {name: 'Save slot'});
	await expect(slot.getByText('No save loaded')).toBeVisible();

	await page.getByRole('button', {name: 'New Save'}).click();

	await expect(slot.getByText('New save · unsaved')).toBeVisible();
	await expect(page.getByRole('tab', {name: 'Overview'})).toBeVisible();
	await expect(page.getByRole('tab', {name: 'Lords'})).toBeVisible();
	await expect(page.getByRole('tab', {name: 'Sages'})).toBeVisible();
});

test('starter preset opens all chapters and difficulties', async ({page}) => {
	await page.goto('./savegame-editor');
	await page.getByRole('button', {name: 'New Save'}).click();

	await expect(page.getByText('6 / 6')).toBeVisible();
	// Normal + Hard difficulties both read "Playable" right after a starter
	// preset (the per-difficulty UNLOCKED/playable tier, distinct from cleared).
	await expect(page.getByText('Playable', {exact: true}).first()).toBeVisible();
});

test('downloads a valid 64KB .sav', async ({page}) => {
	await page.goto('./savegame-editor');
	await page.getByRole('button', {name: 'New Save'}).click();

	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', {name: 'Download .sav'}).click();
	const download = await downloadPromise;

	const path = await download.path();
	expect(path).not.toBeNull();
	const fs = await import('node:fs/promises');
	const bytes = await fs.readFile(path as string);
	expect(bytes.byteLength).toBe(SAV_SIZE);
	expect(bytes.toString('ascii', 4, 4 + SAVE_MAGIC.length)).toBe(SAVE_MAGIC);
});

test('persists the loaded save across a full reload', async ({page}) => {
	await page.goto('./savegame-editor');
	const slot = page.getByRole('region', {name: 'Save slot'});
	await page.getByRole('button', {name: 'New Save'}).click();
	await expect(slot.getByText('New save · unsaved')).toBeVisible();

	// Wait for the debounced IndexedDB write to fire.
	await page.waitForTimeout(300);
	await page.reload();

	// After a reload the dirty flag clears (nothing local to lose anymore)
	// but the save itself is still loaded — the strip reads "New save".
	await expect(slot.getByText(NEW_SAVE_LOADED)).toBeVisible();
	await expect(slot.getByText('No save loaded')).toHaveCount(0);
});

test('Discard wipes the save and shows the empty state', async ({page}) => {
	await page.goto('./savegame-editor');
	const slot = page.getByRole('region', {name: 'Save slot'});
	await page.getByRole('button', {name: 'New Save'}).click();
	await expect(slot.getByText('New save · unsaved')).toBeVisible();

	await page.getByRole('button', {name: 'Discard'}).click();
	await expect(slot.getByText('No save loaded')).toBeVisible();
	await expect(page.getByRole('button', {name: 'New Save'})).toBeVisible();
});
