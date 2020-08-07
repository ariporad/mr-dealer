import { createSlice, PayloadAction, createSelector, Action, current } from '@reduxjs/toolkit';
import { RootState } from '.';

type Card = string;
type Deck = Card[];
type Hand = [Card, Card];

export enum GameStatus {
	PRESTART = 0,
	PREFLOP = 1,
	FLOP = 2,
	TURN = 3,
	RIVER = 4,
	ENDED = 5,
}

const CARD_VALUES = '234567890JQKA'.split('');
const CARD_SUITS = 'HDSC'.split('');
const DEFAULT_DECK: Deck = [];

for (let suit of CARD_SUITS) {
	for (let value of CARD_VALUES) {
		DEFAULT_DECK.push(value + suit);
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
	readonly uuid: string;
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

type AddUserAction = PayloadAction<{ uuid: string; name: string }>;
type AdvanceAction = PayloadAction<{ fold: boolean; amount: number }>;

const { reducer, actions, name } = createSlice({
	name: 'game',
	initialState,
	reducers: {
		addUser(state, { payload: { uuid, name } }: AddUserAction) {
			const id = state.players.length;
			state.players.push({ uuid, name, id, folded: false, bets: [], hand: null });
		},

		start(state) {
			const deck = getShuffledDeck();
			state.status = GameStatus.PREFLOP;
			state.players = state.players.map(
				(player): PlayerState => ({
					...player,
					folded: false,
					bets: [],
					hand: [deck.pop() || '', deck.pop() || ''],
				}),
			);
			state.table = [
				deck.pop() || '',
				deck.pop() || '',
				deck.pop() || '',
				deck.pop() || '',
				deck.pop() || '',
			];
			state.currentPlayer = 0;
		},

		advance(state, { payload: { fold, amount } }: AdvanceAction) {
			const player = state.players[state.currentPlayer];
			if (fold) {
				player.folded = true;
			} else {
				player.bets.push(amount);
			}
			do {
				state.currentPlayer++;
				if (state.currentPlayer === state.players.length) {
					state.currentPlayer = 0;
					state.status++;
				}
			} while (!state.players[state.currentPlayer].folded && state.status < GameStatus.ENDED);
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

export const { addUser, start, advance } = actions;
export { name };
export default reducer;
