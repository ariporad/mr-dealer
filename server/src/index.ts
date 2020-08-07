import 'dotenv/config';
import { createServer } from 'http';
import { resolve } from 'path';
import socketIO from 'socket.io';
import express from 'express';

const WEB_BUILD_DIR = resolve(__dirname, '..', '..', 'web', 'build');

const app = express();
const server = createServer(app);
const io = socketIO(server);

app.use(express.static(WEB_BUILD_DIR));

app.get('/', function (req, res) {
	console.log('foo');
	res.sendFile(resolve(WEB_BUILD_DIR, 'index.html'));
});

io.on('connection', (socket) => {
	console.log('Socket connected');
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
