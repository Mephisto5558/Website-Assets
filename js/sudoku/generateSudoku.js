const MAX_FULL_RETRIES = 100;

/** @typedef {(1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined)[][]} Board */

export function generateSudoku(size = 9, holes = size ** 2 - 20, retry = 1) {
  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) throw new Error('Size must be quadratic.');

  console.debug(`Generating initial full Sudoku. Try ${retry}/${MAX_FULL_RETRIES}`);
  const board = Array.from({ length: size }, () => Array.from({ length: size }));
  fill(board, boxSize);

  if (!countSolutions(structuredClone(board), boxSize)) {
    console.error('An invalid Sudoku has been generated.' + (retry < MAX_FULL_RETRIES ? ` Retrying ${retry + 1}/${MAX_FULL_RETRIES}` : ' Max retry reached. Not retrying.'));

    if (globalThis.debug) {
      console.error(JSON.stringify(board));
      return board;
    }
    if (retry < MAX_FULL_RETRIES) return generateSudoku(size, holes, retry + 1);

    console.error(JSON.stringify(board));
    return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  }

  const maxAttempts = size ** 2 * 5;
  console.debug(`Starting to dig holes. Max Attempts: ${maxAttempts}`);
  for (let removed = 0, attempts = 0; removed < holes && attempts < maxAttempts; attempts++) {
    console.debug(`Digging. Holes: ${removed}/${holes}, Attempts: ${attempts}/${maxAttempts}`);

    const rowId = rando(0, size - 1);
    const colId = rando(0, size - 1);
    if (!board[rowId][colId]) continue;

    const puzzle = structuredClone(board);
    puzzle[rowId][colId] = undefined;

    const solutions = countSolutions(puzzle, boxSize);
    if (solutions > 1) {
      console.debug('Sudoku has more than one possible solution. Next attempt.');
      continue;
    }

    board[rowId][colId] = undefined;
    removed++;
  }

  return board;
}


/**
 * @param {Board} board
 * @param {number} boxSize
 * @param {number} rowId
 * @param {number} colId */
function fill(board, boxSize, rowId = 0, colId = 0) {
  if (rowId == board.length) return true;

  for (const value of randoSequence(1, board.length)) {
    if (isUnsafe(board, boxSize, rowId, colId, value)) continue;

    board[rowId][colId] = value;
    const [nextRow, nextCol] = colId + 1 == board.length ? [rowId + 1, 0] : [rowId, colId + 1];
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

  const [nextRow, nextCol] = colId + 1 === board.length ? [rowId + 1, 0] : [rowId, colId + 1];
  if (!board[rowId][colId]) return countSolutions(board, boxSize, nextRow, nextCol);

  let total = 0;
  for (let val = 1; val <= board.length; val++) {
    if (isUnsafe(board, boxSize, rowId, colId, val)) continue;

    board[rowId][colId] = val;
    const found = countSolutions(board, boxSize, nextRow, nextCol);
    board[rowId][colId] = undefined;

    total += found;
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
 * Check if a value is in a row, col or boxSize already */
function isUnsafe(board, boxSize, rowId, colId, value) {
  for (const row of board) if (row[colId] === value) return true; // check row
  for (let col = 0; col < board.length; col++) if (board[rowId][col] === value) return true; // check col

  // check box
  const startRow = Math.floor(rowId / boxSize) * boxSize;
  const startCol = Math.floor(colId / boxSize) * boxSize;
  for (let row = 0; row < boxSize; row++) {
    for (let col = 0; col < boxSize; col++)
      if (board[startRow + row][startCol + col] === value) return true;
  }

  return false;
}


/** @param {Board} board */
export function displayBoard(board) {
  for (const cell of globalThis.htmlBoard.flat()) {
    cell.value = board[Number(cell.dataset.row) - 1][Number(cell.dataset.col) - 1];
    if (board[Number(cell.dataset.row) - 1][Number(cell.dataset.col) - 1] !== undefined) cell.disabled = true;
  }
}