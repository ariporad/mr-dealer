import React from 'react';
import { usePlayerController } from './PlayerController';

export default function LobbyView() {
	const playerController = usePlayerController();

	return (
		<>
			<h3>Waiting for Start</h3>
			<h4>Players:</h4>
			<ol start={0}>
				{playerController.getGameUpdate().players.map(({ name }, id) => (
					<li key={id}>{name}</li>
				))}
			</ol>
			{playerController.isHost() && (
				<button onClick={playerController.startGame}>Start Game</button>
			)}
		</>
	);
}
