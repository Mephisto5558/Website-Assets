const MAX_FULL_RETRIES = 100;

/** @typedef {(1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined)[][]} Board */

export function generateSudoku(size = 9, holes = size ** 2 - 20, retry = 1) {
  const boxSize = Math.sqrt(size);
  if (!Number.isInteger(boxSize)) throw new Error('Size must be quadratic.');

  globalThis.boardSize = size;

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

    const row = rando(0, size - 1);
    const col = rando(0, size - 1);
    if (!board[row][col]) continue;

    const puzzle = structuredClone(board);
    puzzle[row][col] = undefined;

    const solutions = countSolutions(puzzle, boxSize);
    if (solutions > 1) {
      console.debug('Sudoku has more than one possible solution. Next attempt.');
      continue;
    }

    board[row][col] = undefined;
    removed++;
  }

  return board;
}


/**
 * @param {Board} board
 * @param {number} boxSize
 * @param {number} row
 * @param {number} col */
function fill(board, boxSize, row = 0, col = 0) {
  if (row == boardSize) return true;

  for (const value of randoSequence(1, boardSize)) {
    if (isUnsafe(board, boxSize, row, col, value)) continue;

    board[row][col] = value;
    const [nextRow, nextCol] = col + 1 == boardSize ? [row + 1, 0] : [row, col + 1];
    if (fill(board, boxSize, nextRow, nextCol)) return true;
    board[row][col] = undefined;
  }

  return false;
}

/**
 * @param {Board} board
 * @param {number} boxSize
 * @param {number} row
 * @param {number} col */
function countSolutions(board, boxSize, row = 0, col = 0) {
  if (row === boardSize) return 1;

  const [nextRow, nextCol] = col + 1 === boardSize ? [row + 1, 0] : [row, col + 1];
  if (!board[row][col]) return countSolutions(board, boxSize, nextRow, nextCol);

  let total = 0;
  for (let val = 1; val <= boardSize; val++) {
    if (isUnsafe(board, boxSize, row, col, val)) continue;

    board[row][col] = val;
    const found = countSolutions(board, boxSize, nextRow, nextCol);
    board[row][col] = undefined;

    total += found;
    if (total > 1) break;
  }

  return total;
}

/**
 * @param {Board} board
 * @param {number} boxSize
 * @param {number} row
 * @param {number} col
 * @param {number} value
 * Check if a value is in a row, col or boxSize already */
function isUnsafe(board, boxSize, row, col, value) {
  for (let r = 0; r < boardSize; r++) if (board[r][col] === value) return true; // check row
  for (let c = 0; c < boardSize; c++) if (board[row][c] === value) return true; // check col

  // check box
  const startRow = Math.floor(row / boxSize) * boxSize;
  const startCol = Math.floor(col / boxSize) * boxSize;
  for (let r = 0; r < boxSize; r++) {
    for (let c = 0; c < boxSize; c++)
      if (board[startRow + r][startCol + c] === value) return true;
  }

  return false;
}


/** @param {Board} board */
export function displayBoard(board) {
  for (const cell of htmlBoard.flat()) {
    cell.value = board[Number(cell.dataset.row) - 1][Number(cell.dataset.col) - 1];
    if (board[Number(cell.dataset.row) - 1][Number(cell.dataset.col) - 1] !== undefined) cell.disabled = true;
  }
}