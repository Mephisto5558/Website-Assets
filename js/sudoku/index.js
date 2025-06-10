/** @typedef {import('.').CellInput} CellInput */
/** @typedef {import('.').CellList} CellList */

import { createHTMLBoard, generateSudoku, displayBoard, getNumberAmounts } from './generateSudoku.js';
import { generateShareURL, loadFromShareURL } from './shareSudoku.js';
import { setRootStyle, getRootStyle, invertHex, saveToClipboard, initializeColorPicker } from './utils.js';

document.documentElement.removeAttribute('style'); // remove temp background-color

globalThis.debug = true;
/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/no-redundant-boolean, no-constant-binary-expression */
globalThis.debugBoard = true && globalThis.debug;

const DEFAULT_BOARD_SIZE = 9;
const MS_IN_SEC = 1000;
const SEC_IN_MIN = 60;

const MIN_HOLES_PERCENTAGE = .2;
const MAX_HOLES_PERCENTAGE = .75;
const MIN_HOLES = Math.floor(DEFAULT_BOARD_SIZE ** 2 * MIN_HOLES_PERCENTAGE);
const MAX_HOLES = Math.ceil(DEFAULT_BOARD_SIZE ** 2 * MAX_HOLES_PERCENTAGE);

/** @type {import('.').HTMLBoard} */ let htmlBoard = [];

const
/** @type {HTMLTableElement} */ sudoku = document.querySelector('#sudoku'),
  /** @type {HTMLTimeElement} */ timer = document.querySelector('#timer'),
  /** @type {HTMLDivElement} */ loadingContainer = document.querySelector('#loading-container'),
  /** @type {Element[]} */ loadingContainerSiblings = [...loadingContainer.parentElement.children].filter(e => e != loadingContainer),
  /** @type {HTMLSpanElement[]} */ numberOverviewSpans = [...document.querySelectorAll('#number-overview > tbody > tr > td > span')],
  /** @type {HTMLButtonElement} */ solutionBtn = document.querySelector('#solution-btn'),
  /** @type {HTMLButtonElement} */ regenerateBtn = document.querySelector('#regenerate-btn'),
  /** @type {HTMLButtonElement} */ shareBtn = document.querySelector('#share-btn'),
  /** @type {HTMLInputElement} */ difficultySlider = document.querySelector('#difficulty-slider'),
  /** @type {HTMLOutputElement} */ difficultyOutput = document.querySelector('#difficulty-slider + output'),
  /** @type {HTMLInputElement} */ sizeOption = document.querySelector('#size-option'),
  /** @type {HTMLInputElement} */ bgColorSwitcher = document.querySelector('#bg-color-switch'),
  /** @type {HTMLInputElement} */ fgColorSwitcher = document.querySelector('#fg-color-switch');

difficultySlider.addEventListener('input', event => difficultyOutput.textContent = event.target.value);
difficultySlider.min = MIN_HOLES;
difficultySlider.max = MAX_HOLES;

function checkErrors() {
  /* eslint-disable-next-line jsdoc/valid-types */
  /** @type {Set<`${number}-${number}`>} */
  const errorCells = new Set();

  /** @param {import('.').CellInput[]} cells */
  const findDuplicates = cells => {
    /** @type {Map<number, import('.').CellInput[]>} */
    const seen = new Map();
    for (const cell of cells) {
      const value = Number(cell.value);
      if (!value) continue;

      if (!seen.has(value)) seen.set(value, []);
      seen.get(value).push(cell);
    }

    if ([...seen.values()].some(group => group.length > 1)) {
      for (const cell of cells)
        errorCells.add(`${cell.dataset.row}-${cell.dataset.col}`);
    }
  };

  for (let i = 0; i < htmlBoard.length; i++) {
    findDuplicates(htmlBoard[i]); // check row
    findDuplicates(htmlBoard.map(row => row[i])); // check col
  }

  // check boxes
  const boxSize = Math.sqrt(htmlBoard.length);
  for (let boxRow = 0; boxRow < boxSize; boxRow++) {
    for (let boxCol = 0; boxCol < boxSize; boxCol++) {
      const boxCells = [];

      for (let rowId = 0; rowId < boxSize; rowId++) {
        for (let colId = 0; colId < boxSize; colId++)
          boxCells.push(htmlBoard[boxRow * boxSize + rowId][boxCol * boxSize + colId]);
      }

      findDuplicates(boxCells);
    }
  }

  for (const cell of htmlBoard.flat())
    cell.parentElement.classList[errorCells.has(`${cell.dataset.row}-${cell.dataset.col}`) ? 'add' : 'remove']('error');
}

function startTimer() {
  const start = performance.now();

  globalThis.timerInterval = setInterval(() => {
    const totalSecs = (performance.now() - start) / MS_IN_SEC;
    const mins = Math.floor(totalSecs / SEC_IN_MIN).toString().padStart(2, '0');
    const secs = Math.round(totalSecs % SEC_IN_MIN).toString().padStart(2, '0');

    timer.textContent = `${mins}:${secs}`;
    timer.setAttribute('datetime', `PT${mins}M${secs}S`);
  }, MS_IN_SEC);
}

function clearTimer() {
  globalThis.timerInterval = clearInterval(globalThis.timerInterval);
  timer.textContent = '00:00';
  timer.setAttribute('datetime', 'PT0S');
}

function updateNumberOverviewSpan(val, up = true) {
  const span = numberOverviewSpans[val - 1];
  span.textContent = Number(span.textContent) + (up ? 1 : -1);
  if (globalThis.fullBoardNumberAmt.get(val) == span.textContent)
    span.classList.add('complete');
  else span.classList.remove('complete');

  if (!numberOverviewSpans.some(e => !e.classList.contains('complete')))
    globalThis.timerInterval = clearInterval(globalThis.timerInterval);
}

initializeColorPicker(bgColorSwitcher, 'sudoku-bg-color', color => setRootStyle('--background-color', color));
initializeColorPicker(
  fgColorSwitcher, 'sudoku-fg-color',
  color => {
    setRootStyle('--foreground-color', color);
    setRootStyle('--foreground-color-inverted', invertHex(color));
  }
);

/* // NOT IMPLEMENTED YET
initializeColorPicker(
  fgColorSwitcher, 'sudoku-fg-color-secondary',
  color => {
    setRootStyle('--foreground-color-secondary', color);
    setRootStyle('--foreground-color-secondary-inverted', invertHex(color));
  }
);
*/
setRootStyle('--foreground-color-secondary-inverted', invertHex(getRootStyle('--foreground-color-secondary')));

sudoku.addEventListener('keypress', event => {
  if (event.key == event.target.value) return event.preventDefault();
  if (event.key == ' ') {
    updateNumberOverviewSpan(Number(event.target.value), false);
    event.target.value = '';
    checkErrors();
  }
  if (!/[1-9]/.test(event.key)) return event.preventDefault();

  if (!globalThis.timerInterval) startTimer();

  event.preventDefault();
  if (event.target.value) updateNumberOverviewSpan(Number(event.target.value), false);
  event.target.value = event.key;
  updateNumberOverviewSpan(Number(event.target.value), true);

  checkErrors();
});

const eventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
sudoku.addEventListener('keydown', event => {
  if (event.key == 'Backspace') {
    updateNumberOverviewSpan(Number(event.target.value), false);

    event.target.value = '';
    checkErrors();
    return event.preventDefault();
  }

  if (!eventKeys.includes(event.key)) return;
  event.preventDefault();

  const boardMax = htmlBoard.length - 1;

  /* eslint-disable @typescript-eslint/no-magic-numbers */
  let nextCell;
  if (event.key == eventKeys[5] || event.key == eventKeys[6]) {
    const fn = event.key == eventKeys[5] ? 'find' : 'findLast';
    const findCell = cell => !cell.disabled && (!event.shiftKey || cell.dataset.group == event.target.dataset.group);
    nextCell = (event.ctrlKey ? htmlBoard[fn](row => row.some(findCell)) : htmlBoard[Number(event.target.dataset.row) - 1])[fn](findCell);
  }

  while ((!nextCell || nextCell.disabled) && !(nextCell && nextCell.dataset.row == event.target.dataset.row && nextCell.dataset.col == event.target.dataset.col)) {
    const rowId = Number((nextCell ?? event.target).dataset.row) - 1;
    const colId = Number((nextCell ?? event.target).dataset.col) - 1;

    switch (event.key) {
      case eventKeys[0]: nextCell = htmlBoard[rowId == 0 ? boardMax : rowId - 1][colId]; break;
      case eventKeys[1]: nextCell = htmlBoard[rowId == boardMax ? 0 : rowId + 1][colId]; break;
      case eventKeys[2]: nextCell = htmlBoard[rowId][colId == 0 ? boardMax : colId - 1]; break;
      case eventKeys[3]: nextCell = htmlBoard[rowId][colId == boardMax ? 0 : colId + 1]; break;
      case eventKeys[4]:
        if (event.shiftKey) {
          // backwards cyclic
          if (rowId == 0 && colId == 0) nextCell = htmlBoard[boardMax][boardMax];
          else if (colId == 0) nextCell = htmlBoard[rowId - 1][boardMax];
          else nextCell = htmlBoard[rowId][colId - 1];
          break;
        }

        // forwards cyclic
        if (rowId == boardMax && colId == boardMax) nextCell = htmlBoard[0][0];
        else if (colId == boardMax) nextCell = htmlBoard[rowId + 1][0];
        else nextCell = htmlBoard[rowId][colId + 1];
        break;
    }
    /* eslint-enable @typescript-eslint/no-magic-numbers */
  }

  nextCell.focus();
});

document.querySelector('#stepper-up').addEventListener('click', () => {
  sizeOption.stepUp();
  sizeOption.dispatchEvent(new Event('input', { bubbles: true }));
});

document.querySelector('#stepper-down').addEventListener('click', () => {
  sizeOption.stepDown();
  sizeOption.dispatchEvent(new Event('input', { bubbles: true }));
});

let shareEventListener, solutionEventListener;

function updateBtnListeners(board, fullBoard) {
  let solutionShown = false;

  shareBtn.removeEventListener('click', shareEventListener);
  solutionBtn.removeEventListener('click', solutionEventListener);

  shareEventListener = async () => {
    const url = globalThis.location.search ? globalThis.location.href : generateShareURL(board, fullBoard);
    if (url != globalThis.location.href) globalThis.history.pushState({}, '', url);

    await saveToClipboard(url);
  };
  solutionEventListener = event => {
    solutionShown = !solutionShown;
    if (solutionShown) {
      console.debug('Showing solution.');
      displayBoard(fullBoard, htmlBoard, numberOverviewSpans, true);
      return event.target.textContent = 'Hide Solution';
    }

    console.debug('Hiding solution.');
    displayBoard(board, htmlBoard, numberOverviewSpans, false);
    event.target.textContent = 'Show Solution';
  };

  shareBtn.addEventListener('click', shareEventListener);
  solutionBtn.addEventListener('click', solutionEventListener);
}

/**
 * @param {Event | undefined} event
 * @param {boolean | undefined} firstTime */
async function regenerate(event, firstTime) {
  if (event) event.target.disabled = true;
  if (!firstTime) {
    const url = new URL(globalThis.location.href);
    url.search = '';

    globalThis.history.pushState({}, '', url);
  }

  for (const element of loadingContainerSiblings) element.style.setProperty('visibility', 'hidden');
  loadingContainer.style.removeProperty('display');
  clearTimer();

  const start = performance.now();
  const holes = Number(difficultySlider.value) || rando(MIN_HOLES, MAX_HOLES);
  difficultySlider.value = holes;
  difficultySlider.parentElement.querySelector('output').textContent = holes;

  const size = Number(sizeOption.value) ** 2 || DEFAULT_BOARD_SIZE;
  sizeOption.value = Math.sqrt(size);

  if (globalThis.debugBoard)
    console.debug('Using debug board.');
  else
    console.log(`Size: ${size}, Holes: ${holes}/${MAX_HOLES} (min: ${MIN_HOLES})`);

  if (htmlBoard.length != size) {
    createHTMLBoard(globalThis.debugBoard ? 9 : size);
    htmlBoard = [...document.querySelectorAll('#sudoku > tbody > tr')].map(e => [...e.children].map(e => e.firstChild));
  }

  const { fullBoard, board } = loadFromShareURL() ?? await generateSudoku(size, holes);

  /* eslint-disable-next-line require-atomic-updates -- not an issue because not reassigning globalThis anywhere */
  globalThis.fullBoardNumberAmt = getNumberAmounts(fullBoard);

  displayBoard(board, htmlBoard, numberOverviewSpans);
  checkErrors();

  console.debug(`Took ${performance.now() - start}ms to generate and render.`);

  setRootStyle('--sudoku-row-count', board.length);

  updateBtnListeners(board, fullBoard);

  loadingContainer.style.setProperty('display', 'none');
  for (const element of loadingContainerSiblings) element.style.removeProperty('visibility');

  if (event) event.target.disabled = false;
}

regenerateBtn.addEventListener('click', regenerate);
void regenerate(undefined, true);