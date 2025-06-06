/** @typedef {import('.').Board} Board */

const MAX_FULL_RETRIES = 100;
const CONSECUTIVE_RETRY_COOLDOWN_MS = 5;
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
function getEmptySudoku(size, filler) {
  return Array.from({ length: size }, () => Array.from({ length: size }, filler === undefined ? undefined : () => filler));
}

/**
 * @param {number} rowId
 * @param {number} colId
 * @param {number} boardSize
 * @returns {[number, number]} [rowId, colId] */
function getNext(rowId, colId, boardSize) {
  return colId == boardSize - 1 ? [rowId + 1, 0] : [rowId, colId + 1];
}

/**
 * @param {number} size
 * @param {number} holes
 * @param {number} retries internal use */
export async function generateSudoku(size, holes, retries = 1) {
  if (globalThis.debug && globalThis.debugBoard) return DEBUG_BOARDS;

  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) throw new Error('Size must be quadratic.');

  console.debug(`Generating initial full Sudoku. Try ${retries}/${MAX_FULL_RETRIES}`);

  /** @type {import('.').FullBoard} */
  const fullBoard = getEmptySudoku(size);
  fill(fullBoard, boxSize);

  if (!countSolutions(structuredClone(fullBoard), boxSize)) {
    let err = 'An invalid Sudoku has been generated. ';
    if (globalThis.debug) err += 'Returning the Sudoku due to being in debug mode.';
    else err += retries < MAX_FULL_RETRIES ? `Retrying ${retries + 1}/${MAX_FULL_RETRIES}` : 'Max retries reached. Not retrying.';

    console.error(err);
    console.error(JSON.stringify(fullBoard));

    if (globalThis.debug) return fullBoard;
    if (retries < MAX_FULL_RETRIES) return generateSudoku(size, holes, retries + 1);
    return getEmptySudoku(size, 0);
  }

  /** @type {Board} */
  const board = structuredClone(fullBoard);
  const maxAttempts = size ** 2 * 5; /* eslint-disable-line @typescript-eslint/no-magic-numbers -- arbitrary */
  const maxConsecutiveAttempts = size ** 2;
  const tooManySolutionsMsg = 'Sudoku has more than one possible solution. ';

  console.debug(`Starting to dig holes. Max Attempts: ${maxAttempts}`);

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
      continue;
    }
    if (success === undefined) continue;

    consecutiveAttempts++;
    if (consecutiveAttempts > maxConsecutiveAttempts) console.debug(tooManySolutionsMsg + 'Max consecutive attempts reached. Not retrying.');
    else if (attempts > maxAttempts) console.debug(tooManySolutionsMsg + 'Max attempts reached. Not retrying.');
    else {
      console.debug(tooManySolutionsMsg + `Retrying ${attempts + 1}/${maxAttempts}. Waiting 5ms`);
      await new Promise(res => setTimeout(res, CONSECUTIVE_RETRY_COOLDOWN_MS));
    }
  }

  console.debug(`Dug ${removed}/${holes} holes. Took ${attempts}/${maxAttempts} attempts (last consecutive attempts: ${consecutiveAttempts}/${maxConsecutiveAttempts}).`);
  if (globalThis.debug) {
    console.debug('Board:', JSON.stringify(board));
    console.debug('Full Board:', JSON.stringify(fullBoard));
  }

  return { fullBoard, board };
}

function dig(board, boxSize) {
  const rowId = rando(0, board.length - 1);
  const colId = rando(0, board.length - 1);
  if (!board[rowId][colId]) return;

  const puzzle = structuredClone(board);
  puzzle[rowId][colId] = 0;

  if (countSolutions(puzzle, boxSize) > 1) return false;

  board[rowId][colId] = 0;
  return true;
}

/**
 * @param {Board} board
 * @param {number} boxSize
 * @param {number} rowId
 * @param {number} colId */
function fill(board, boxSize, rowId = 0, colId = 0) {
  if (rowId > board.length - 1) return true;

  const [nextRowId, nextColId] = getNext(rowId, colId, board.length);
  for (const value of randoSequence(1, board.length)) {
    if (isUnsafe(board, boxSize, rowId, colId, value)) continue;

    board[rowId][colId] = value;
    if (fill(board, boxSize, nextRowId, nextColId)) return true;
    board[rowId][colId] = 0;
  }

  return false;
}

/**
 * @param {Board} board
 * @param {number} boxSize
 * @param {number} rowId
 * @param {number} colId */
function countSolutions(board, boxSize, rowId = 0, colId = 0) {
  if (rowId > board.length - 1) return 1;

  const [nextRowId, nextColId] = getNext(rowId, colId, board.length);
  if (board[rowId][colId]) return countSolutions(board, boxSize, nextRowId, nextColId);

  let total = 0;
  for (let val = 1; val <= board.length; val++) {
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
 * @param {HTMLSpanElement[]} numberOverviewSpans */
export function displayBoard(board, htmlBoard, numberOverviewSpans) {
  for (const cell of htmlBoard.flat()) {
    cell.value = board[Number(cell.dataset.row) - 1][Number(cell.dataset.col) - 1] || undefined;
    cell.disabled = !!cell.value;
  }

  for (const [i, amt] of getNumberAmounts(board)) {
    if (!i) continue;

    numberOverviewSpans[i - 1].textContent = amt;
    if (globalThis.fullBoardNumberAmt.get(i) == amt) numberOverviewSpans[i - 1].classList.add('complete');
  }
}