/// <reference path="../../../shared.d.ts" />

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '.';
import detectWin from '../winDetector';
import { StatusCodeError } from 'request-promise/errors';

function assertExists<T>(thing: T | null | undefined, message = 'Assertion Failed'): T {
	if (thing === null || thing === undefined) {
		throw new Error(message);
	}

	return thing;
}

const ANTE_AMOUNT = 1;

export enum CardSuit {
	HEART = 0b0001,
	DIAMOND = 0b0010,
	CLUB = 0b0100,
	SPADE = 0b1000,
}

export const CARD_SUIT_BITMASK = 0b1111;
export const CARD_VALUE_BITMASK = ~CARD_SUIT_BITMASK;

export enum CardValue {
	TWO = 2 << 4,
	THREE = 3 << 4,
	FOUR = 4 << 4,
	FIVE = 5 << 4,
	SIX = 6 << 4,
	SEVEN = 7 << 4,
	EIGHT = 8 << 4,
	NINE = 9 << 4,
	TEN = 10 << 4,
	JACK = 11 << 4,
	QUEEN = 12 << 4,
	KING = 13 << 4,
	ACE = 14 << 4,
}

export enum GameStatus {
	PRESTART = 0,
	PREFLOP = 1,
	FLOP = 2,
	TURN = 3,
	RIVER = 4,
	ENDED = 5,
}

const DEFAULT_DECK: Deck = [];

for (let suit of Object.values(CardSuit)) {
	if (typeof suit !== 'number') continue;
	for (let value of Object.values(CardValue)) {
		if (typeof value !== 'number') continue;
		DEFAULT_DECK.push(value | suit);
	}
}

const getShuffledDeck = (): Deck => {
	const newDeck: Deck = DEFAULT_DECK.map((x) => x); // shallow copy
	let itemsLeft: number = newDeck.length;
	let currIdx: number;

	while (itemsLeft > 0) {
		// Pick a remaining element…
		currIdx = Math.floor(Math.random() * itemsLeft--);

		// And swap it with the current element.
		const temp = newDeck[itemsLeft];
		newDeck[itemsLeft] = newDeck[currIdx];
		newDeck[currIdx] = temp;
	}

	return newDeck;
};

export interface PlayerState {
	readonly id: number;
	readonly name: string;

	folded: boolean;
	bets: number[];
	hand: Hand | null;
	result: Result | null;
}

export interface GameState {
	status: GameStatus;
	players: PlayerState[];
	currentPlayer: number;
	table: Card[];
	winners: number[] | null;
}

const initialState: GameState = {
	status: GameStatus.PRESTART,
	players: [],
	currentPlayer: 0,
	table: [],
	winners: null,
};

type AddUserAction = PayloadAction<{ name: string }>;
type AdvanceAction = PayloadAction<{ fold: boolean; amount: number }>;

const { reducer, actions, name } = createSlice({
	name: 'game',
	initialState,
	reducers: {
		addUser(state, { payload: { name } }: AddUserAction) {
			const id = state.players.length;
			state.players.push({ name, id, folded: false, bets: [], hand: null, result: null });
		},

		start(state) {
			const deck = getShuffledDeck();
			state.status = GameStatus.PREFLOP;
			state.players = state.players.map(
				(player): PlayerState => ({
					...player,
					folded: false,
					bets: [ANTE_AMOUNT],
					hand: [deck.pop() || 0, deck.pop() || 0],
				}),
			);
			state.table = [
				deck.pop() || 0,
				deck.pop() || 0,
				deck.pop() || 0,
				deck.pop() || 0,
				deck.pop() || 0,
			];
			state.currentPlayer = 0;
		},

		advance(state, { payload: { fold, amount } }: AdvanceAction) {
			const player = state.players[state.currentPlayer];
			if (fold) {
				player.folded = true;
			} else {
				player.bets[state.status] = amount;
			}
			do {
				state.currentPlayer++;

				if (
					// FIXME: Hacky way to call selector from within a reducer
					getPotIsRight.resultFunc(state, getCurrentBet.resultFunc(state))
				) {
					state.status++;
					state.currentPlayer = 0;
				}

				if (state.currentPlayer === state.players.length) state.currentPlayer = 0;
			} while (state.players[state.currentPlayer].folded && state.status < GameStatus.ENDED);

			if (state.status === GameStatus.ENDED) {
				const { winningResults, results } = detectWin(
					state.table,
					state.players.map((p) => ({ hand: assertExists(p.hand), folded: p.folded })),
				);

				results.forEach(({ id, result }) => (state.players[id].result = result));

				state.winners = winningResults.map((r) => r.id);
			}
		},
	},
});

export const getGameState = (state: RootState): GameState => state[name];

export const getVisibleCards = createSelector(getGameState, (state) => {
	switch (state.status) {
		case GameStatus.ENDED:
		case GameStatus.RIVER:
			return state.table;
		case GameStatus.TURN:
			return state.table.slice(1);
		case GameStatus.FLOP:
			return state.table.slice(2);
		case GameStatus.PREFLOP:
		case GameStatus.FLOP:
		default:
			return [];
	}
});

export const getCurrentPlayer = createSelector(
	getGameState,
	(state) => state.players[state.currentPlayer],
);

export const getGameStatus = createSelector(getGameState, (state) => state.status);

export const getNextPlayerId = createSelector(getGameState, (state) => state.players.length);

export const getUpdateForPlayer = (playerId: number, gameId: string) =>
	createSelector(
		[getGameState, getVisibleCards],
		(state, visibleCards): GameUpdate => {
			const thisPlayer = state.players[playerId];

			return {
				gameId,
				id: thisPlayer.id,
				name: thisPlayer.name,
				hand: thisPlayer.hand,
				table: visibleCards,
				currentPlayer: state.currentPlayer,
				status: state.status,
				winners: state.winners,
				players: state.players.map(({ id, name, folded, bets, result }) => ({
					id,
					name,
					folded,
					bets,
					result,
				})),
			};
		},
	);
export const getCurrentBet = createSelector(getGameState, ({ players, status }) =>
	Math.max(0, ...players.map((player) => (player.folded ? -1 : player.bets[status] || 0))),
);

export const getPotIsRight = createSelector(
	[getGameState, getCurrentBet],
	({ players, status }, bet) => {
		return players.every((player) => {
			if (player.folded) return true;
			// If the player hasn't bet this round
			if (player.bets.length - 1 < status) return false;
			return player.bets[status] === bet;
		});
	},
);

const suitMappings: { [key: string]: CardSuit } = {
	H: CardSuit.HEART,
	D: CardSuit.DIAMOND,
	C: CardSuit.CLUB,
	S: CardSuit.SPADE,
};

const valueMappings: { [key: string]: CardValue } = {
	'2': CardValue.TWO,
	'3': CardValue.THREE,
	'4': CardValue.FOUR,
	'5': CardValue.FIVE,
	'6': CardValue.SIX,
	'7': CardValue.SEVEN,
	'8': CardValue.EIGHT,
	'9': CardValue.NINE,
	'0': CardValue.TEN,
	J: CardValue.JACK,
	Q: CardValue.QUEEN,
	K: CardValue.KING,
	A: CardValue.ACE,
};

export const cardFromString = (cardStr: string, allowAdvanced: boolean = false): Card => {
	const value = valueMappings[cardStr[0]];
	const suit = !allowAdvanced
		? suitMappings[cardStr[1]]
		: cardStr
				.slice(1)
				.split('')
				.map((suit) => (suit === 'X' ? CARD_SUIT_BITMASK : suitMappings[suit]))
				.reduce((suit, acc) => acc | suit, 0);
	return suit | value;
};

export const cardsFromString = (cardsStr: string, allowAdvanced: boolean = true): Card[] => {
	const cardStrs = cardsStr.split(' ');

	if (!allowAdvanced && !cardStrs.every((cardStr) => cardStr.length === 2)) {
		throw new Error('Invalid Card String: ' + cardsStr);
	}

	return cardStrs.map((cardStr) => cardFromString(cardStr, allowAdvanced));
};

export const cardToString = (card: Card): string => {
	let suit = '?';
	if (card & CardSuit.CLUB) suit = 'C';
	if (card & CardSuit.SPADE) suit = 'S';
	if (card & CardSuit.HEART) suit = 'H';
	if (card & CardSuit.DIAMOND) suit = 'D';

	let value = (card >> 4).toString(10);

	if (value === '11') value = 'J';
	if (value === '12') value = 'Q';
	if (value === '13') value = 'K';
	if (value === '14') value = 'A';

	return `${value}${suit}`;
};

export const cardsToString = (cards: Card[]): string => cards.map(cardToString).join(' ');

export const { addUser, start, advance } = actions;
export { name };
export default reducer;
