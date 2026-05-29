import {describe, expect, it} from 'vitest';
import {tocFromHeadings} from '@/lib/guide-toc';

/** Build a detached container mirroring how MdxComponents renders headings. */
function render(html: string): HTMLElement {
	const root = document.createElement('article');
	root.innerHTML = html;
	return root;
}

describe('tocFromHeadings', () => {
	it('collects h1–h3 with depth, id, and anchor-stripped text', () => {
		const root = render(`
			<h1 id="intro"><a href="#intro">#</a>Intro</h1>
			<h2 id="setup"><a href="#setup">#</a>Setup</h2>
			<h3 id="place-names"><a href="#place-names">#</a>Place Names</h3>
		`);

		expect(tocFromHeadings(root)).toEqual([
			{depth: 1, text: 'Intro', id: 'intro'},
			{depth: 2, text: 'Setup', id: 'setup'},
			{depth: 3, text: 'Place Names', id: 'place-names'},
		]);
	});

	it('ignores h4+ and headings without an id', () => {
		const root = render(`
			<h2 id="kept">Kept</h2>
			<h4 id="too-deep"><a href="#too-deep">#</a>Too Deep</h4>
			<h3>No Id</h3>
		`);

		expect(tocFromHeadings(root)).toEqual([
			{depth: 2, text: 'Kept', id: 'kept'},
		]);
	});

	it('preserves document order across depths', () => {
		const root = render(`
			<h1 id="a">A</h1>
			<h3 id="a-1">A.1</h3>
			<h2 id="b">B</h2>
		`);

		expect(tocFromHeadings(root).map(e => e.id)).toEqual(['a', 'a-1', 'b']);
	});
});
