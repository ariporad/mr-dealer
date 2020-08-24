import { CardValue, CARD_VALUE_BITMASK, CARD_SUIT_BITMASK } from './redux/game';
import { RESULT_TYPES } from './helpers';

const checkStraight = (cards: Card[]): Result | null => {
	cards = cards
		// In order to deal with high/low aces, for straights ONLY, we give the player an imaginary
		// card with a value of 1 (low ace).
		.flatMap((val) =>
			(val & CARD_VALUE_BITMASK) === CardValue.ACE
				? // Low ace of the same suit
				  [val, (1 << 4) | (val & CARD_SUIT_BITMASK)]
				: [val],
		)
		// Re-sort in descending order
		.sort((a, b) => b - a)
		// We want to deduplicate cards with the same face value. We do this by removing any card
		// with the same face value as the previous card. (The array has already been sorted.)
		.filter((card, i, cards) => {
			if (i === 0) return true;
			if (cards[i - 1] >> 4 === card >> 4) return false;
			return true;
		});

	outer_loop: for (let startIdx = 0; startIdx < 3; startIdx++) {
		let lastVal = cards[startIdx];
		for (let curIdx = startIdx + 1; curIdx - startIdx < 5 && curIdx < cards.length; curIdx++) {
			if ((lastVal >> 4) - 1 !== cards[curIdx] >> 4) continue outer_loop;
			lastVal = cards[curIdx];
		}

		return {
			type: 'straight',
			priority: cards[startIdx],
			cards: cards.slice(startIdx, startIdx + 5).map((card) =>
				// If the card is a low ace, convert it back to a high ace of the same suit
				card >> 4 === 1 ? CardValue.ACE | (card & CARD_SUIT_BITMASK) : card,
			),
		};
	}

	return null;
};

export default function detectWin(cards: Card[]): Result[] {
	cards = cards
		// Sort in descending order
		.sort((a, b) => b - a);

	const results = [checkStraight(cards)].filter((x) => x !== null) as Result[];

	return results.sort((a, b) => {
		if (a.type === b.type) return b.priority - a.priority;
		return RESULT_TYPES.indexOf(b.type) - RESULT_TYPES.indexOf(a.type);
	});
}
