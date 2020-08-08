import io from 'socket.io-client';
declare const global: any;

global.sockets = [];

export default function createSocket(): ReturnType<typeof io> {
	const socket = io();

	// For debugging
	global.sockets.push(socket);

	return socket;
}
