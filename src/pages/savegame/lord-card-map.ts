/**
 * Bridge between lords.json (player-facing card data) and the
 * save-tools CARD_TABLE (binary save offsets).
 *
 * lords.json identifies a card by `cardIndex` ("魏001", "蜀040", "LE001",
 * "Ex.008", "DS001", "群007"). CARD_TABLE keys cards by `cardId`
 * ("Wei-001", "Han-007", "LE-001", "EX-008", "DS-001").
 *
 * The two encodings agree on the faction + numeric suffix; we just
 * normalize the prefix.
 */

import {CARD_BY_ID} from '@/save-tools';
import type {LordCard} from '@/types/gamedata';

const FACTION_PREFIX: Record<LordCard['faction'], string> = {
	Wei: 'Wei',
	Shu: 'Shu',
	Wu: 'Wu',
	Other: 'Han',
	LE: 'LE',
	EX: 'EX',
	DS: 'DS',
};

/** Normalize lords.json cardIndex into the CARD_TABLE cardId form. */
export function cardIdForLord(lord: LordCard): string {
	const digits = lord.cardIndex.replace(/\D/g, '').padStart(3, '0');
	return `${FACTION_PREFIX[lord.faction]}-${digits}`;
}

/** Look up the save-tools card entry (offset, no, name) for a lord. */
export function cardTableEntryForLord(lord: LordCard) {
	return CARD_BY_ID[cardIdForLord(lord)];
}
