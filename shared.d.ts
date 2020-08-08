/**
 * HACK: This file contains types (mostly interfaces for messages) that need to be shared between
 * the web and server.
 *
 * It's included via a `/// <reference path="../../../../shared.d.ts" />` directive
 */
type Card = number;

type Deck = Card[];
type Hand = [Card, Card];

interface GameUpdate {
	gameId: string;
	id: number;
	name: string;
	hand: Hand | null;
	table: Card[];
	currentPlayer: number;
	status: GameStatus;
	players: {
		id: number;
		name: string;
		folded: boolean;
		bets: number[];
	}[];
}

enum GameStatus {
	PRESTART = 0,
	PREFLOP = 1,
	FLOP = 2,
	TURN = 3,
	RIVER = 4,
	ENDED = 5,
}

type ClientMessage = CreateGameMessage | JoinGameMessage | AdvanceMessage | StartGameMessage;
type CreateGameMessage = { type: 'create-game'; name: string };
type JoinGameMessage = { type: 'join-game'; name: string; gameId: string };
type AdvanceMessage = { type: 'advance'; amount: number; fold: boolean };
type StartGameMessage = { type: 'start-game' };

type ErrorCode = 'EBADMOVE' | 'EBADGAMEID' | 'EBADBET' | 'EBADPERMS' | 'EBADCMD';

type ServerMessage = ErrorMessage | GameUpdateMessage;
type ErrorMessage = { type: 'err'; code: ErrorCode; message: string };
type GameUpdateMessage = { type: 'update'; update: GameUpdate };
