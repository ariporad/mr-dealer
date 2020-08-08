import React, { useState } from 'react';
import './App.css';
import ControlPanel from './components/ControlPanel';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function App() {
	const [numPlayers, setNumPlayers] = useState(4);
	const [knownGames, setKnownGames] = useState<string[]>([]);

	return (
		<>
			<div className="control-panel-list">
				{new Array(numPlayers).fill('not undefined').map((_, i) => (
					<ControlPanel
						key={i}
						defaultName={LETTERS[i % LETTERS.length]}
						knownGames={knownGames}
						onJoin={(gameId: string) => {
							if (!knownGames.includes(gameId)) {
								setKnownGames([...knownGames, gameId]);
							}
						}}
					/>
				))}
			</div>
			<button onClick={() => setNumPlayers(numPlayers + 1)}>Add Player</button>
		</>
	);
}

export default App;
