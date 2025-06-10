/** @typedef {import('.').Board} Board */

import { getGroupId } from './utils.js';

const DEBUG_BOARDS = {
  board: [
    /* eslint-disable @typescript-eslint/no-magic-numbers */
    [6, 5, 8, 4, 2, 0, 0, 0, 0],
    [0, 2, 3, 7, 0, 0, 4, 0, 0],
    [4, 1, 7, 6, 0, 9, 0, 0, 5],
    [0, 0, 6, 8, 0, 5, 7, 4, 2],
    [0, 9, 2, 3, 0, 7, 5, 6, 1],
    [7, 4, 5, 1, 6, 2, 9, 0, 8],
    [0, 0, 1, 5, 0, 4, 2, 8, 0],
    [0, 7, 0, 9, 8, 0, 0, 5, 0],
    [5, 0, 9, 2, 0, 3, 6, 0, 4]
  ],
  fullBoard: [
    [6, 5, 8, 4, 2, 1, 3, 9, 7],
    [9, 2, 3, 7, 5, 8, 4, 1, 6],
    [4, 1, 7, 6, 3, 9, 8, 2, 5],
    [1, 3, 6, 8, 9, 5, 7, 4, 2],
    [8, 9, 2, 3, 4, 7, 5, 6, 1],
    [7, 4, 5, 1, 6, 2, 9, 3, 8],
    [3, 6, 1, 5, 7, 4, 2, 8, 9],
    [2, 7, 4, 9, 8, 6, 1, 5, 3],
    [5, 8, 9, 2, 1, 3, 6, 7, 4]
    /* eslint-enable @typescript-eslint/no-magic-numbers */
  ]
};

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
 * @param {number} size
 * @returns {boolean} */
function solve(board, size) {
  const boxSize = Math.sqrt(size);

  const rows = Array.from({ length: size }, () => new Set());
  const cols = Array.from({ length: size }, () => new Set());
  const boxes = Array.from({ length: size }, () => new Set());

  const sequences = Array.from({ length: size ** 2 });
  const sequenceIndices = Array.from({ length: size ** 2 }).fill(0);

  let i = 0;
  while (i >= 0 && i < size * size) {
    const row = Math.floor(i / size);
    const col = i % size;
    const boxId = getGroupId(row, col, boxSize);

    if (sequences[i] === undefined) {
      sequences[i] = randoSequence(1, size);
      sequenceIndices[i] = 0;
    }

    const previousValue = board[row][col];
    if (previousValue !== 0) {
      rows[row].delete(previousValue);
      cols[col].delete(previousValue);
      boxes[boxId].delete(previousValue);
    }

    let foundValidNumber = false;
    let currentIndex = sequenceIndices[i] + 1;

    while (currentIndex < size) {
      const num = sequences[i][currentIndex];

      if (!rows[row].has(num) && !cols[col].has(num) && !boxes[boxId].has(num)) {
        board[row][col] = num;
        rows[row].add(num);
        cols[col].add(num);
        boxes[boxId].add(num);

        sequenceIndices[i] = currentIndex;
        foundValidNumber = true;
        break;
      }

      currentIndex++;
    }

    if (foundValidNumber) i++;
    else {
      sequences[i] = undefined;
      board[row][col] = 0;
      i--;
    }
  }

  return i > 0;
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
  const success = solve(fullBoard, size);

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

    const success = dig(board, boxSize);
    if (success) {
      consecutiveAttempts = 0;
      removed++;
    }
    else if (success === false) consecutiveAttempts++;
  }

  console.debug(`Dug ${removed}/${holes} holes.`);

  return { fullBoard, board };
}

function dig(board, boxSize) {
  const rowId = rando(0, board.length - 1);
  const colId = rando(0, board.length - 1);
  if (!board[rowId][colId]) return;

  const originalValue = board[rowId][colId];
  board[rowId][colId] = 0;

  if (countSolutions(structuredClone(board), boxSize) > 1) {
    board[rowId][colId] = originalValue;
    return false;
  }

  return true;
}

function countSolutions(board, boxSize, rowId = 0, colId = 0) {
  const size = board.length;
  if (rowId >= size) return 1;

  let nextRowId, nextColId;
  if (rowId === size - 1 && colId === size - 1) [nextRowId, nextColId] = [rowId + 1, colId + 1];
  else [nextRowId, nextColId] = colId === size - 1 ? [rowId + 1, 0] : [rowId, colId + 1];

  if (board[rowId][colId]) return countSolutions(board, boxSize, nextRowId, nextColId);

  let total = 0;
  for (let val = 1; val <= size; val++) {
    if (isUnsafe(board, boxSize, rowId, colId, val)) continue;

    board[rowId][colId] = val;
    total += countSolutions(board, boxSize, nextRowId, nextColId);
    board[rowId][colId] = 0;

    if (total > 1) break;
  }

  return total;
}

/**
 * @param {Board} board
 * @param {number} boxSize
 * @param {number} rowId
 * @param {number} colId
 * @param {number} value
 * Check if a value is already in the same row, column or box */
function isUnsafe(board, boxSize, rowId, colId, value) {
  for (let id = 0; id < board.length; id++)
    if (board[rowId][id] === value || board[id][colId] === value) return true;

  const startRow = Math.floor(rowId / boxSize) * boxSize;
  const startCol = Math.floor(colId / boxSize) * boxSize;
  for (let row = startRow; row < startRow + boxSize; row++) {
    for (let col = startCol; col < startCol + boxSize; col++)
      if (board[row][col] === value) return true;
  }

  return false;
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
    if (!i || !numberOverviewSpans[i - 1]) continue;

    numberOverviewSpans[i - 1].textContent = amt;
    if (globalThis.fullBoardNumberAmt.get(i) == amt) numberOverviewSpans[i - 1].classList.add('complete');
  }
}