import { desc } from './_test_helpers';

desc('Straight')`
	2H 3H 4H 5C 6H JH JD -> straight(6H): 2H 3H 4H 5C 6H
	3D 3H 6D 4C 5D AD 2D -> straight(6D): 2D 3D 4C 5D 6D
	2H 3D 4S 5S 6C JD 8C -> straight(6C): 2H 3D 4S 5S 6C
	2H 3D 4S 5S QC JD 8C !-> straight
	3H 3D 3C 3S 4H 5H 6H !-> straight
	2H 3D 5H 6D 7H 9H 8H -> straight(9H): 5H 6D 7H 9H 8H

	# High/Low Ace:
	0H JC QH KH AD 3C 4H -> straight(AD): 0H JC QH KH AD
	AD 2H 3C 4H 5D 9H 9D -> straight(5D): AD 2H 3C 4H 5D
	AH AD 4H 5H 6H 7H 8D -> straight(8D): 4H 5H 6H 7H 8D
`;

desc('Flush')`
	2C 2H 4H 7D 5H JH 9H -> flush(759106): 2H 4H 5H JH 9H
	2C 3H 4H 7D 5H JH 9H -> flush(759107): 3H 4H 5H JH 9H
	2H 2C 2D 2S 3S 4S 5S !-> flush
`;

desc('Straight Flush')`
	2C 3C 4C 5C 6C 3H 3S -> straight-flush(6C): 2C 3C 4C 5C 6C
	2C 3C 4C 5C 6C 7C 8H -> straight-flush: 3C 4C 5C 6C 7C

	2C 3H 4C 5C 6H JC QC !-> straight-flush

	# Multiple suits for a card that makes a straight, but neither are part of the flush
	2S 2D 3H 4H 5H 6H QH !-> straight-flush
`;

desc('Pairs')`
	7H 7C 7D 7S 8C JS 2S -> four-kind: 7H 7C 7D 7S JS
	QH QC QD QS KS 3H 9D -> four-kind: QH QC QD QS KS

	7H 7C 7D 8S 8C JS 2S -> full-house: 7H 7C 7D 8S 8C
	QH QC QD KS KD 3H 9D -> full-house: QH QC QD KS KD

	7H 7C 7D 4S 8C JS 2S -> three-kind: 7H 7C 7D JS 8C
	QH QC QD 4S KS 3H 9D -> three-kind: QH QC QD KS 9D

	2C 2D 4S 5C 6D 9D JH -> pair: 2C 2D JH 9D 6D
	QH QS 9H 4D 2S 6C JH -> pair: QH QS JH 9H 6C

	KH KD 3H 3S 4D 7C 9H -> two-pair: KH KD 3H 3S 9H
	4H 4C 5S 5D 6D 7H 0C -> two-pair: 5S 5D 4H 4C 0C
`;
