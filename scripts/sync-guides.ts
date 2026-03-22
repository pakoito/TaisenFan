/**
 * Copies guides/*.md from the monorepo root into src/content/guides/,
 * rewriting inter-guide links from `filename.md` to SPA route paths.
 *
 * Usage: node scripts/sync-guides.ts
 */

/* eslint-disable n/no-unsupported-features -- Node script, not browser code */

import fs from 'node:fs'
import path from 'node:path'

const GUIDES_SRC = path.resolve(import.meta.dirname, '../../guides')
const GUIDES_DEST = path.resolve(import.meta.dirname, '../src/content/guides')

/** Map filename (without .md) → SPA route slug */
const SLUG_MAP: Record<string, string> = {
	'beginners-guide': 'beginners',
	'campaign-guide': 'campaign',
	'campaign-merchants': 'campaign-merchants',
	'combat-mechanics': 'combat',
	'deck-archetypes': 'deck-archetypes',
	'deck-strategies': 'deck-strategies',
	'duel-guide': 'duel',
	'tactics-guide': 'tactics'
}

const LINK_PATTERN = /\[(?<text>[^\]]+)\]\((?<href>[^)]+\.md)\)/gu
const MD_SUFFIX = /\.md$/u

function rewriteLinks(content: string): string {
	return content.replace(LINK_PATTERN, (_match, text: string, href: string) => {
		const basename = href.replace(MD_SUFFIX, '')
		const slug = SLUG_MAP[basename]
		if (slug) {
			return `[${text}](/guides/${slug})`
		}
		return _match
	})
}

// Ensure dest dir exists
fs.mkdirSync(GUIDES_DEST, {recursive: true})

const files = fs.readdirSync(GUIDES_SRC).filter(f => f.endsWith('.md'))
let _count = 0

for (const file of files) {
	const src = path.join(GUIDES_SRC, file)
	const dest = path.join(GUIDES_DEST, file)
	const content = fs.readFileSync(src, 'utf-8')
	const rewritten = rewriteLinks(content)
	fs.writeFileSync(dest, rewritten, 'utf-8')
	_count += 1
}
