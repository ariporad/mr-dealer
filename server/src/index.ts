import 'dotenv/config';
import { createServer } from 'http';
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
		socket.emit('err', { code: 'EBADGAMEID', message: 'Invalid Game ID' });
		return;
	}

	const id = getNextPlayerId(game.getState());
	game.dispatch(addUser({ name }));

	socket.emit('joined', { id, gameId });

	socket.on('advance', ({ amount, fold }: { amount: number; fold: boolean }) => {
		if (id !== getCurrentPlayer(game.getState()).id) {
			socket.emit('err', { code: 'EBADMOVE', message: 'Move out of turn!' });
			return;
		}

		if (
			getGameStatus(game.getState()) < GameStatus.PREFLOP ||
			getGameStatus(game.getState()) >= GameStatus.ENDED
		) {
			socket.emit('err', { code: 'EBADMOVE', message: 'Move at invalid time!' });
			return;
		}

		if (amount < getCurrentBet(game.getState())) {
			socket.emit('err', {
				code: 'EBADBET',
				message: `You must bet at least the prevous bet! (Currently $${getCurrentBet(
					game.getState(),
				)})`,
			});
			return;
		}

		game.dispatch(advance({ amount, fold }));
	});

	game.subscribe(() => {
		socket.emit('update', getUpdateForPlayer(id)(game.getState()));
	});
}

io.on('connection', (socket) => {
	console.log('Socket connected');

	socket.on('start-game', ({ name }: { name: string }) => {
		console.log('Starting Game!', name);
		const gameId = randomLetter() + randomLetter() + randomLetter() + randomLetter();
		const store = createStore();
		games.set(gameId, store);
		addUserToGame(socket, name, gameId);

		socket.on('start', () => {
			if (getGameStatus(store.getState()) === GameStatus.PRESTART) {
				store.dispatch(start());
			}
		});

		store.subscribe(() => {
			console.log(`State Update for Game ${gameId}:`);
			console.log(store.getState());
		});
	});

	socket.on('info', ({ name, gameId }: { name: string; gameId: string }) => {
		addUserToGame(socket, name, gameId);
	});
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
