/**
 * Deep merge utility for patching SaveProfile objects.
 *
 * Rules:
 * - Objects: recursively merge (patch keys override base keys)
 * - Arrays: replace entirely (no element-level merge)
 * - Primitives: replace
 * - undefined in patch: skip (keep base value)
 */

import type {DeepPartial} from './types';

export function deepMerge<T>(base: T, patch: DeepPartial<T>): T {
	if (patch === undefined || patch === null) return base;
	if (base === undefined || base === null) return patch as T;

	// Arrays: replace entirely
	if (Array.isArray(patch)) return patch as T;
	if (Array.isArray(base)) return patch as T;

	// Objects: recurse
	if (typeof base === 'object' && typeof patch === 'object') {
		const result = {...base} as Record<string, unknown>;
		for (const key of Object.keys(patch as object)) {
			const patchVal = (patch as Record<string, unknown>)[key];
			if (patchVal === undefined) continue;

			if (key in result) {
				result[key] = deepMerge(result[key], patchVal);
			} else {
				result[key] = patchVal;
			}
		}
		return result as T;
	}

	// Primitives: replace
	return patch as T;
}
