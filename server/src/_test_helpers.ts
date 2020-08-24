import detectWin from './winDetector';
import { cardsToString, cardsFromString, cardFromString } from './redux/game';
import { isResultType } from './helpers';

/**
 * Format a result in a consistent, human-readable way.
 *
 * Supports only partial information (ex. no priority) so it can be used in testing, which may have
 * an incompletely-specified test (ie. if any priority is OK).
 */
export const formatResult = (type: ResultType, cards?: Card[], priority?: number) =>
	type +
	(typeof priority === 'number' ? `(${priority})` : '') +
	(cards ? ': ' + cardsToString(cards) : '');

/**
 * Nicely format an array of results.
 *
 * @param results the results to format
 * @param joiner string to join each result with
 * @param prejoin should a copy of `joiner` be inserted at the beginning of the string as well?
 */
export const formatResults = (results: Result[], joiner = '\n -', prejoin = true) =>
	(prejoin ? joiner : '') +
	results.map((r) => formatResult(r.type, r.cards, r.priority)).join(joiner);

const TEST_DEFINITION_REGEX = /^\s*((?:[2-9JQKA0][HDSC] ){7})(->|!->) ([a-z-]+)(?:\(([0-9]+|[2-9JQKA0][HDSC])\))?(?:: ((?:[2-9JQKA0][HDSC] ?){5}))?$/gm;

/**
 * Describe a test suite, similar to @see jest.Describe. Instead of accepting a function however,
 * this function accepts a string describing the tests to run. Example:
 *
 * ```typescript
 * desc('Straight')`
 *     2H 3H 4H 5H 6H JH JD -> straight(6H): 2H 3H 4H 5H 6H
 *     2H 3D 4S 5S 6C JD 8C -> straight(96): 2H 3D 4S 5S 6C
 *     2H 3D 4S 5S 6C JD 8C -> straight: 2H 3D 4S 5S 6C
 *     2H 3D 4S 5S 6C JD 8C -> straight
 *
 *     # Comments and blank lines are allowed too!
 *     # In fact, any line that can't be parsed will be ignored
 *
 *     2H 3H QH 5H 6H JH JD !-> straight(6H): 2H 3H 4H 5H 6H
 *     2H 3D QS 5S 6C JD 8C !-> straight(96): 2H 3D 4S 5S 6C
 *     2H 3D QS 5S 6C JD 8C !-> straight: 2H 3D 4S 5S 6C
 *     2H 3D QS 5S 6C JD 8C !-> straight
 * `;
 * ```
 */
export const desc = (suiteName: string) => (descriptor: string | TemplateStringsArray) =>
	describe(suiteName, () => {
		if (Array.isArray(descriptor)) descriptor = descriptor.join('\n');

		const descriptors = (descriptor as string).matchAll(TEST_DEFINITION_REGEX);

		for (const [descriptor, allCards, operator, type, priority, handCards] of descriptors) {
			if (!['->', '!->'].includes(operator)) {
				throw new Error(`Illegal Test Operator: ${operator}!`);
			}

			if (!isResultType(type)) throw new Error(`Illegal Result Type: ${type}!`);

			it(descriptor.trim(), () => {
				let results = detectWin(cardsFromString(allCards));

				let expector = operator === '->' ? expect(results) : expect(results).not;

				expector.toIncludeResult(
					type,
					handCards,
					(priority && Number(priority)) || priority,
				);
			});
		}
	});

declare global {
	namespace jest {
		interface Matchers<R> {
			/**
			 * A matcher to match against an array of Results and check if a specific result is
			 * included.
			 *
			 * @param type the ResultType to look for
			 * @param cards look for a result with these cards. If omitted, any cards are valid, and priority is ignored.
			 * @param priority look for a result with thsi priority. If omitted, any priority is valid. Requires `cards`.
			 */
			toIncludeResult(
				type: ResultType,
				cards?: string | Card[],
				priority?: string | number,
			): R;
		}
	}
}

expect.extend({
	/**
	 * @see global.jest.Matchers.toIncludeResult
	 */
	toIncludeResult(
		results: Result[],
		type: ResultType,
		cards?: string | Card[],
		priority?: string | number,
	): jest.CustomMatcherResult {
		if (typeof cards === 'string') cards = cardsFromString(cards);
		if (cards) cards = cards.sort((b, a) => b - a); // Descending order

		if (typeof priority === 'string') priority = cardFromString(priority);

		// A helper for generating consistent error messages
		const generateResult = (
			pass: boolean,
			message: string,
			resultsToShow: Result[] = results,
		) => ({
			pass,
			message: () =>
				// prettier-ignore
				`${message}\n\n` +
				'Expected: ' + (pass ? 'not ' : '') + formatResult(
					type,
					cards as number[] | undefined,
					priority as number | undefined,
				) +
				'\nReceived: ' + (resultsToShow.length > 0 ? formatResults(resultsToShow, '\n        - ') : '[None]'),
		});

		// Sort results by priority, and sort the cards within each result in descending order.
		results = results
			.sort((a, b) => b.priority - a.priority)
			.map((result) => ({
				...result,
				cards: result.cards.sort((b, a) => b - a),
			}));

		const resultsOfType = results.filter((r) => r.type === type);
		if (resultsOfType.length === 0) {
			return generateResult(false, `expected a ${type} result`);
		}

		if (cards) {
			const targetResult = resultsOfType.find((r) => this.equals(r.cards, cards));

			if (!targetResult) {
				return generateResult(false, `expected a ${type} result with the correct cards`);
			}

			if (priority && targetResult.priority !== priority) {
				return generateResult(false, `expected a ${type} result with the correct priority`);
			}
		} else {
			if (priority) {
				throw new Error(
					'expect.toIncludeResult cannot check for priority without checking for cards!',
				);
			}
			// fallthrough
		}

		return generateResult(true, `expected the result to not be included`);
	},
});
