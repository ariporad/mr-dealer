import React, { useState } from 'react';

export interface GameSelectorProps {
	defaultName?: string;

	createGame: (name: string) => void;
	joinGame: (name: string, gameId: string) => void;

	knownGames: string[];
}

export function GameSelector({ createGame, joinGame, knownGames, defaultName }: GameSelectorProps) {
	const [name, setName] = useState(defaultName || '');
	const [gameId, setGameId] = useState('');

	return (
		<div className="control-panel">
			<div>
				<label htmlFor="name">Name:</label>
				<input
					type="text"
					name="name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
			</div>
			<div>
				<label htmlFor="gameId">Game ID:</label>
				<input
					type="text"
					name="gameId"
					value={gameId}
					onChange={(e) => setGameId(e.target.value)}
					maxLength={4}
				/>
			</div>
			<div>
				<button onClick={() => createGame(name)}>Create Game</button>
				{knownGames.map((gameId) => (
					<button onClick={() => joinGame(name, gameId)} key={gameId}>
						Join Game {gameId}
					</button>
				))}
			</div>
		</div>
	);
}
