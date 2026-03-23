# TaisenFan — Ship Plan

## M0 · Foundation Fixes ✅

- [x] **404 catch-all route** — Three Kingdoms–themed 404 page (10 random quips)
- [x] **GitHub Pages SPA routing** — `ghPages404` Vite plugin copies `index.html` → `404.html`
- [x] **Error boundaries on routes** — `react-error-boundary` with styled fallback
- [x] **Patcher ROM compatibility** — confirmed CRC32 `0x138b9883` matches the common dump

## M1 · ROM Loader & Image Extraction

### Done ✅

- [x] **NDS ROM parser** — `src/utils/nds-parser.ts`: parse NitroFS (FNT + FAT) → file list
- [x] **NFP unpacker** — `src/utils/nfp-unpack.ts`: deobfuscate + LZ10 decompress
- [x] **KPC decoder** — `src/utils/kpc-decode.ts`: decode KPC → RGBA with auto-crop
- [x] **IndexedDB cache** — `src/utils/image-cache.ts`: versioned persistence (CACHE_VERSION), supports empty/stale/cached/loaded states
- [x] **Web Worker** — `src/workers/rom-worker.ts`: extract + patch commands off main thread. BPS logic in `src/workers/bps-patch.ts`
- [x] **Worker client** — `src/workers/rom-worker-client.ts`: typed callback wrapper
- [x] **RomContext** — `src/contexts/RomContext.tsx`: 6-state machine (empty/stale/cached/loading/extracting/loaded), `useRom()` hook
- [x] **CartridgeSlot** — `src/components/CartridgeSlot.tsx`: popover in nav bar with placeholder SVG icons, file picker, progress, patch download
- [x] **Old Patcher removed** — `Patcher.tsx` and `patcher.ts` deleted (replaced by CartridgeSlot + worker)
- [x] **Vitest tests** — 22 tests for nds-parser, nfp-unpack, kpc-decode, image-cache

### Remaining

- [ ] **Image integration** — Lord Cards show bustup portraits when ROM loaded, Sage Cards show sage portraits, Home page swaps logo. *Blocked: needs layout decision + custom art.*
- [ ] **Custom cartridge art** — replace placeholder SVGs with paco's graphics. *Blocked: on paco.*
- [ ] **Logo swap** — nav bar text logo → extracted game logo when ROM loaded. *Blocked: needs extraction target added (title screen KPC).*

## M2 · Guide Pages ✅

- [x] **MDX build-time compilation** — `@mdx-js/rollup` + `remark-gfm`, zero runtime parser
- [x] **Guide sync script** — `scripts/sync-guides.ts` copies 8 guides from monorepo, rewrites inter-guide links
- [x] **MDX component overrides** — `MdxComponents.tsx` maps to Digital Scribe design system
- [x] **Guide routes** — `/guides` index + `/guides/:slug`, lazy-loaded chunks
- [x] **Navigation** — Guides dropdown enabled in nav bar
- [x] **Home page** — guide section links to real guides

## M3 · Save Editor

Port the standalone save editor (`save-tools/web/`) into the SPA.

### Current state

- `save-tools/web/index.html` — 402-line standalone HTML page
- `save-tools/web/save-profile-bundle.js` — 1481-line JS bundle (codec: encrypt/decrypt, profile extract/create/replace, presets)

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
- [ ] **JSON panel** — collapsible side panel or toggle
- [ ] **Styling** — Digital Scribe design system
- [ ] **Navigation** — enable "Save Editor" link in nav bar
- [ ] **Drag-and-drop** — global drop handler for .sav/.dsv files

## M4 · Polish & Testing

- [ ] **Unit tests** — save profile codec, BPS patch (CRC32, apply)
- [ ] **Component tests** — Testing Library tests for key components
- [ ] **E2E tests** — expand Playwright specs: all routes, filter interactions, ROM loading flow
- [ ] **Lighthouse audit** — performance, accessibility, SEO
- [ ] **Final styling pass** — verify DESIGN.md consistency
- [ ] **Clean up** — confirm `gamedata-tools/*.html` are fully superseded
