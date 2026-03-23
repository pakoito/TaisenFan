import {expect, test} from '@playwright/test';

// All paths are relative — Playwright resolves them against the baseURL
// (http://localhost:5173/TaisenFan/) so they stay within Vite's base path.

const HERO_HEADING = /三国志大戦/u;

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------

test('renders the home page', async ({page}) => {
	await page.goto('./');

	await expect(
		page.getByRole('heading', {level: 1, name: HERO_HEADING}),
	).toBeVisible();
	await expect(page.getByText('Load Your ROM')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 404 catch-all
// ---------------------------------------------------------------------------

test('unknown route shows 404 page', async ({page}) => {
	await page.goto('./this-scroll-does-not-exist');

	await expect(
		page.getByRole('heading', {level: 1, name: '404'}),
	).toBeVisible();

	// The "Return" link proves the full NotFound component rendered
	await expect(
		page.getByRole('link', {name: 'Return to the Chronicle'}),
	).toBeVisible();
});

test('deep unknown route under gamedata shows 404', async ({page}) => {
	await page.goto('./gamedata/nonexistent');

	await expect(
		page.getByRole('heading', {level: 1, name: '404'}),
	).toBeVisible();
});

test('404 "Return to the Chronicle" navigates home', async ({page}) => {
	await page.goto('./not-a-real-page');

	await page.getByRole('link', {name: 'Return to the Chronicle'}).click();

	await expect(
		page.getByRole('heading', {level: 1, name: HERO_HEADING}),
	).toBeVisible();
});

test('404 page still shows nav bar and footer', async ({page}) => {
	await page.goto('./nope');

	// Nav bar — Layout uses aria-label="Main navigation"
	await expect(
		page.getByRole('navigation', {name: 'Main navigation'}),
	).toBeVisible();

	// Footer
	await expect(page.getByText('TaisenFan — Fan site')).toBeVisible();
});
