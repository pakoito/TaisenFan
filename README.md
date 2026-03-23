# TaisenFan

Community site for Sangokushi Taisen Ten (三国志大戦DS) — guides, game data, save editor, and English translation patches.

**Live:** https://pakoito.github.io/TaisenFan/

## Tech Stack

- [Vite](https://vitejs.dev) with [React 19](https://react.dev) and [TypeScript 5](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com) with custom "Digital Scribe" design system
- [shadcn/ui](https://ui.shadcn.com) (Radix primitives) for accessible components
- [MDX](https://mdxjs.com) for guide pages (build-time compiled)
- [Biome](https://biomejs.dev) for linting and formatting
- [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) for tests
- Deployed via GitHub Pages

## Features

- **Game Data** — browsable Lord Cards (192), Sage Cards (20), Duel Decks (80)
- **Guides** — 8 strategy guides rendered from markdown with inter-guide navigation
- **ROM Loader** — load the original NDS ROM in-browser to extract character portraits (Web Worker, IndexedDB cache) and download the English translation patch (BPS)
- **Save Editor** — (coming soon) edit save files in-browser

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Sync guides + start dev server |
| `npm run build` | Sync guides + production build (output in `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run guides:sync` | Copy guides from monorepo root, rewrite links |
| `npm test` | Run unit tests (watch mode) |
| `npm run test:ci` | Run unit tests once |
| `npm run test:e2e` | Playwright e2e tests (UI mode) |
| `npm run test:e2e:ci` | Playwright e2e tests (headless) |
| `npm run lint` | TypeScript + Biome checks |
| `npm run format` | Biome format |

## Architecture

```
src/
├── api/                    # Data fetching (lords.json, sages.json, decks.json)
├── components/
│   ├── ui/                 # shadcn components (Accordion, Badge, Button, etc.)
│   ├── CartridgeSlot.tsx   # ROM loader popover in nav bar
│   ├── FilterBar.tsx       # Shared search + select filters
│   ├── Layout.tsx          # App shell (nav, footer)
│   ├── LordTable.tsx       # Accordion-based lord card grid
│   ├── LordRow.tsx         # Individual lord card row + expanded detail
│   ├── MdxComponents.tsx   # MDX → Digital Scribe element mapping
│   └── SageCard.tsx        # Sage card with collapsible lore
├── content/guides/         # Synced .md files (compiled to React at build time)
├── contexts/
│   ├── RomContext.tsx       # ROM state machine provider
│   ├── rom-types.ts        # Types + context creation
│   └── useRom.ts           # Consumer hook
├── pages/
│   ├── gamedata/            # Lords, Sages, Decks pages
│   ├── guides/              # Guide index + guide page (MDX)
│   ├── Home.tsx
│   └── NotFound.tsx         # Three Kingdoms–themed 404
├── utils/
│   ├── nds-parser.ts        # NDS ROM → NitroFS file list
│   ├── nfp-unpack.ts        # NFP archive deobfuscation + LZ10
│   ├── kpc-decode.ts        # KPC tile image → RGBA
│   ├── image-cache.ts       # IndexedDB persistence (versioned)
│   └── ...
├── workers/
│   ├── rom-worker.ts        # Web Worker: extraction + patching
│   ├── rom-worker-client.ts # Typed wrapper for main thread
│   ├── rom-worker-types.ts  # Message protocol
│   └── bps-patch.ts         # BPS format parser + applier
└── global.css               # Tailwind + shadcn + Digital Scribe theme
```
