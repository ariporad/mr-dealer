/// <reference path="../../../shared.d.ts" />

import React, { useState } from 'react';
import PlayView from './PlayView';
import { GameSelector } from './GameSelector';
import LobbyView from './LobbyView';
import {
	GameStatus,
	usePlayerController,
	PlayerController,
	createPlayerController,
	PlayerControllerProvider,
} from './PlayerController';

function ControlPanelBody() {
	const gameUpdate = usePlayerController().getGameUpdate();

	return (
		<>
			<h2>
				#{gameUpdate.id}: {gameUpdate.name} ({gameUpdate.id === 0 && 'Host, '}
				{gameUpdate.gameId})
			</h2>
			{gameUpdate.status === GameStatus.PRESTART ? <LobbyView /> : <PlayView />}
		</>
	);
}

export default function ControlPanel() {
	const [playerController, setPlayerController] = useState<PlayerController | null>(null);

	if (playerController === null) {
		return (
			<div className="control-panel">
				<GameSelector
					createGame={(name: string) => {
						setPlayerController(createPlayerController({ name, isHost: true }));
					}}
					joinGame={(name: string, gameId: string) => {
						setPlayerController(createPlayerController({ name, gameId }));
					}}
				/>
			</div>
		);
	}

	return (
		<div className="control-panel">
			<PlayerControllerProvider playerController={playerController}>
				<ControlPanelBody />
			</PlayerControllerProvider>
		</div>
	);
}
