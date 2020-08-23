import { CardValue, cardsToString, CARD_SUIT_BITMASK, CARD_VALUE_BITMASK } from './redux/game';

export type ResultBase<T extends string> = { type: T; priority: number; cards: Card[] };

export type Result =
	| StraightFlushResult
	| FourKind
	| FullHouseResult
	| FlushResult
	| StraightResult
	| ThreeKind
	| TwoPairResult
	| PairResult
	| HighResult;

export type StraightFlushResult = ResultBase<'straight-flush'>;
export type FourKind = ResultBase<'four-kind'>;
export type FullHouseResult = ResultBase<'full-house'>;
export type FlushResult = ResultBase<'flush'>;
export type StraightResult = ResultBase<'straight'>;
export type ThreeKind = ResultBase<'three-kind'>;
export type TwoPairResult = ResultBase<'two-pair'>;
export type PairResult = ResultBase<'pair'>;
export type HighResult = ResultBase<'high'>;

export type ResultType = Result extends { type: infer T } ? T : never;

export const RESULT_TYPES: ResultType[] = [
	'straight-flush',
	'four-kind',
	'full-house',
	'flush',
	'straight',
	'three-kind',
	'two-pair',
	'pair',
	'high',
];

const checkStraight = (cards: Card[]): Result | null => {
	console.log('CCC0', cardsToString(cards));
	cards = cards
		// In order to deal with high/low aces, for straights ONLY, we give the player an imaginary
		// card with a value of 1 (low ace).
		.flatMap((val) =>
			(val & CARD_VALUE_BITMASK) === CardValue.ACE ? [val, CardValue.ACE] : [val],
		)
		// Re-sort in descending order
		.sort((a, b) => b - a);
	console.log('CCC2', cardsToString(cards.map((x) => x)));

	outer_loop: for (let startIdx = 0; startIdx < 3; startIdx++) {
		let lastVal = cards[startIdx];
		for (
			let curIdx = startIdx + 1, cardsMatched = 0;
			cardsMatched < 5 && curIdx < cards.length;
			curIdx++, cardsMatched++
		) {
			if ((lastVal & CARD_VALUE_BITMASK) === (cards[curIdx] & CARD_VALUE_BITMASK)) {
				cardsMatched--;
				continue;
			}
			if (lastVal + (1 << 4) !== cards[curIdx]) continue outer_loop;
			lastVal = cards[curIdx];
		}

		return {
			type: 'straight',
			priority: cards[startIdx],
			cards: cards.slice(startIdx, startIdx + 5),
		};
	}

	return null;
};

export default function detectWin(cards: Card[]): Result[] {
	cards = cards
		// Sort in descending order
		.sort((a, b) => b - a);

	console.log('CCCA', cardsToString(cards));
	const results = [checkStraight(cards)].filter((x) => x !== null) as Result[];

	return results.sort((a, b) => {
		if (a.type === b.type) return b.priority - a.priority;
		return b.type - a.type;
	});
}
