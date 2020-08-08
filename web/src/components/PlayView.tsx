import React, { useState } from 'react';
import { usePlayerController } from './PlayerController';

export default function PlayView() {
	const playerController = usePlayerController();
	const gameUpdate = playerController.getGameUpdate();

	const [bet, setBet] = useState<string>('');

	return (
		<ul>
			<li>Game Status: {gameUpdate.status}</li>
			<li>
				{gameUpdate.currentPlayer === gameUpdate.id && '(Your Turn) '}
				[#{gameUpdate.id}]: {gameUpdate.hand[0]} {gameUpdate.hand[1]}
			</li>
			<li>Table: {gameUpdate.table.join(' ')} </li>
			<li>Current Player: {gameUpdate.currentPlayer}</li>
			<li>
				<h3>Players:</h3>
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Name</th>
							<th>Folded?</th>
							<th>Ante</th>
							<th>Pre-Flop</th>
							<th>Flop</th>
							<th>Turn</th>
							<th>River</th>
						</tr>
					</thead>
					<tbody>
						{gameUpdate.players.map((player) => (
							<tr
								key={player.id}
								style={{
									fontWeight:
										gameUpdate.currentPlayer === player.id ? 'bold' : 'normal',
									textDecoration: player.folded ? 'line-through' : 'none',
									fontStyle: gameUpdate.id === player.id ? 'italic' : 'normal',
								}}
							>
								<td>{player.id}</td>
								<td>{player.name}</td>
								<td>{player.folded ? 'Y' : 'N'}</td>
								<td>${player.bets[0]}</td>
								<td>${player.bets[1]}</td>
								<td>${player.bets[2]}</td>
								<td>${player.bets[3]}</td>
								<td>${player.bets[4]}</td>
							</tr>
						))}
					</tbody>
				</table>
			</li>
			<li>
				<label htmlFor="betAmount">Bet:</label>
				<input
					type="number"
					name="betAmount"
					value={bet}
					onChange={(e) => setBet(e.target.value)}
				/>
				<input
					type="button"
					value="Bet"
					onClick={() => {
						const amount = parseInt(bet.trim(), 10);
						if (isNaN(amount)) {
							alert(`Invalid Bet! Must be a number! You said: "${bet}"!`);
							return;
						}

						playerController.sendBet(amount);
					}}
				/>
				<input type="button" value="Fold" onClick={playerController.sendFold} />
			</li>
		</ul>
	);
}