import { CardSuit, CardValue, cardFromString, cardsFromString, cardsToString } from './redux/game';
import detectWin, { Result, ResultType } from './winDetector';

describe('Win Detection', () => {
	([
		[
			'2H 3H 4H 5H 6H JH JD',
			{
				type: 'straight',
				priority: cardFromString('6S') >> 4,
				cards: cardsFromString('2H 3H 4D 5C 6S'),
			} as Result,
		],
	] as [string, Result][]).forEach(([cardStr, result]: [string, Result]) => {
		const cardStrs = cardStr.split(' ');

		const cards: Card[] = cardsFromString(cardStr);

		//prettier-ignore
		const testTitle = `${cardStr} -> ${result.type} (${result.priority}): ${cardsToString(result.cards)}`;

		it(testTitle, () => {
			expect(detectWin(cards)).toContainEqual(result);
			console.log('Result', cardStr, detectWin(cards));
		});
	});
});
