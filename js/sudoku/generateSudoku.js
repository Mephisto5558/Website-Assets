/** @typedef {import('.').Board} Board */

import { DEBUG_BOARDS } from './constants.js';
import { getGroupId } from './utils.js';

/**
 * @param {Board} board
 * @returns {Map<number, number | undefined>} */
export function getNumberAmounts(board) {
  return board.flat().reduce((acc, e) => acc.set(e, (acc.get(e) ?? 0) + 1), new Map());
}

/**
 * @param {number} size
 * @param {any} filler */
function getEmptySudoku(size, filler = 0) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => filler));
}

/**
 * @param {Board} board
 * @param {object | undefined} options
 * @param {boolean} options.findJustOne
 * @param {boolean} options.useRandomSequence */
function solver(board, { findJustOne = true, useRandomSequence = true } = {}) {
  const size = board.length;
  const boxSize = Math.sqrt(size);

  const rows = Array.from({ length: size }, () => new Set());
  const cols = Array.from({ length: size }, () => new Set());
  const boxes = Array.from({ length: size }, () => new Set());

  for (let rowId = 0; rowId < size; rowId++) {
    for (let colId = 0; colId < size; colId++) {
      const value = board[rowId][colId];
      if (value === 0) continue;

      rows[rowId].add(value);
      cols[colId].add(value);
      boxes[getGroupId(rowId, colId, boxSize)].add(value);
    }
  }

  function run(rowId = 0, colId = 0) {
    if (rowId >= size) return 1;

    const [nextRowId, nextColId] = colId === size - 1 ? [rowId + 1, 0] : [rowId, colId + 1];
    if (board[rowId][colId] !== 0) return run(nextRowId, nextColId);

    const boxId = getGroupId(rowId, colId, boxSize);
    const valuesToTry = useRandomSequence ? randoSequence(1, size) : Array.from({ length: size }, (_, i) => i + 1);

    let solutionCount = 0;

    for (const value of valuesToTry) {
      if (rows[rowId].has(value) || cols[colId].has(value) || boxes[boxId].has(value)) continue;

      board[rowId][colId] = value;
      rows[rowId].add(value);
      cols[colId].add(value);
      boxes[boxId].add(value);

      const result = run(nextRowId, nextColId);

      if (findJustOne) {
        if (result > 0) return result;
      }
      else {
        solutionCount += result;
        if (solutionCount > 1) {
          rows[rowId].delete(value);
          cols[colId].delete(value);
          boxes[boxId].delete(value);
          board[rowId][colId] = 0;

          return solutionCount;
        }
      }

      rows[rowId].delete(value);
      cols[colId].delete(value);
      boxes[boxId].delete(value);
      board[rowId][colId] = 0;
    }

    return solutionCount;
  }

  const result = run();
  return findJustOne ? result > 0 : result;
}

/**
 * @param {number} size
 * @throws {Error} on non-quadratic numbers */
export function createHTMLBoard(size) {
  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) throw new Error('Size must be quadratic.');

  console.debug(`Creating HTML board of size ${size}`);
  const sudokuTable = document.querySelector('#sudoku');
  sudokuTable.innerHTML = '';

  for (let colGroupI = 0; colGroupI < boxSize; colGroupI++) {
    const colGroup = document.createElement('colgroup');

    for (let colI = 0; colI < boxSize; colI++)
      colGroup.append(document.createElement('col'));

    sudokuTable.append(colGroup);
  }

  for (let bodyI = 0; bodyI < boxSize; bodyI++) {
    const tBody = document.createElement('tbody');

    for (let rowI = 0; rowI < boxSize; rowI++) {
      const tRow = document.createElement('tr');
      const rowId = bodyI * boxSize + rowI;

      for (let k = 0; k < size; k++) {
        const tCell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.required = true;
        input.autocomplete = 'off';

        const colId = k;
        input.dataset.row = rowId + 1;
        input.dataset.col = colId + 1;
        input.dataset.group = getGroupId(rowId, colId, boxSize) + 1;
        input.ariaLabel = `Row ${rowId + 1}, Column ${colId + 1}`;

        tCell.append(input);
        tRow.append(tCell);
      }

      tBody.append(tRow);
    }

    sudokuTable.append(tBody);
  }
}

/**
 * @param {number} size
 * @param {number} holes
 * @throws {Error} on non-quadratic numbers */
export function generateSudoku(size, holes) {
  if (globalThis.debugBoard) return DEBUG_BOARDS;

  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) throw new Error('Size must be quadratic.');

  console.debug(`Generating initial full Sudoku. Size: ${size}`);
  const start = performance.now();

  const fullBoard = getEmptySudoku(size);
  const success = solver(fullBoard, { findJustOne: true, useRandomSequence: true });

  if (!success) {
    console.error('Failed to generate a valid Sudoku board.');
    return { fullBoard: getEmptySudoku(size), board: getEmptySudoku(size) };
  }

  console.debug(`Took ${performance.now() - start}ms to generate.`);

  const board = structuredClone(fullBoard);
  const maxAttempts = size ** 2 * 3; /* eslint-disable-line @typescript-eslint/no-magic-numbers -- arbitrary */
  const maxConsecutiveAttempts = size ** 2;

  console.debug(`Starting to dig holes. Holes to dig: ${holes}`);

  let
    removed = 0,
    attempts = 0,
    consecutiveAttempts = 0;
  for (; removed < holes && attempts < maxAttempts && consecutiveAttempts < maxConsecutiveAttempts; attempts++) {
    console.debug(`Digging. Holes: ${removed}/${holes}, Attempts: ${attempts}/${maxAttempts}, Consecutive attempts: ${consecutiveAttempts}/${maxConsecutiveAttempts}`);

    const success = dig(board);
    if (success) {
      consecutiveAttempts = 0;
      removed++;
    }
    else if (success === false) consecutiveAttempts++;
  }

  console.debug(`Dug ${removed}/${holes} holes.`);

  return { fullBoard, board };
}

function dig(board) {
  const rowId = rando(0, board.length - 1);
  const colId = rando(0, board.length - 1);
  if (!board[rowId][colId]) return;

  const originalValue = board[rowId][colId];
  board[rowId][colId] = 0;

  if (solver(structuredClone(board), { findJustOne: false, useRandomSequence: false }) > 1) {
    board[rowId][colId] = originalValue;
    return false;
  }

  return true;
}

/**
 * @param {Board} board
 * @param {import('.').HTMLBoard} htmlBoard
 * @param {HTMLSpanElement[]} numberOverviewSpans
 * @param {boolean} isSolution */
export function displayBoard(board, htmlBoard, numberOverviewSpans, isSolution = false) {
  for (const cell of htmlBoard.flat()) {
    if (!isSolution) cell.classList.remove('solution');
    if (isSolution && !cell.disabled) {
      if (cell.value) cell.dataset.val = cell.value;
      cell.classList.add('solution');
    }

    cell.value = board[Number(cell.dataset.row) - 1][Number(cell.dataset.col) - 1] || Number(cell.dataset.val) || undefined;
    cell.disabled = isSolution || !!cell.value && !cell.dataset.val;

    if (!isSolution) delete cell.dataset.val;
  }

  for (const [i, amt] of getNumberAmounts(board)) {
    if (!i || !numberOverviewSpans[i - 1]) continue; // TODO: Implement dynamic overview generation

    numberOverviewSpans[i - 1].textContent = amt;
    if (globalThis.fullBoardNumberAmt.get(i) == amt) numberOverviewSpans[i - 1].classList.add('complete');
  }
}