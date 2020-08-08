import React, { useEffect } from 'react';
import './App.css';
import ControlPanel from './components/ControlPanel';

function App() {
	return (
		<div className="App">
			<ControlPanel />
			<ControlPanel />
			<ControlPanel />
			<ControlPanel />
			<ControlPanel />
		</div>
	);
}

export default App;
