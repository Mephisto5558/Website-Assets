/* eslint-disable-next-line @typescript-eslint/no-magic-numbers */
type LowNum = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type CellInput = HTMLInputElement & { type: 'number'; dataset: { group: `${number}`; row: `${number}`; col: `${number}` } };
export type Cell = HTMLTableCaptionElement & { firstChild: CellInput };
export type HTMLBoard = CellInput[][];

export type Board = LowNum[][];
export type FullBoard = Exclude<LowNum, 0>[][];

export function setRootStyle(key: string, value: string | null, priority?: string): void;
export function getRootStyle(key: string): string;
export function invertHex(hex: string): `#${string}`;
export function saveToClipboard(value: string): Promise<void>;
export function initializeColorPicker(picker: HTMLInputElement, storageKey: string, onColorChange: (color: string) => void): void;