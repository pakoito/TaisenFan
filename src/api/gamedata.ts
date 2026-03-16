import type {DuelDeck, LordCard, SageCard} from '@/types/gamedata'

async function fetchJson<T>(path: string): Promise<T> {
	const response = await fetch(path)
	if (!response.ok) {
		throw new Error(`Failed to load ${path}`)
	}
	return response.json() as Promise<T>
}

export function getLords(): Promise<LordCard[]> {
	return fetchJson('/data/lords.json')
}

export function getSages(): Promise<SageCard[]> {
	return fetchJson('/data/sages.json')
}

export function getDecks(): Promise<DuelDeck[]> {
	return fetchJson('/data/decks.json')
}
