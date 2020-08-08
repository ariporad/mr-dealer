import React from 'react';
import { CardSuit } from '../types';

export interface CardProps {
	value: number;
}

export default function Card({ value }: CardProps) {
	let suit = '?';
	let isRed = value & (CardSuit.HEART | CardSuit.DIAMOND);

	if (value & CardSuit.CLUB) suit = '♣';
	if (value & CardSuit.SPADE) suit = '♠';
	if (value & CardSuit.HEART) suit = '♥';
	if (value & CardSuit.DIAMOND) suit = '♦';

	let val = (value >> 4).toString(10);

	if (val === '11') val = 'J';
	if (val === '12') val = 'Q';
	if (val === '13') val = 'K';
	if (val === '14') val = 'A';

	return (
		<span className={`card ${isRed ? 'card-red' : 'card-black'}`}>
			{suit}
			{val}
		</span>
	);
}

interface CardContainerProps {
	cards: number[];
}

export function CardContainer({ cards }: CardContainerProps) {
	return (
		<div>
			{cards.map((card) => (
				<Card value={card} key={card} />
			))}
		</div>
	);
}
