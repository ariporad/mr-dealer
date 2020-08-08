/// <reference path="../../../shared.d.ts" />

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '.';

const ANTE_AMOUNT = 1;

export enum CardSuit {
	HEART = 0b0001,
	DIAMOND = 0b0010,
	CLUB = 0b0100,
	SPADE = 0b1000,
}

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
}

export interface GameState {
	status: GameStatus;
	players: PlayerState[];
	currentPlayer: number;
	table: Card[];
}

const initialState: GameState = {
	status: GameStatus.PRESTART,
	players: [],
	currentPlayer: 0,
	table: [],
};

type AddUserAction = PayloadAction<{ name: string }>;
type AdvanceAction = PayloadAction<{ fold: boolean; amount: number }>;

const { reducer, actions, name } = createSlice({
	name: 'game',
	initialState,
	reducers: {
		addUser(state, { payload: { name } }: AddUserAction) {
			const id = state.players.length;
			state.players.push({ name, id, folded: false, bets: [], hand: null });
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

				if (state.currentPlayer === state.players.length) {
					state.currentPlayer = 0;
					// FIXME: Hacky way to call selector from within a reducer
					if (getPotIsRight.resultFunc(state, getCurrentBet.resultFunc(state))) {
						state.status++;
					}
				}
			} while (state.players[state.currentPlayer].folded && state.status < GameStatus.ENDED);
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
				players: state.players.map(({ id, name, folded, bets }) => ({
					id,
					name,
					folded,
					bets,
				})),
			};
		},
	);
export const getCurrentBet = createSelector(getGameState, ({ players, status }) =>
	Math.max(0, ...players.map((player) => (player.folded ? -1 : player.bets[status] || 0))),
);

export const getPotIsRight = createSelector([getGameState, getCurrentBet], (state, bet) => {
	const { players } = state;

	return players.every((player) => player.folded || player.bets[player.bets.length - 1] === bet);
});

export const { addUser, start, advance } = actions;
export { name };
export default reducer;
