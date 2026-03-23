import {CACHE_VERSION} from '@/utils/image-cache';

/**
 * image-cache.ts relies on IndexedDB and OffscreenCanvas which aren't
 * available in happy-dom. These tests verify the module's constants and
 * types are correctly exported. Full integration tests would need a
 * browser environment (Playwright).
 */

describe('image-cache constants', () => {
	it('exports a positive CACHE_VERSION', () => {
		expect(CACHE_VERSION).toBeGreaterThan(0);
		expect(Number.isInteger(CACHE_VERSION)).toBe(true);
	});
});
