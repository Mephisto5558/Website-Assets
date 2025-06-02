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

document.documentElement.removeAttribute('style'); // Remove visibility: hidden

/** @type {CellInput[][]} */
globalThis.htmlBoard = [...document.querySelectorAll('#sudoku > tbody > tr')].map(e => [...e.children].map(e => e.firstChild));

function checkErrors() {
  /** @type {[CellList, CellList, CellList]} */
  const cells = globalThis.htmlBoard.flat().reduce((acc, e) => {
    for (let i = 0, types = ['group', 'col', 'row']; i < types.length; i++) {
      const id = Number(e.dataset[types[i]]) - 1;

      /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- false positive */
      acc[i][id] ??= [];
      acc[i][id].type ??= types[i];
      acc[i][id].push(e.parentElement);
    }

    return acc;
  }, [[], [], []]).flat();
  for (const elementGroup of cells) {
    const idx = Number(elementGroup[0].firstChild.dataset[elementGroup.type]) - 1;

    let parents;
    if (elementGroup.type == 'row') parents = [elementGroup[0].parentElement];
    else if (elementGroup.type == 'col') parents = [document.querySelectorAll('#sudoku > colgroup > col').item(idx)];
    else parents = document.querySelectorAll(`#sudoku > tbody > tr > td:has(input[data-group='${idx + 1}']`);

    const values = elementGroup.map(e => Number(e.firstChild.value) || undefined);
    if (values.length > new Set(values).size + (values.includes(undefined) ? values.filter(e => e == undefined).length : 0))
      for (const parent of parents) parent.classList.add('error');
    else
      for (const parent of parents) parent.classList.remove('error');
  }
}

/** @type {HTMLTableElement} */
const sudoku = document.querySelector('#sudoku');

sudoku.addEventListener('keypress', event => {
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
  const eventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'];

  if (!eventKeys.includes(event.key)) return;
  event.preventDefault();

  const boardMax = (globalThis.boardSize ?? DEFAULT_BOARD_SIZE) - 1;

  let nextCell;
  while ((!nextCell || nextCell.disabled) && !(nextCell && nextCell.dataset.row == event.target.dataset.row && nextCell.dataset.col == event.target.dataset.col)) {
    const row = Number((nextCell ?? event.target).dataset.row) - 1;
    const col = Number((nextCell ?? event.target).dataset.col) - 1;

    switch (event.key) {
      case eventKeys[0]: nextCell = globalThis.htmlBoard[row == 0 ? boardMax : row - 1][col]; break;
      case eventKeys[1]: nextCell = globalThis.htmlBoard[row == boardMax ? 0 : row + 1][col]; break;
      case eventKeys[2]: nextCell = globalThis.htmlBoard[row][col == 0 ? boardMax : col - 1]; break;
      case eventKeys[3]: nextCell = globalThis.htmlBoard[row][col == boardMax ? 0 : col + 1]; break;
      case eventKeys[4]:
        if (event.shiftKey) { // TODO: FIX
          // backwards cyclic
          if (row == 0 && col == 0) nextCell = globalThis.htmlBoard[boardMax][boardMax];
          if (row == 0) nextCell = globalThis.htmlBoard[boardMax][col - 1];
          nextCell = globalThis.htmlBoard[row - 1][boardMax];
          break;
        }

        // forwards cyclic
        if (row == boardMax && col == boardMax) nextCell = globalThis.htmlBoard[0][0];
        if (row == boardMax) nextCell = globalThis.htmlBoard[row][col + 1];
        nextCell = globalThis.htmlBoard[row + 1][col];
        break;
    }
  }

  nextCell.focus();
});

/** @type {HTMLButtonElement} */
const regenerateBtn = document.querySelector('#regenerate-btn');
regenerateBtn.addEventListener('click', () => {
  const holes = rando(MIN_HOLES, MAX_HOLES);
  console.log(`Size: ${DEFAULT_BOARD_SIZE}, Holes: ${holes}/${MAX_HOLES} (min: ${MIN_HOLES})`);
  displayBoard(generateSudoku(DEFAULT_BOARD_SIZE, holes));
  checkErrors();
});
regenerateBtn.click();