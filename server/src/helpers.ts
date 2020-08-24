// In ascending order of priority
export const RESULT_TYPES: ResultType[] = [
	'high',
	'pair',
	'two-pair',
	'three-kind',
	'straight',
	'flush',
	'full-house',
	'four-kind',
	'straight-flush',
];

export const isResultType = (maybeResultType: string): maybeResultType is ResultType =>
	RESULT_TYPES.includes(maybeResultType as ResultType);
