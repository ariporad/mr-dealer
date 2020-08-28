import createStore from '.';
import { GameState, addUser } from './game';

let store: ReturnType<typeof createStore>;
const getState = (): GameState => store.getState().game;
const dispatch = (action: any) => store.dispatch(action);

beforeEach(() => {
	store = createStore();
});

describe('Game Reducer', () => {
	it('addUser', () => {
		expect(getState().players.length).toBe(0);
		dispatch(addUser({ name: 'Ari Porad' }));
		expect(getState().players).toEqual([
			{ name: 'Ari Porad', id: 0, folded: false, bets: [], hand: null, result: null },
		]);
		dispatch(addUser({ name: 'Neb Scherzer' }));
		dispatch(addUser({ name: 'Sophie G-H' }));
		dispatch(addUser({ name: 'Beth Ginsberg' }));
		expect(getState().players).toEqual([
			{ name: 'Ari Porad', id: 0, folded: false, bets: [], hand: null, result: null },
			{ name: 'Neb Scherzer', id: 1, folded: false, bets: [], hand: null, result: null },
			{ name: 'Sophie G-H', id: 2, folded: false, bets: [], hand: null, result: null },
			{ name: 'Beth Ginsberg', id: 3, folded: false, bets: [], hand: null, result: null },
		]);
	});
});
