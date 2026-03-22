# TaisenFan — Ship Plan

## M0 · Foundation Fixes

Get the existing SPA working correctly before adding features.

- [x] **404 catch-all route** — catch-all `<Route path="*">` renders a Three Kingdoms–themed 404 page (10 random historical quips)
- [x] **GitHub Pages SPA routing** — `ghPages404` Vite plugin copies `index.html` → `404.html` in dist
- [x] **Error boundaries on routes** — `react-error-boundary` wraps route content with styled fallback (災 + error detail + Try Again / Return to Chronicle)
- [ ] **Fix patcher ROM compatibility** — the BPS patcher fails on the ROM that's widely available; diagnose checksum mismatch and fix (may need to accept multiple source checksums, or re-generate patch.bps against the common dump)

## M1 · ROM Loader & Image Extraction

The killer feature: load the ROM once, extract images client-side, use them everywhere on the site. No copyrighted assets shipped — the user provides the ROM.

### Navigation bar overhaul

- [ ] **Top-left: text logo** — shows "大戦FAN" text (current behavior) until a ROM is loaded, then swaps to the game's title logo extracted from the ROM
- [ ] **Top-right: cartridge slot** — two states with custom graphics (placeholder slots until paco creates the art):
  - *Empty*: cartridge-not-inserted graphic, click opens ROM file picker
  - *Inserted*: cartridge-inserted graphic, shows ROM loaded indicator
- [ ] **ROM state persisted in context** — React context holding: ROM loaded (bool), extracted image blobs (Map), loading progress

### Image extraction pipeline (browser-side)

Port the working prototype from `experiments/nfp-web-extractor/index.html` into the SPA as a reusable module:

- [ ] **NDS ROM parser** — `src/utils/nds-parser.ts`: parse NitroFS (FNT + FAT) → file list
- [ ] **NFP unpacker** — `src/utils/nfp-unpack.ts`: deobfuscate + LZ10 decompress NFP archives
- [ ] **KPC decoder** — `src/utils/kpc-decode.ts`: decode KPC → ImageData (bustups, backgrounds)
- [ ] **ROM loader context** — `src/contexts/RomContext.tsx`: manages ROM state, triggers extraction on load, stores decoded images as blob URLs
- [ ] **Extraction targets** — at minimum: `kpcbustup.NFP` (character portraits), game title logo. Expand later to other NFP archives as needed.
- [ ] **Image integration points** — Lord Cards page shows bustup portraits next to each card (when ROM loaded), Sage Cards shows sage portraits, Home page shows game logo in header

### Custom art (paco)

- [ ] Create cartridge-not-inserted graphic (SVG or PNG)
- [ ] Create cartridge-inserted graphic (SVG or PNG)

## M2 · Guide Pages

Render the 8 existing markdown guides from `guides/` as SPA pages.

### Guides to integrate

| File | Page Title | Lines |
|------|-----------|-------|
| `beginners-guide.md` | Beginner's Guide | 475 |
| `campaign-guide.md` | Campaign Walkthrough | 967 |
| `campaign-merchants.md` | Campaign Merchants | 428 |
| `combat-mechanics.md` | Combat Mechanics | 583 |
| `deck-archetypes.md` | Deck Archetypes | 1021 |
| `deck-strategies.md` | Deck Strategies | 268 |
| `duel-guide.md` | DUEL Guide | 578 |
| `tactics-guide.md` | Tactics Guide | 367 |

### Tasks

- [x] **Markdown rendering** — `@mdx-js/rollup` compiles `.md` → React components at build time (zero runtime parser). `remark-gfm` for tables, `remark-frontmatter` for future metadata.
- [x] **Guide page component** — `src/pages/guides/GuidePage.tsx` with MDXProvider mapping elements to Digital Scribe styles (gold headings, chronicle-scroll blockquotes, shadcn Table for markdown tables)
- [x] **Guide routes** — `/guides` index + `/guides/:slug` for all 8 guides, lazy-loaded
- [x] **Guide index page** — `/guides` landing with all 8 guides listed. Home page "Guides" section now links to real guides.
- [x] **Navigation update** — "Guides" dropdown in nav bar enabled with all 8 links
- [x] **Inter-guide links** — `scripts/sync-guides.ts` rewrites `filename.md` → `/guides/slug` at sync time. Internal links rendered as react-router `<Link>`.
- [x] **Copy guide files** — `npm run guides:sync` copies `guides/*.md` → `src/content/guides/` with link rewriting. Runs automatically before `dev` and `build`.

## M3 · Save Editor

Port the standalone save editor (`save-tools/web/`) into the SPA with design system polish.

### Current state

- `save-tools/web/index.html` — 402-line standalone HTML page with inline `<script type="module">`
- `save-tools/web/save-profile-bundle.js` — 1481-line JS bundle (codec: encrypt/decrypt, profile extract/create/replace, presets)
- Features: load .sav/.dsv, create new, edit stats/mastery/tutorials/DUEL stages/campaign/cards/sages/achievements/titles, download modified save, JSON preview panel

### Tasks

- [ ] **Port bundle to TypeScript** — convert `save-profile-bundle.js` → `src/utils/save-profile.ts` with proper types (or import as-is and add a `.d.ts`)
- [ ] **Save editor page** — `src/pages/SaveEditor.tsx` with route `/save-editor`
- [ ] **Component decomposition** — break the monolithic render() into React components:
  - `StatsSection` — food, ranks, win/loss/draw
  - `MasterySection` — 7 mastery counters
  - `TutorialSection` — 4 tutorial checkboxes
  - `DuelSection` — Easy/Normal/Hard stage lists with bulk actions
  - `CampaignSection` — 6 chapters with tri-state buttons + Warring States
  - `CollectionSection` — card unlock + sage list with levels
  - `AchievementsSection` — titles, events, selected title
- [ ] **JSON panel** — collapsible side panel or toggle (keep the dev-friendly JSON view)
- [ ] **Styling pass** — apply Digital Scribe design system: obsidian surfaces, gold headings, cinnabar actions, 0px border radius, brushstroke separators
- [ ] **Navigation update** — add "Save Editor" to the nav bar
- [ ] **Drag-and-drop** — keep the global drop handler for .sav/.dsv files

## M4 · Polish & Testing

- [ ] **Unit tests** — add Vitest tests for core utilities: patcher (CRC32, BPS apply), NDS parser, NFP unpacker, KPC decoder, save profile codec
- [ ] **Component tests** — Testing Library tests for FilterBar, LordTable, SageCard, Patcher at minimum
- [ ] **E2E tests** — expand Playwright specs: navigate all routes, load data pages, test filter interactions, verify 404 route
- [ ] **Lighthouse audit** — check performance, accessibility, SEO; fix any issues
- [ ] **Final styling pass** — verify all pages follow DESIGN.md consistently
- [ ] **Clean up old pages** — confirm `gamedata-tools/*.html` are fully superseded; add note or remove
