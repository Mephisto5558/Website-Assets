export type CellInput = HTMLInputElement & { type: 'number'; dataset: { group: string; row: string; col: string } };
export type Cell = HTMLTableCaptionElement & { firstChild: CellInput };
export type CellList = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell] & { type: 'group' | 'col' | 'row' };