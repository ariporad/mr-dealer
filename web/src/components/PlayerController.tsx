import io from 'socket.io-client';
import React, { createContext, useContext, useState, useEffect } from 'react';

// HACK: Enums don't work in shared.d.ts, so keep this in sync with the server's version.
export enum GameStatus {
	PRESTART = 0,
	PREFLOP = 1,
	FLOP = 2,
	TURN = 3,
	RIVER = 4,
	ENDED = 5,
}

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
}

export function createPlayerController({ name, gameId, isHost }: PlayerControllerOptions) {
	if (!gameId && !isHost) {
		throw new Error('PlayerController must provide either a gameId or be a host');
	}

	const socket = io();
	let gameUpdate: GameUpdate | null;
	let subscriptions: (() => void)[] = [];

	socket.on('update', (update: GameUpdate) => {
		gameUpdate = update;
		subscriptions.forEach((sub) => sub());
	});

	if (isHost) {
		socket.emit('create-game', { name });
	} else {
		socket.emit('join-game', { name, gameId });
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
			socket.emit('start-game');
		},

		sendBet(amount: number) {
			socket.emit('advance', { amount, fold: false });
		},

		sendFold() {
			socket.emit('advance', { amount: 0, fold: true });
		},

		isHost() {
			return this.getGameUpdate().id === 0;
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
	}, []);

	return playerController;
}
