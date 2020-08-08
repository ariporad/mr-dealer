/// <reference path="../../../shared.d.ts" />

import createSocket from '../socket';
import React, { useEffect, useState } from 'react';

enum ControlPanelStatus {
	PREJOIN,
	JOINING,
	JOINED,
}

enum GameStatus {
	PRESTART = 0,
	PREFLOP = 1,
	FLOP = 2,
	TURN = 3,
	RIVER = 4,
	ENDED = 5,
}

interface PrejoinControlPanelProps {
	createGame: (name: string) => void;
	joinGame: (name: string, gameId: string) => void;
}

function PrejoinControlPanel({ createGame, joinGame }: PrejoinControlPanelProps) {
	const [name, setName] = useState('');
	const [gameId, setGameId] = useState('');

	return (
		<>
			<label htmlFor="name">Name:</label>
			<input type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} />
			<label htmlFor="gameId">Game ID:</label>
			<input
				type="text"
				name="gameId"
				value={gameId}
				onChange={(e) => setGameId(e.target.value)}
				maxLength={4}
			/>
			<button onClick={() => createGame(name)}>Create Game</button>
			<button onClick={() => joinGame(name, gameId)}>Join Game</button>
		</>
	);
}

interface PlayingControlPanelProps {
	gameUpdate: GameUpdate;
	sendBet: (amount: number) => void;
	sendFold: () => void;
}

function PlayingControlPanel({ gameUpdate, sendBet, sendFold }: PlayingControlPanelProps) {
	const [bet, setBet] = useState<string>('0');
	return (
		<ul>
			<li>Game Status: {gameUpdate.status}</li>
			<li>
				{gameUpdate.currentPlayer === gameUpdate.id && '*'} [#{gameUpdate.id}]:{' '}
				{gameUpdate.hand[0]} {gameUpdate.hand[1]}
			</li>
			<li>
				Table: {gameUpdate.table.join(' ')} (Current Player: {gameUpdate.currentPlayer})
			</li>
			<li>
				<h3>Players:</h3>
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Name</th>
							<th>Folded?</th>
							<th>Ante</th>
							<th>Pre-Flop</th>
							<th>Flop</th>
							<th>Turn</th>
							<th>River</th>
						</tr>
					</thead>
					<tbody>
						{gameUpdate.players.map((player) => (
							<tr
								key={player.id}
								style={{
									fontWeight:
										gameUpdate.currentPlayer === player.id ? 'bold' : 'normal',
									textDecoration: player.folded ? 'line-through' : 'none',
									fontStyle: gameUpdate.id === player.id ? 'italic' : 'normal',
								}}
							>
								<td>{player.id}</td>
								<td>{player.name}</td>
								<td>{player.folded ? 'Y' : 'N'}</td>
								<td>${player.bets[0]}</td>
								<td>${player.bets[1]}</td>
								<td>${player.bets[2]}</td>
								<td>${player.bets[3]}</td>
								<td>${player.bets[4]}</td>
							</tr>
						))}
					</tbody>
				</table>
			</li>
			<li>
				<label htmlFor="betAmount">Bet:</label>
				<input
					type="number"
					name="betAmount"
					value={bet}
					onChange={(e) => setBet(e.target.value)}
				/>
				<input
					type="button"
					value="Bet"
					onClick={() => {
						const amount = parseInt(bet.trim(), 10);
						if (isNaN(amount)) {
							alert(`Invalid Bet! Must be a number! You said: "${bet}"!`);
							return;
						}

						setBet('0');
						sendBet(amount);
					}}
				/>
				<input type="button" value="Fold" onClick={sendFold} />
			</li>
		</ul>
	);
}

function ensure<T>(thing: T | null | undefined, message: string = 'Missing Value'): T {
	if (thing === null || thing === undefined) throw new Error(message);
	return thing;
}

interface ControlPanelProps {}

interface ControlPanelState {
	status: ControlPanelStatus;
	gameUpdate: GameUpdate | null;
}

let controlPanelId: number = 0;

export default class ControlPanel extends React.Component<ControlPanelProps, ControlPanelState> {
	socket: SocketIOClient.Socket | null = null;
	randId = controlPanelId++;

	constructor(props: ControlPanelProps) {
		super(props);
		this.state = { status: ControlPanelStatus.PREJOIN, gameUpdate: null };
	}

	componentDidMount() {
		this.socket = createSocket();

		this.socket.on('update', (update: GameUpdate) => {
			console.log(`[${this.randId}] Got Update:`, update);
			this.setState({ gameUpdate: update, status: ControlPanelStatus.JOINED });
		});
	}

	componentWillUnmount() {
		this.socket?.disconnect();
		this.socket = null;
	}

	render() {
		const content = (() => {
			switch (this.state.status) {
				case ControlPanelStatus.PREJOIN:
					return (
						<PrejoinControlPanel
							createGame={(name: string) => {
								this.socket?.emit('create-game', { name });
								this.setState({ status: ControlPanelStatus.JOINING });
							}}
							joinGame={(name: string, gameId: string) => {
								this.socket?.emit('join-game', { name, gameId });
								this.setState({ status: ControlPanelStatus.JOINING });
							}}
						/>
					);
				case ControlPanelStatus.JOINING:
					return <p>Joining...</p>;
				case ControlPanelStatus.JOINED:
					const gameUpdate = ensure(this.state.gameUpdate);
					if (gameUpdate.status === GameStatus.PRESTART) {
						return (
							<>
								<h3>Waiting for Start. Players:</h3>
								<ol start={0}>
									{gameUpdate.players.map((player) => (
										<li key={player.id}>{player.name}</li>
									))}
								</ol>
								{gameUpdate.id === 0 && (
									<button onClick={() => this.socket?.emit('start-game')}>
										Start Game
									</button>
								)}
							</>
						);
					} else {
						return (
							<PlayingControlPanel
								gameUpdate={gameUpdate}
								sendBet={(amount: number) =>
									this.socket?.emit('advance', { amount, fold: false })
								}
								sendFold={() =>
									this.socket?.emit('advance', { amount: 0, fold: true })
								}
							/>
						);
					}
			}
		})();

		return (
			<div className="control-panel">
				{this.state.gameUpdate ? (
					<h2>
						#{this.state.gameUpdate.id}: {this.state.gameUpdate.name} (
						{this.state.gameUpdate.id === 0 && 'Host, '}
						{this.state.gameUpdate.gameId})
					</h2>
				) : (
					<h2>New Player</h2>
				)}
				{content}
			</div>
		);
	}
}
