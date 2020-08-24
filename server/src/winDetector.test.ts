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
	2C 3H 4C 5C 6H JC QC !-> straight-flush
	2S 2D 3H 4H 5H 6H QH !-> straight-flush
`;
