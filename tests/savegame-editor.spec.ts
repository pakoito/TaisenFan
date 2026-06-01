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

// A pre-field-map profile: it has `stats.food` but is missing the fields the
// current codec requires (`troopColors`, `currencyGold`, `regionCode`). Kept
// intentionally minimal — only enough to mimic what an older deploy persisted.
const OLD_FORMAT_PROFILE = {
	playerName: 'OldUser',
	stats: {
		offline: {wins: 1, losses: 0, draws: 0},
		online: {wins: 0, losses: 0, draws: 0},
		offlineRank: 0,
		onlineRank: 0,
		food: 100,
		mastery: {cavalry: 0, spear: 0, bow: 0, defeat: 0, siege: 0, defense: 0},
	},
	training: {
		normalUnlocked: true,
		hardUnlocked: false,
		tutorials: {
			tutorial1: true,
			tutorial2: false,
			tutorial3: false,
			tutorial4: false,
		},
		stages: {'Easy-01': {completed: true, highScore: 12_345}},
	},
	campaign: {chapters: {}, chapter3Variants: {}},
	cards: {cards: {}},
	sages: {sages: {}},
	achievements: {titlesUnlocked: 'none', campaignEventsUnlocked: 'none'},
	decks: [],
};

/** Seed the editor's IndexedDB cache with an arbitrary profile record. */
async function seedCachedProfile(
	page: import('@playwright/test').Page,
	profile: unknown,
): Promise<void> {
	await page.evaluate(async profileArg => {
		const record = {
			status: 'uploaded',
			filename: 'old.sav',
			rawSav: null,
			profile: profileArg,
		};
		await new Promise<void>((resolve, reject) => {
			const req = indexedDB.open('taisen-fan-save', 1);
			req.onupgradeneeded = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains('state')) {
					db.createObjectStore('state');
				}
			};
			req.onsuccess = () => {
				const db = req.result;
				const tx = db.transaction('state', 'readwrite');
				tx.objectStore('state').put(record, 'current');
				tx.oncomplete = () => {
					db.close();
					resolve();
				};
				tx.onerror = () => reject(tx.error);
			};
			req.onerror = () => reject(req.error);
		});
	}, profile);
}

// Regression: a returning user whose IndexedDB holds a profile written by an
// OLDER deploy must NOT crash the editor. The old code rehydrated the stale
// profile verbatim and `Object.values(profile.troopColors)` threw
// "Cannot convert undefined or null to object", tripping the error boundary
// ("Something went wrong"). We now drop incompatible cached state on load and
// fall back to the empty state instead of migrating it.
test('discards an incompatible old-format cached save without crashing', async ({
	page,
}) => {
	// Visit once so the page's origin owns the IndexedDB we seed.
	await page.goto('./savegame-editor');
	await seedCachedProfile(page, OLD_FORMAT_PROFILE);

	// Reload: hydration must discard the stale record and recover gracefully.
	await page.reload();

	const slot = page.getByRole('region', {name: 'Save slot'});
	await expect(slot.getByText('No save loaded')).toBeVisible();
	await expect(page.getByRole('button', {name: 'New Save'})).toBeVisible();
	// The error boundary must NOT have fired.
	await expect(page.getByText('Something went wrong')).toHaveCount(0);
});
