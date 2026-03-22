/// <reference types="vitest/config" />

import fs from 'node:fs'
import path from 'node:path'
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import {defineConfig, type Plugin} from 'vite'

/**
 * GitHub Pages SPA routing workaround.
 *
 * GitHub Pages serves a custom 404.html when a route isn't found as a real
 * file. By copying index.html → 404.html after build, the browser receives
 * the SPA shell for any deep link, and react-router resolves the route
 * client-side.
 */
function ghPages404(): Plugin {
	return {
		name: 'gh-pages-404',
		closeBundle() {
			const outDir = path.resolve(import.meta.dirname, 'dist')
			const src = path.join(outDir, 'index.html')
			const dest = path.join(outDir, '404.html')
			if (fs.existsSync(src)) {
				fs.copyFileSync(src, dest)
			}
		}
	}
}

const REACT_INCLUDE = /\.(?:jsx|tsx|md|mdx)$/u

export default defineConfig(() => ({
	base: '/TaisenFan/',
	plugins: [
		mdx({remarkPlugins: [remarkGfm, remarkFrontmatter]}),
		react({include: REACT_INCLUDE}),
		tailwindcss(),
		ghPages404()
	],
	resolve: {
		alias: {
			'@': path.resolve(import.meta.dirname, './src')
		}
	},
	test: {
		bail: 1,
		clearMocks: true,
		css: false,
		environment: 'happy-dom',
		globals: true,
		include: ['src/**/*.test.ts?(x)']
	}
}))
