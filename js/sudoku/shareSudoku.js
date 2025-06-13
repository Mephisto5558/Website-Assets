/** @typedef {import('.').FullBoard} FullBoard */
/** @typedef {import('.').Board} Board */

import { updateMinMax } from './utils.js';
import { difficultySlider, sizeOption } from './constants.js';

const BASE = 62n;
const BASE_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Converts a BigInt to a Base62 string.
 * @param {bigint} num */
function bigIntToBase62(num) {
  if (num === 0n) return '0';

  let str = '';
  for (;num > 0n; num /= BASE) str = BASE_ALPHABET[Number(num % BASE)] + str;

  return str;
}

/**
 * Converts a Base62 string back to a BigInt.
 * @param {string} base62 */
function base62ToBigInt(base62) {
  return [...base62].reduce((acc, e) => acc * BASE + BigInt(BASE_ALPHABET.indexOf(e)), 0n);
}

/**
 * @param {Board} board
 * @param {FullBoard} fullBoard */
export function generateShareURL(board, fullBoard) {
  const dimension = BigInt(board.length);
  const base = dimension + 1n;

  let solutionBigInt = 0n;
  for (const num of fullBoard.flat())
    solutionBigInt = solutionBigInt * base + BigInt(num);

  const data = {
    /* eslint-disable id-length */
    s: solutionBigInt,
    m: BigInt('0b' + board.flat().map(cell => cell ? '1' : '0').join('')),
    d: dimension
    /* eslint-enable id-length */
  };

  const url = new URL(globalThis.location.href);
  for (const [k, v] of Object.entries(data)) url.searchParams.set(k, bigIntToBase62(v));

  return url.toString();
}

/** @returns {{ fullBoard: FullBoard, board: Board } | undefined} */
export function loadFromShareURL() {
  const params = new URLSearchParams(globalThis.location.search);
  const compressedDimension = params.get('d');
  const compressedSolution = params.get('s');
  const compressedMask = params.get('m');

  if (!compressedSolution || !compressedMask || !compressedDimension) return;

  try {
    const dimension = Number(base62ToBigInt(compressedDimension));
    const totalCells = dimension * dimension;
    const base = BigInt(dimension + 1);

    const maskString = base62ToBigInt(compressedMask).toString(2).padStart(totalCells, '0');

    sizeOption.value = Math.sqrt(dimension);
    difficultySlider.value = [...maskString].filter(e => e == 0).length;

    updateMinMax();

    let solutionBigInt = base62ToBigInt(compressedSolution);
    const solutionNumbers = [];
    for (let i = 0; i < totalCells; i++) {
      const remainder = solutionBigInt % base;
      solutionNumbers.push(Number(remainder));
      solutionBigInt /= base;
    }

    solutionNumbers.reverse();

    const board = [];
    const fullBoard = [];
    for (let rowId = 0; rowId < dimension; rowId++) {
      const boardRow = [];
      const fullBoardRow = [];

      for (let colId = 0; colId < dimension; colId++) {
        const i = rowId * dimension + colId;
        const solutionDigit = solutionNumbers[i];

        fullBoardRow.push(solutionDigit);
        boardRow.push(maskString[i] === '1' ? solutionDigit : 0);
      }

      board.push(boardRow);
      fullBoard.push(fullBoardRow);
    }

    if (board.length !== dimension || fullBoard.length !== dimension)
      throw new Error(`Failed to construct board of size ${dimension}.`);

    return { fullBoard, board };
  }
  catch (err) {
    console.error('Failed to parse shared Sudoku URL:', err);
    globalThis.history.replaceState({}, '', globalThis.location.pathname);
    return;
  }
}