import { configureStore, combineReducers } from '@reduxjs/toolkit';
import gameReducer, { name as gameSlice } from './game';

const rootReducer = combineReducers({
	[gameSlice]: gameReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default function createStore() {
	const store = configureStore({
		reducer: rootReducer,
		devTools: false,
	});

	return store;
}
