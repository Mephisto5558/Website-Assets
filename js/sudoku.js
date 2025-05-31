/* NOT FOR PROD*/

document.querySelector('#sudoku').addEventListener('keypress', event => {
  if (event.key == ' ') event.target.value = '';
  if (!/[1-9]/.test(event.key)) return event.preventDefault();

  if (event.target.value) {
    event.preventDefault();
    event.target.value = event.key;
  }
});

document.documentElement.removeAttribute('style');


/** @typedef {HTMLTableCaptionElement & { firstChild: HTMLInputElement & { dataset: { group: string, col: string }, type: 'number' }}}Cell */
/** @typedef {[Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, type: 'group' | 'col' | 'row']}CellList */

/** @type {[CellList, CellList, CellList]} */
const cells = [...document.querySelectorAll('#sudoku > tbody > tr > td')].reduce((acc, e) => {
  for (let i = 0, x = ['group', 'col', 'row']; i < x.length; i++) {
    const id = Number(e.firstChild.dataset[x[i]]) - 1;

    acc[i][id] ??= [];
    acc[i][id].type ??= x[i];
    acc[i][id].push(e);
  }

  return acc;
}, [[], [], []]).flat();

function checkErrors() {
  for (const elementGroup of cells) {
    const idx = elementGroup[0].firstChild.dataset[elementGroup.type] - 1;
    const parents = elementGroup.type == 'row' || elementGroup.type == 'col'
      ? [document.querySelectorAll('#sudoku > tbody > tr').item(idx)]
      : document.querySelectorAll(`#sudoku > tbody > tr > td:has(input[data-group='${idx + 1}']`);

    const values = elementGroup.map(e => Number(e.firstChild.value) || undefined);
    if (!values.includes(undefined) && values.length > new Set(values).size)
      for (const parent of parents) parent.classList.add('error');
    else for (const parent of parents) parent.classList.remove('error');
  }
}

globalThis.checkWinInterval = setInterval(checkErrors, 1000);

function generateSudoku(size = 9, difficulty = 40) {
  const box = Math.sqrt(size);
  if (!Number.isInteger(box)) throw new Error('Size must be quadratic.');

  globalThis.boardSize = size;

  const board = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  fill(board, box);

  const puzzle = board.map(row => [...row]); // deep clone

  let removed = 0,
    attempts = 0;
  while (removed < difficulty && attempts++ < size * size * 5) {
    const row = rando(0, size - 1);
    const col = rando(0, size - 1);
    if (puzzle[row][col] === 0) continue;

    const tmp = puzzle[row][col];
    puzzle[row][col] = 0;

    let count = 0;
    solve(puzzle.map(r => [...r]), box, () => ++count > 1);
    if (count == 1) removed++;
    else puzzle[row][col] = tmp;
  }


  displayBoard(puzzle);
}

/**
 * @param {number[][]} board
 * @param {number} box */
function fill(board, box, row = 0, col = 0) {
  if (row == boardSize) return true;

  for (const value of randoSequence(1, boardSize)) {
    if (isUnsafe(board, box, row, col, value)) continue;

    board[row][col] = value;
    const [nextRow, nextCol] = col + 1 == boardSize ? [row + 1, 0] : [row, col + 1];
    if (fill(board, box, nextRow, nextCol)) return true;
    board[row][col] = 0;
  }

  return false;
}

/**
 * @param {number[][]} board
 * @param {number} box
 * @param {undefined | () => boolean} stop */
function solve(board, box, stop, row = 0, col = 0) {
  if (row == boardSize) return true;

  const [nextRow, nextCol] = col + 1 == boardSize ? [row + 1, 0] : [row, col + 1];
  if (board[row][col]) return solve(board, box, stop, nextRow, nextCol);

  for (let value = 1; value <= boardSize; value++) {
    if (isUnsafe(board, box, row, col, value)) continue;

    board[row][col] = value;

    if (solve(board, box, stop, nextRow, nextCol) && stop?.()) return true; // cancel if multiple solutions

    board[row][col] = 0;
  }

  return false;
}

/**
 * @param {number[][]} board
 * @param {number} box
 * @param {number} row
 * @param {number} col
 * @param {number} value */
function isUnsafe(board, box, row, col, value) {
  for (let i = 0; i < boardSize; i++) {
    if (board[row][i] == value || board[i][col] == value) return true;

    const blockRow = box * Math.floor(row / box) + Math.floor(i / box);
    const blockCol = box * Math.floor(col / box) + i % box;
    if (board[blockRow][blockCol] == value) return true;
  }

  return false;
}

/** @type {HTMLInputElement[][]} */
const htmlBoard = [...document.querySelectorAll('#sudoku > tbody > tr')].map(e => [...e.children].map(e => e.firstChild));

/** @param {number[][]} board */
function displayBoard(board) {
  for (const cell of htmlBoard.flat()) {
    if (!board[cell.dataset.row - 1][cell.dataset.col - 1]) continue;

    cell.value = board[cell.dataset.row - 1][cell.dataset.col - 1];
    cell.disabled = true;
  }
}

generateSudoku();

document.querySelector('#sudoku').addEventListener('keydown', event => {
  const eventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];

  function getNeighborCell(row = 0, col = 0) {
    let nextCell;
    switch (event.key) {
      case eventKeys[0]:
        nextCell = htmlBoard[row == 0 ? boardSize - 1 : row - 1][col];
        break;
      case eventKeys[1]:
        nextCell = htmlBoard[row == boardSize - 1 ? 0 : row + 1][col];
        break;
      case eventKeys[2]:
        nextCell = htmlBoard[row][col == 0 ? boardSize - 1 : col - 1];
        break;
      case eventKeys[3]:
        nextCell = htmlBoard[row][col == boardSize - 1 ? 0 : col + 1];
        break;
      case eventKeys[4]:
        if (event.shiftKey) { // TODO: FIX
        // backwards cyclic
          if (col == 0 && row == 0) nextCell = htmlBoard[boardSize - 1][boardSize - 1];
          else if (col == 0) nextCell = htmlBoard[row - 1][boardSize - 1];
          else nextCell = htmlBoard[boardSize - 1][col - 1];

          break;
        }

        // forwards cyclic
        if (col == boardSize - 1 && row == boardSize - 1)
          nextCell = htmlBoard[0][0];
        else if (col == boardSize - 1)
          nextCell = htmlBoard[row + 1][0];
        else
          nextCell = htmlBoard[row][col + 1];
        break;
    }

    return nextCell;
  }

  if (!eventKeys.includes(event.key)) return;
  event.preventDefault();

  let nextCell = getNeighborCell(Number(event.target.dataset.row) - 1, Number(event.target.dataset.col) - 1);
  while (nextCell.disabled) {
    nextCell = getNeighborCell(Number(nextCell.dataset.row) - 1, Number(nextCell.dataset.col) - 1);
    if (nextCell.dataset.row == event.target.dataset.row && nextCell.dataset.col == event.target.dataset.col) break;
  }

  nextCell?.focus();
});