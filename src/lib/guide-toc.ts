export type TocEntry = {
	readonly depth: 1 | 2 | 3;
	readonly text: string;
	readonly id: string;
};

const DEPTH_BY_TAG: Record<string, 1 | 2 | 3> = {H1: 1, H2: 2, H3: 3};

/**
 * Build a depth-1-to-3 table of contents from the rendered guide headings.
 *
 * rehype-slug stamps a GitHub-compatible `id` on every heading at build time
 * (see vite.config.ts), so reading the live DOM is the single source of truth:
 * every entry's `id` is, by construction, the exact anchor target on the page.
 *
 * Each heading also renders a leading `#` anchor link (MdxComponents); its
 * text is stripped so the TOC label shows only the heading itself.
 */
export function tocFromHeadings(root: ParentNode): readonly TocEntry[] {
	const headings = root.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id]');
	const entries: TocEntry[] = [];

	for (const h of headings) {
		const depth = DEPTH_BY_TAG[h.tagName];
		if (!depth) {
			continue;
		}
		const anchor = h.querySelector('a[href^="#"]');
		const anchorLen = anchor?.textContent?.length ?? 0;
		const text = (h.textContent ?? '').slice(anchorLen).trim();
		if (text) {
			entries.push({depth, text, id: h.id});
		}
	}

	return entries;
}
