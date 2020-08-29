import React, { useState } from 'react';
import { usePlayerController } from './PlayerController';
import Card, { CardContainer } from './Card';

export default function PlayView() {
	const playerController = usePlayerController();
	const gameUpdate = playerController.getGameUpdate();

	const [bet, setBet] = useState<string>('');

	return (
		<>
			{gameUpdate.hand && <CardContainer cards={gameUpdate.hand} />}
			{gameUpdate.table.length > 0 && (
				<>
					<hr />
					<CardContainer cards={gameUpdate.table} />
				</>
			)}
			<hr />
			<p>Game Status: {gameUpdate.status}</p>
			<p>Current Player: {gameUpdate.currentPlayer}</p>
			{gameUpdate.winners && <p>Winners: {gameUpdate.winners.join(', ')}</p>}
			<p>
				<h3>Players:</h3>
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Name</th>
							<th>Folded?</th>
							<th>Ante</th>
							<th>Pre</th>
							<th>Flop</th>
							<th>Turn</th>
							<th>River</th>
							<th>Result</th>
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
									backgroundColor: gameUpdate.winners?.includes(player.id)
										? 'rgba(0, 255, 0, 0.2)'
										: gameUpdate.players[player.id].folded
										? 'rgba(255,0,0,.2)'
										: 'rgba(0,0,0,0)',
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
								<td>
									{player.result ? (
										<>
											{`${player.result.type}(${player.result.priority}): `}
											<CardContainer cards={player.result.cards} />
										</>
									) : (
										'None'
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</p>
			<br />
			<p>
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
						const amount = bet.trim() === '' ? 0 : parseInt(bet.trim(), 10);
						if (isNaN(amount)) {
							alert(`Invalid Bet! Must be a number! You said: "${bet}"!`);
							return;
						}

						playerController.sendBet(amount);
					}}
				/>
				<input type="button" value="Fold" onClick={playerController.sendFold} />
			</p>
		</>
	);
}
