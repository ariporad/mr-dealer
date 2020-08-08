import React, { useState } from 'react';

export interface GameSelectorProps {
	createGame: (name: string) => void;
	joinGame: (name: string, gameId: string) => void;
}

export function GameSelector({ createGame, joinGame }: GameSelectorProps) {
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
