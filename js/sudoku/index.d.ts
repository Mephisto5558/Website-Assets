export type CellInput = HTMLInputElement & { type: 'number'; dataset: { group: string; row: string; col: string } };
export type Cell = HTMLTableCaptionElement & { firstChild: CellInput };
export type CellList = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell] & { type: 'group' | 'col' | 'row' };
/* eslint-disable sonarjs/max-union-size, @typescript-eslint/no-magic-numbers */
export type Board = (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined)[][];
export type FullBoard = (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[][];
/* eslint-enable sonarjs/max-union-size, @typescript-eslint/no-magic-numbers */