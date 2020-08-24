import { CardValue, CARD_VALUE_BITMASK, CARD_SUIT_BITMASK, CardSuit } from './redux/game';
import { RESULT_TYPES } from './helpers';

/**
 * @param flushSuitHint the suit of the flush result, if one exists. This function does not check
 *                      for straight flushes. However, this hint is used to pick the card that will
 *                      produce a straight flush in the case where multiple cards with the same
 *                      value are available. For example (hint is `CardSuit.HEARTS`):
 *                      `2C 2S 2H 3H 4H 5H 6H -> straight: 2H 3H 4H 5H 6H`
 */
const checkStraight = (cards: Card[], flushSuitHint: CardSuit | null): Result | null => {
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

			// Drop this card if it has the same value as the previous one, UNLESS it's the same
			// suit as the flush hint.
			if ((card & CARD_SUIT_BITMASK) !== flushSuitHint && cards[i - 1] >> 4 === card >> 4) {
				return false;
			} else if (
				// To accomidate for the previous caveat, we need to drop this card if it has the
				// same value as the next one AND the next one has the same suit as the flush hint.
				i < cards.length - 1 && // is there another card after this one?
				cards[i + 1] >> 4 === card >> 4 && // is the next card the same value as this one?
				(cards[i + 1] & CARD_SUIT_BITMASK) === flushSuitHint // is the next card the right suit?
			) {
				return false;
			}
			return true;
		});

	outer_loop: for (let startIdx = 0; startIdx <= cards.length - 5; startIdx++) {
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

const checkFlush = (cards: Card[]): Result | null => {
	// Sort the cards in order of suit, then by value. We do this by moving the suit to the 9-13th
	// most significant bits (we leave the old suit too because it doesn't matter):
	// 0000 0000 0000 0000 0000 0000 0000 0000
	//                          ^^^^ ^^^^ ^^^^
	//                      New Suit  Val Old Suit
	cards = cards.sort(
		(a, b) => (((b & CARD_SUIT_BITMASK) << 8) | b) - (((a & CARD_SUIT_BITMASK) << 8) | a),
	);

	outer_loop: for (let startIdx = 0; startIdx <= cards.length - 5; startIdx++) {
		const suit = cards[startIdx] & CARD_SUIT_BITMASK;

		for (let curIdx = startIdx + 1; curIdx - startIdx < 5 && curIdx < cards.length; curIdx++) {
			if ((cards[curIdx] & CARD_SUIT_BITMASK) !== suit) continue outer_loop;
		}

		const selectedCards = cards
			// Select the relevant cards
			.slice(startIdx, startIdx + 5)
			// Get rid of the extra suit stuff we added
			.map((card) => card & 0xfff)
			// Sort the cards in descending order
			.sort((a, b) => b - a);

		return {
			type: 'flush',
			/**
			 * Flush priorities are the four value bits of each card, in left-to-right order,
			 * concatenated. Example:
			 *
			 * Cards: 0010 0001 (2H), 0100 0001 (4H), 0101 0001 (5H), 0110 0001 (6H), 0111 0001 (7H)
			 * Pri:   0010            0100            0101            0110            0111
			 *      = 0010 0100 0101 0110 0111
			 *
			 * This ensures that the relative ranking is between highest card and highest card,
			 * 2nd highest card and 2nd highest card, etc.
			 *
			 * We only use the four value bits because all JS bitwise operations use 32 bits. If we
			 * used all 8 bits of 5 cards, we'd need 5 x 8 = 40 bits, which doesn't work.
			 */
			priority: selectedCards.reduce((acc, c) => (acc << 4) | (c >> 4), 0),
			cards: selectedCards,
		};
	}

	return null;
};

const checkStraightFlush = (straight: Result | null, flush: Result | null): Result | null => {
	if (straight === null || flush === null) return null;

	const straightCards = straight.cards.sort((a, b) => b - a);
	const flushCards = flush.cards.sort((a, b) => b - a);

	if (straightCards.length !== flushCards.length) {
		throw new Error('Sanity Check failed: hand lengths vary!');
	}

	for (let i = 0; i < straightCards.length; i++) {
		if (straightCards[i] !== flushCards[i]) return null;
	}

	return {
		type: 'straight-flush',
		// Straight-flushes are relatively ranked just like straights, so we can reuse the priority
		priority: straight.priority,
		// We use the cards directly from the straight instead of from straightCards because, in the
		// case of a low ace, the sorted order may vary from the user-facing order.
		cards: straight.cards,
	};
};

export default function detectWin(cards: Card[]): Result[] {
	cards = cards
		// Sort in descending order
		.sort((a, b) => b - a);

	const flush = checkFlush(cards);
	const straight = checkStraight(cards, flush && flush.cards[0] & CARD_SUIT_BITMASK);

	const results = [straight, flush, checkStraightFlush(straight, flush)].filter(
		(x) => x !== null,
	) as Result[];

	return results.sort((a, b) => {
		if (a.type === b.type) return b.priority - a.priority;
		return RESULT_TYPES.indexOf(b.type) - RESULT_TYPES.indexOf(a.type);
	});
}
