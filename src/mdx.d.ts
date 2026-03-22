// biome-ignore-all lint/style/noDefaultExport: MDX modules use default exports by design
declare module '*.md' {
	import type {ComponentType} from 'react'
	const Component: ComponentType
	export default Component
}
