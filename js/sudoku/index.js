/* NOT FOR PROD*/

/** @typedef {import('.').CellInput} CellInput */
/** @typedef {import('.').CellList} CellList */

import { displayBoard, generateSudoku } from './generateSudoku.js';

globalThis.debug = true;
const DEFAULT_BOARD_SIZE = 9;
const MS_IN_SEC = 1000;
const SEC_IN_MIN = 60;

// min 20%, max 90%
const MIN_HOLES = Math.floor(DEFAULT_BOARD_SIZE ** 2 * .2);
const MAX_HOLES = Math.ceil(DEFAULT_BOARD_SIZE ** 2 * .9);

document.documentElement.removeAttribute('style'); // remove temp background-color

/** @type {CellInput[][]} */
globalThis.htmlBoard = [...document.querySelectorAll('#sudoku > tbody > tr')].map(e => [...e.children].map(e => e.firstChild));

function checkErrors() {
  /** @type {[CellList, CellList, CellList]} */
  const cells = globalThis.htmlBoard.flat().reduce((acc, e) => {
    for (let i = 0, types = ['group', 'col', 'row']; i < types.length; i++) {
      const id = Number(e.dataset[types[i]]) - 1;

      /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- false positive */
      acc[i][id] ??= [];
      acc[i][id].type = types[i];
      acc[i][id].push(e.parentElement);
    }

    return acc;
  }, [[], [], []]).flat();

  const errorCells = new Set();
  for (const elementGroup of cells) {
    const elements = [...document.querySelectorAll(`#sudoku > tbody > tr > td > input[data-${elementGroup.type}='${elementGroup[0].firstChild.dataset[elementGroup.type]}']`)];
    const values = elements.map(e => Number(e.value)).filter(Boolean);

    if (values.length > new Set(values).size)
      for (const element of elements) errorCells.add(JSON.stringify(element.dataset));
  }

  for (const cell of globalThis.htmlBoard.flat()) {
    if (errorCells.has(JSON.stringify(cell.dataset))) cell.parentElement.classList.add('error');
    else cell.parentElement.classList.remove('error');
  }
}

/** @type {HTMLTableElement} */
const sudoku = document.querySelector('#sudoku');

sudoku.addEventListener('keypress', event => {
  if (event.key == event.target.value) return event.preventDefault();
  if (event.key == ' ') {
    event.target.value = '';
    checkErrors();
  }
  if (!/[1-9]/.test(event.key)) return event.preventDefault();

  if (!globalThis.timerInterval) {
    const timer = document.querySelector('#timer');
    const start = performance.now();

    globalThis.timerInterval = setInterval(() => {
      const secs = (performance.now() - start) / MS_IN_SEC;
      timer.textContent = `${String(Math.floor(secs / SEC_IN_MIN)).padStart(2, '0')}:${String(Math.round(secs % SEC_IN_MIN)).padStart(2, '0')}`;
    }, MS_IN_SEC);
  }

  event.preventDefault();
  event.target.value = event.key;

  checkErrors();
});

sudoku.addEventListener('keydown', event => {
  if (event.key == 'Backspace') {
    event.target.value = '';
    checkErrors();
    return event.preventDefault();
  }

  const eventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];

  if (!eventKeys.includes(event.key)) return;
  event.preventDefault();

  const boardMax = globalThis.htmlBoard.length - 1;

  let nextCell;
  while ((!nextCell || nextCell.disabled) && !(nextCell && nextCell.dataset.row == event.target.dataset.row && nextCell.dataset.col == event.target.dataset.col)) {
    const rowId = Number((nextCell ?? event.target).dataset.row) - 1;
    const colId = Number((nextCell ?? event.target).dataset.col) - 1;

    switch (event.key) {
      case eventKeys[0]: nextCell = globalThis.htmlBoard[rowId == 0 ? boardMax : rowId - 1][colId]; break;
      case eventKeys[1]: nextCell = globalThis.htmlBoard[rowId == boardMax ? 0 : rowId + 1][colId]; break;
      case eventKeys[2]: nextCell = globalThis.htmlBoard[rowId][colId == 0 ? boardMax : colId - 1]; break;
      case eventKeys[3]: nextCell = globalThis.htmlBoard[rowId][colId == boardMax ? 0 : colId + 1]; break;
      case eventKeys[4]:
        if (event.shiftKey) {
          // backwards cyclic
          if (rowId === 0 && colId === 0) nextCell = globalThis.htmlBoard[boardMax][boardMax];
          else if (colId > 0) nextCell = globalThis.htmlBoard[rowId][colId - 1];
          else nextCell = globalThis.htmlBoard[rowId - 1][boardMax];
          break;
        }

        // forwards cyclic
        if (rowId == boardMax && colId == boardMax) nextCell = globalThis.htmlBoard[0][0];
        else if (rowId == boardMax) nextCell = globalThis.htmlBoard[rowId][colId + 1];
        else nextCell = globalThis.htmlBoard[rowId + 1][colId];
        break;
    }
  }

  nextCell.focus();
});

const loadingContainer = document.querySelector('#loading-container');

/** @type {HTMLButtonElement} */
const regenerateBtn = document.querySelector('#regenerate-btn');
regenerateBtn.addEventListener('click', () => {
  sudoku.parentElement.style.setProperty('visibility', 'hidden');
  loadingContainer.style.removeProperty('display');

  const start = performance.now();
  const holes = rando(MIN_HOLES, MAX_HOLES);

  console.log(`Size: ${DEFAULT_BOARD_SIZE}, Holes: ${holes}/${MAX_HOLES} (min: ${MIN_HOLES})`);
  displayBoard(generateSudoku(DEFAULT_BOARD_SIZE, holes));
  checkErrors();

  console.debug(`Took ${performance.now() - start}ms to generate and render.`);

  loadingContainer.style.setProperty('display', 'none');
  sudoku.parentElement.style.removeProperty('visibility');
});
regenerateBtn.click();