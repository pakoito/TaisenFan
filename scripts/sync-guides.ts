/**
 * Copies guides/*.md from the monorepo root into src/content/guides/,
 * rewriting inter-guide links from `filename.md` to SPA route paths.
 *
 * In CI (standalone repo checkout) the monorepo guides/ folder won't exist.
 * In that case the script exits gracefully — the committed .md files in
 * src/content/guides/ are used as-is.
 *
 * Usage: node scripts/sync-guides.ts
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

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

// In CI the monorepo guides/ may not exist — skip gracefully
if (!fs.existsSync(GUIDES_SRC)) {
	const _existing = fs.existsSync(GUIDES_DEST)
		? fs.readdirSync(GUIDES_DEST).filter(f => f.endsWith('.md')).length
		: 0

	process.exit(0)
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
