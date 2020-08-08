import React, { useEffect, useState } from 'react';
import './App.css';
import ControlPanel from './components/ControlPanel';

function App() {
	const [numPlayers, setNumPlayers] = useState(3);

	return (
		<div className="App">
			{new Array(numPlayers).fill('not undefined').map((_, i) => (
				<ControlPanel key={i} />
			))}
			<button onClick={() => setNumPlayers(numPlayers + 1)}>Add Player</button>
		</div>
	);
}

export default App;
