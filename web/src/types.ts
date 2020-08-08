/// <reference path="../../shared.d.ts" />

// HACK: Enums don't work in shared.d.ts, so keep this in sync with the server's version.
export enum GameStatus {
	PRESTART = 0,
	PREFLOP = 1,
	FLOP = 2,
	TURN = 3,
	RIVER = 4,
	ENDED = 5,
}

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
