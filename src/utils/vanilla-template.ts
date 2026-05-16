/**
 * Lazily fetch the bundled vanilla .sav template.
 *
 * A brand-new MelonDS save isn't just zeroed bytes — it has 25
 * pre-populated deck slots ("Preset" + a "Starter" deck), starter
 * Lord/Sage card unlocks in the profile, and 0xFF-padded history.
 * Creating saves from all-zero blocks (which earlier versions of the
 * editor did) produced files the game treated as corrupted.
 *
 * We ship a real fresh save under `public/data/vanilla.sav` and use
 * it as the base for every new save. The user's edits are then
 * written into the profile block via `replaceSave`.
 */

let cached: Uint8Array | null = null;
let inflight: Promise<Uint8Array> | null = null;

export async function loadVanillaTemplate(): Promise<Uint8Array> {
	if (cached) return cached;
	if (inflight) return inflight;
	inflight = (async () => {
		const url = `${import.meta.env.BASE_URL}data/vanilla.sav`;
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to load vanilla template: ${response.status}`);
		}
		const bytes = new Uint8Array(await response.arrayBuffer());
		cached = bytes;
		return bytes;
	})();
	try {
		return await inflight;
	} finally {
		inflight = null;
	}
}
