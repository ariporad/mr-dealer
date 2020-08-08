/// <reference path="../../shared.d.ts" />
import 'dotenv/config';
import { createServer, Server } from 'http';
import { resolve } from 'path';
import socketIO, { Socket } from 'socket.io';
import express from 'express';
import createStore from './redux';
import {
	addUser,
	getNextPlayerId,
	getGameState,
	getCurrentPlayer,
	advance,
	getUpdateForPlayer,
	getGameStatus,
	GameStatus,
	start,
	getCurrentBet,
} from './redux/game';

const WEB_BUILD_DIR = resolve(__dirname, '..', '..', 'web', 'build');

const app = express();
const server = createServer(app);
const io = socketIO(server);

app.use(express.static(WEB_BUILD_DIR));

app.get('/', function (req, res) {
	console.log('foo');
	res.sendFile(resolve(WEB_BUILD_DIR, 'index.html'));
});

const games = new Map<string, ReturnType<typeof createStore>>();

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const randomLetter = () => LETTERS[Math.floor(Math.random() * LETTERS.length)];

function addUserToGame(socket: Socket, name: string, gameId: string) {
	gameId = gameId.toUpperCase();
	const game = games.get(gameId);

	if (!game) {
		socket.send({
			type: 'err',
			code: 'EBADGAMEID',
			message: 'Invalid Game ID',
		} as ServerMessage);
		return;
	}

	const id = getNextPlayerId(game.getState());
	game.dispatch(addUser({ name }));

	socket.on('message', (msg: ClientMessage) => {
		if (msg.type === 'start-game') {
			if (id !== 0) {
				socket.send({
					type: 'err',
					code: 'EBADPERMS',
					message: 'Only the host can start the game!',
				} as ServerMessage);
				return;
			}
			if (getGameStatus(game.getState()) !== GameStatus.PRESTART) {
				socket.send({
					type: 'err',
					code: 'EBADCMD',
					message: 'Tried to start a game that has already begun!',
				} as ServerMessage);
				return;
			}
			game.dispatch(start());
		} else if (msg.type === 'advance') {
			const { amount, fold } = msg;

			if (id !== getCurrentPlayer(game.getState()).id) {
				socket.send({
					type: 'err',
					code: 'EBADMOVE',
					message: 'Move out of turn!',
				} as ServerMessage);
				return;
			}

			if (
				getGameStatus(game.getState()) < GameStatus.PREFLOP ||
				getGameStatus(game.getState()) >= GameStatus.ENDED
			) {
				socket.send({
					type: 'err',
					code: 'EBADMOVE',
					message: 'Move at invalid time!',
				} as ServerMessage);
				return;
			}

			if (!fold && amount < getCurrentBet(game.getState())) {
				socket.send({
					type: 'err',
					code: 'EBADBET',
					message: `You must bet at least the prevous bet! (Currently $${getCurrentBet(
						game.getState(),
					)})`,
				} as ServerMessage);
				return;
			}

			game.dispatch(advance({ amount, fold }));
		}
	});

	game.subscribe(() => {
		socket.send({
			type: 'update',
			update: getUpdateForPlayer(id, gameId)(game.getState()),
		} as ServerMessage);
	});

	socket.send({
		type: 'update',
		update: getUpdateForPlayer(id, gameId)(game.getState()),
	} as ServerMessage);
}

io.on('connection', (socket) => {
	console.log('Socket connected');

	socket.on('message', (msg: ClientMessage) => {
		if (msg.type === 'create-game') {
			const { name } = msg;

			console.log('Creating Game!', name);

			const gameId = randomLetter() + randomLetter() + randomLetter() + randomLetter();

			const store = createStore();
			games.set(gameId, store);

			addUserToGame(socket, name, gameId);

			store.subscribe(() => {
				console.log(`State Update for Game ${gameId}:`);
				console.log(store.getState());
			});
		} else if (msg.type === 'join-game') {
			addUserToGame(socket, msg.name, msg.gameId);
		}
	});
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
