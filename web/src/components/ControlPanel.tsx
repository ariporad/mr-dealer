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

function ControlPanelBody({ onJoin }: { onJoin: (gameId: string) => void }) {
	const playerController = usePlayerController();
	const gameUpdate = playerController.getGameUpdate();

	onJoin(gameUpdate.gameId);

	return (
		<div
			className={[
				'control-panel',
				playerController.isCurrentPlayer() && 'control-panel-current-player',
				playerController.didFold() && 'control-panel-folded',
			]
				.filter((x) => !!x)
				.join(' ')}
		>
			<h2>
				#{gameUpdate.id}: {gameUpdate.name} ({gameUpdate.id === 0 && 'Host, '}
				{gameUpdate.gameId})
			</h2>
			{gameUpdate.status === GameStatus.PRESTART ? <LobbyView /> : <PlayView />}
		</div>
	);
}

interface ControlPanelProps {
	knownGames: string[];
	onJoin: (gameId: string) => void;

	defaultName?: string;
}

export default function ControlPanel({ knownGames, onJoin, defaultName }: ControlPanelProps) {
	const [playerController, setPlayerController] = useState<PlayerController | null>(null);

	if (playerController === null) {
		return (
			<GameSelector
				createGame={(name: string) => {
					setPlayerController(createPlayerController({ name, isHost: true }));
				}}
				joinGame={(name: string, gameId: string) => {
					setPlayerController(createPlayerController({ name, gameId }));
				}}
				knownGames={knownGames}
				defaultName={defaultName}
			/>
		);
	}

	return (
		<PlayerControllerProvider playerController={playerController}>
			<ControlPanelBody onJoin={onJoin} />
		</PlayerControllerProvider>
	);
}
