# TaisenFan

Community site for Sangokushi Taisen Ten (三国志大戦DS) — guides, game data, and English translation patches.

## Tech Stack

- [Vite](https://vitejs.dev) with [React 19](https://react.dev) and [TypeScript 5](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Biome](https://biomejs.dev) for linting and formatting
- [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) for unit/integration tests
- [Playwright](https://playwright.dev) for e2e tests
- Deployed via GitHub Pages

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start dev server with hot reload
- `npm run build` — production build (output in `dist/`)
- `npm run preview` — preview production build locally
- `npm test` — run unit/integration tests (watch mode)
- `npm run test:ci` — run all unit/integration tests once
- `npm run test:e2e` — run e2e tests with Playwright UI
- `npm run test:e2e:ci` — run e2e tests headlessly
- `npm run format` — format with Biome
- `npm run lint` — TypeScript + Biome checks
- `npm run validate` — lint + test:ci + test:e2e:ci
