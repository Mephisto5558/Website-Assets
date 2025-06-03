const MAX_FULL_RETRIES = 100;

/** @typedef {(1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined)[][]} Board */

export async function generateSudoku(size = 9, holes = size ** 2 - 20, retry = 1) {
  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) throw new Error('Size must be quadratic.');

  if (globalThis.debug && globalThis.debugBoard) {
    return {
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
      ].map(e => e.map(e => e || undefined)),
      fullBoard: [
        [6, 5, 8, 4, 2, 1, 3, 9, 7],
        [9, 2, 3, 7, 5, 8, 4, 1, 6],
        [4, 1, 7, 6, 3, 9, 8, 2, 5],
        [1, 3, 6, 8, 9, 5, 7, 4, 2],
        [8, 9, 2, 3, 0, 7, 5, 6, 1],
        [7, 4, 5, 1, 6, 2, 9, 3, 8],
        [3, 6, 1, 5, 7, 4, 2, 8, 9],
        [2, 7, 4, 9, 8, 6, 1, 5, 3],
        [5, 8, 9, 2, 1, 3, 6, 7, 4]
        /* eslint-enable @typescript-eslint/no-magic-numbers */
      ]
    };
  }

  console.debug(`Generating initial full Sudoku. Try ${retry}/${MAX_FULL_RETRIES}`);
  const fullBoard = Array.from({ length: size }, () => Array.from({ length: size }));
  fill(fullBoard, boxSize);

  if (!countSolutions(structuredClone(fullBoard), boxSize)) {
    console.error('An invalid Sudoku has been generated. ' + (retry < MAX_FULL_RETRIES ? `Retrying ${retry + 1}/${MAX_FULL_RETRIES}` : 'Max retry reached. Not retrying.'));

    if (globalThis.debug) {
      console.error(JSON.stringify(fullBoard));
      return fullBoard;
    }
    if (retry < MAX_FULL_RETRIES) return generateSudoku(size, holes, retry + 1);

    console.error(JSON.stringify(fullBoard));
    return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  }

  const board = structuredClone(fullBoard);
  const maxAttempts = size ** 2 * 5;
  const maxConsecutiveAttempt = size ** 2;
  console.debug(`Starting to dig holes. Max Attempts: ${maxAttempts}`);

  let
    removed = 0,
    attempts = 0,
    consecutiveAttempt = 0;
  for (let wait; removed < holes && attempts < maxAttempts && consecutiveAttempt < maxConsecutiveAttempt; attempts++) {
    console.debug(`Digging. Holes: ${removed}/${holes}, Attempts: ${attempts}/${maxAttempts}, Consecutive attempts: ${consecutiveAttempt}/${maxConsecutiveAttempt}`);

    const rowId = rando(0, size - 1);
    const colId = rando(0, size - 1);
    if (!board[rowId][colId]) continue;

    const puzzle = structuredClone(board);
    puzzle[rowId][colId] = undefined;

    const solutions = countSolutions(puzzle, boxSize);
    if (solutions > 1) {
      consecutiveAttempt++;
      let logMsg = 'Sudoku has more than one possible solution. ';
      if (consecutiveAttempt > maxConsecutiveAttempt) logMsg += 'Max consecutive attempts reached. Not retrying.';
      else if (attempts > maxAttempts) logMsg += 'Max attempts reached. Not retrying.';
      else {
        logMsg += `Retrying ${attempts + 1}/${maxAttempts}`;
        wait = new Promise(res => setTimeout(res, 10)); // Wait 10ms
      }

      console.debug(logMsg);

      await wait;
      continue;
    }

    board[rowId][colId] = undefined;
    removed++;
  }
  console.debug(`Dug ${removed}/${holes} holes. Took ${attempts}/${maxAttempts} attemepts (last consecutive attempts: ${consecutiveAttempt}/${maxConsecutiveAttempt}).`);

  return { fullBoard, board };
}


/**
 * @param {Board} board
 * @param {number} boxSize
 * @param {number} rowId
 * @param {number} colId */
function fill(board, boxSize, rowId = 0, colId = 0) {
  if (rowId == board.length - 1) return true;

  for (const value of randoSequence(1, board.length)) {
    if (isUnsafe(board, boxSize, rowId, colId, value)) continue;

    board[rowId][colId] = value;
    const [nextRow, nextCol] = colId == board.length - 1 ? [rowId + 1, 0] : [rowId, colId + 1];
    if (fill(board, boxSize, nextRow, nextCol)) return true;
    board[rowId][colId] = undefined;
  }

  return false;
}

/**
 * @param {Board} board
 * @param {number} boxSize
 * @param {number} rowId
 * @param {number} colId */
function countSolutions(board, boxSize, rowId = 0, colId = 0) {
  if (rowId === board.length) return 1;

  const [nextRowId, nextColId] = colId === board.length - 1 ? [rowId + 1, 0] : [rowId, colId + 1];
  if (board[rowId][colId]) return countSolutions(board, boxSize, nextRowId, nextColId);

  let total = 0;
  for (let val = 1; val <= board.length; val++) {
    if (isUnsafe(board, boxSize, rowId, colId, val)) continue;

    board[rowId][colId] = val;
    total += countSolutions(board, boxSize, nextRowId, nextColId);
    board[rowId][colId] = undefined;

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
 * Check if a value is in the same row, column or box already */
function isUnsafe(board, boxSize, rowId, colId, value) {
  for (let idx = 0; idx < board.length; idx++)
    if (board[rowId][idx] === value || board[idx][colId] === value) return true;

  const startRow = Math.floor(rowId / boxSize) * boxSize;
  const startCol = Math.floor(colId / boxSize) * boxSize;
  for (let row = 0; row < boxSize; row++) {
    for (let col = 0; col < boxSize; col++)
      if (board[startRow + row][startCol + col] === value) return true;
  }

  return false;
}

/** @param {Board} board */
export function getNumberAmounts(board) {
  return board.flat(2).reduce((acc, e) => acc.set(e, (acc.get(e) ?? 0) + 1), new Map());
}

/** @type {HTMLSpanElement[]} */
const numberOverviewSpans = document.querySelectorAll('#number-overview > tbody > tr > td > span');

/** @param {Board} board */
export function displayBoard(board) {
  for (const cell of globalThis.htmlBoard.flat()) {
    cell.value = board[Number(cell.dataset.row) - 1][Number(cell.dataset.col) - 1];
    cell.disabled = !!board[Number(cell.dataset.row) - 1][Number(cell.dataset.col) - 1];
  }

  for (const [i, amt] of getNumberAmounts(board)) if (i) numberOverviewSpans[i - 1].textContent = amt;
}