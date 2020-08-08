import io from 'socket.io-client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { GameStatus } from '../types';

interface PlayerControllerOptions {
	name: string;
	gameId?: string;
	isHost?: boolean;
}

export interface PlayerController {
	getGameUpdate(): GameUpdate;
	hasGameUpdate(): boolean;
	subscribe(listener: () => void): () => void;
	startGame(): void;
	sendBet(amount: number): void;
	sendFold(): void;
	isHost(): boolean;
	getCurrentPlayer(): number;
	getId(): number;
	getStatus(): GameStatus;
	isCurrentPlayer(): boolean;
	didFold(): boolean;
	getGameId(): string;
}

export function createPlayerController({
	name,
	gameId,
	isHost,
}: PlayerControllerOptions): PlayerController {
	if (!gameId && !isHost) {
		throw new Error('PlayerController must provide either a gameId or be a host');
	}

	const socket = io();
	let gameUpdate: GameUpdate | null;
	let subscriptions: (() => void)[] = [];

	socket.on('message', (msg: ServerMessage) => {
		switch (msg.type) {
			case 'update':
				gameUpdate = msg.update;
				gameId = msg.update.gameId;
				subscriptions.forEach((sub) => sub());
				break;
			case 'err':
				alert(`[${name}]: ${msg.message} (${msg.code})`);
				break;
			default:
				console.error('Unknown Message:', msg);
		}
	});

	if (isHost) {
		socket.send({ type: 'create-game', name } as ClientMessage);
	} else {
		socket.send({ type: 'join-game', name, gameId } as ClientMessage);
	}

	return {
		hasGameUpdate(): boolean {
			return !!gameUpdate;
		},

		getGameUpdate(): GameUpdate {
			if (!gameUpdate) throw new Error('No Game Update Yet!');
			return gameUpdate;
		},

		subscribe(listener: () => void) {
			subscriptions.push(listener);
			const unsubscribe = () => {
				subscriptions = subscriptions.filter((sub) => sub !== listener);
			};
			if (gameUpdate) listener();
			return unsubscribe;
		},

		startGame() {
			socket.send({ type: 'start-game' } as ClientMessage);
		},

		sendBet(amount: number) {
			socket.send({ type: 'advance', amount, fold: false } as ClientMessage);
		},

		sendFold() {
			socket.send({ type: 'advance', amount: 0, fold: true } as ClientMessage);
		},

		isHost() {
			return this.getGameUpdate().id === 0;
		},

		getCurrentPlayer() {
			return this.getGameUpdate().currentPlayer;
		},

		getId() {
			return this.getGameUpdate().id;
		},

		getStatus() {
			return this.hasGameUpdate() ? this.getGameUpdate().status : GameStatus.PRESTART;
		},

		isCurrentPlayer() {
			return (
				this.getStatus() >= GameStatus.PREFLOP &&
				this.getStatus() < GameStatus.ENDED &&
				this.getCurrentPlayer() === this.getId()
			);
		},

		didFold() {
			return this.getGameUpdate().players[this.getId()].folded;
		},

		getGameId(): string {
			return gameId || this.getGameUpdate().gameId;
		},
	};
}

const PlayerControllerContext = createContext<PlayerController | null>(null);

interface PlayerControllerProviderProps {
	playerController: PlayerController;
	loadingView?: () => JSX.Element;
}

export class PlayerControllerProvider extends React.Component<PlayerControllerProviderProps> {
	unsubscribe: () => void = () => {};

	// This subscription actually only does anything during the initial load, to hide the content
	// till we have an update. Then, it's all the refresh logic inside of `usePlayerController`.
	private registerSubscription() {
		this.unsubscribe = this.props.playerController.subscribe(() => {
			this.forceUpdate();
		});
	}

	componentDidMount() {
		this.registerSubscription();
	}

	componentDidUpdate(prevProps: PlayerControllerProviderProps) {
		if (prevProps.playerController !== this.props.playerController) {
			this.unsubscribe();
			this.registerSubscription();
		}
	}

	componentWillUnmount() {
		this.unsubscribe();
	}

	render() {
		const LoadingView = this.props.loadingView || ((): JSX.Element => <p>Loading...</p>);
		return !this.props.playerController.hasGameUpdate() ? (
			<LoadingView />
		) : (
			<PlayerControllerContext.Provider value={this.props.playerController}>
				{this.props.children}
			</PlayerControllerContext.Provider>
		);
	}
}

export function usePlayerController(): PlayerController {
	const playerController = useContext(PlayerControllerContext);
	if (playerController === null) throw new Error("Player Controller couldn't be found!");

	// We increment this value to force the component to refresh.
	const [, setDummyState] = useState(0);

	useEffect(() => {
		let count: number = 1;
		return playerController.subscribe(() => {
			setDummyState(count++);
		});
	}, [playerController]);

	return playerController;
}
