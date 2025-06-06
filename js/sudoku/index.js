/** @typedef {import('.').CellInput} CellInput */
/** @typedef {import('.').CellList} CellList */

import { displayBoard, generateSudoku, getNumberAmounts } from './generateSudoku.js';
import { generateShareURL, loadFromShareURL } from './shareSudoku.js';

globalThis.debug = false;
globalThis.debugBoard = true;

const DEFAULT_BOARD_SIZE = 9;
const MS_IN_SEC = 1000;
const SEC_IN_MIN = 60;

const MIN_HOLES_PERCENTAGE = .2;
const MAX_HOLES_PERCENTAGE = .75;
const MIN_HOLES = Math.floor(DEFAULT_BOARD_SIZE ** 2 * MIN_HOLES_PERCENTAGE);
const MAX_HOLES = Math.ceil(DEFAULT_BOARD_SIZE ** 2 * MAX_HOLES_PERCENTAGE);

document.documentElement.removeAttribute('style'); // remove temp background-color

/** @type {CellInput[][]} */
globalThis.htmlBoard = [...document.querySelectorAll('#sudoku > tbody > tr')].map(e => [...e.children].map(e => e.firstChild));

/** @type {HTMLTableElement} */
const sudoku = document.querySelector('#sudoku');

/** @type {HTMLSpanElement} */
const timerSpan = document.querySelector('#timer');

/** @type {HTMLDivElement} */
const loadingContainer = document.querySelector('#loading-container');

/** @type {Element[]} */
const loadingContainerSiblings = [...loadingContainer.parentElement.children].filter(e => e != loadingContainer);

/** @type {HTMLButtonElement} */
const regenerateBtn = document.querySelector('#regenerate-btn');

/** @type {HTMLSpanElement[]} */
const numberOverviewSpans = [...document.querySelectorAll('#number-overview > tbody > tr > td > span')];

/** @type {HTMLButtonElement} */
const shareButton = document.querySelector('#share-btn');

/** @type {HTMLInputElement} */
const difficultySlider = document.querySelector('#difficulty-slider');
const difficultyOutput = document.querySelector('#difficulty-slider + output');

difficultySlider.addEventListener('input', event => difficultyOutput.textContent = event.target.value);
difficultySlider.min = MIN_HOLES;
difficultySlider.max = MAX_HOLES;

/** @param {`#{number}` | `${number}`} hex */ /* eslint-disable-line jsdoc/valid-types -- false positive */
function invertHex(hex) {
  hex = hex.replace('#', '');
  /* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- hex math */
  return '#' + (hex.length == 3 ? [...hex] : hex.match(/\w{2}/g)).map(e => (255 - Number.parseInt(e, 16)).toString(16).padStart(2, '0')).join('');
}

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

function startTimer() {
  const start = performance.now();

  globalThis.timerInterval = setInterval(() => {
    const secs = (performance.now() - start) / MS_IN_SEC;
    timerSpan.textContent = `${String(Math.floor(secs / SEC_IN_MIN)).padStart(2, '0')}:${String(Math.round(secs % SEC_IN_MIN)).padStart(2, '0')}`;
  }, MS_IN_SEC);
}

function clearTimer() {
  globalThis.timerInterval = clearInterval(globalThis.timerInterval);
  timerSpan.textContent = '00:00';
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

async function saveToClipboard(value) {
  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions -- is `undefined` on HTTP pages */
  if (globalThis.navigator.clipboard) {
    await globalThis.navigator.clipboard.writeText(value);
    return alert('Saved the link in your clipboard.');
  }

  const copyArea = document.createElement('textarea');
  copyArea.value = value;
  copyArea.style.display = 'none';

  document.body.append(copyArea);
  copyArea.focus({ preventScroll: true });
  copyArea.select();

  try {
    /* eslint-disable-next-line @typescript-eslint/no-deprecated -- workaround for HTTP context*/
    if (!document.execCommand('copy')) throw new Error('Did not save');
    alert('Saved the link in your clipboard.');
  }
  catch (err) {
    console.error('Could not copy to clipboard using document.execCommand:', err);
    alert('Cold not copy the URL to your clipboard. Please copy it manually from the address bar.');
  }

  copyArea.remove();
}

/** @type {InputEvent} */
const bgColorSwitcher = document.querySelector('#bg-color-switch');
if (bgColorSwitcher.value) document.documentElement.style.setProperty('--background-color', bgColorSwitcher.value);
else bgColorSwitcher.setAttribute('value', globalThis.getComputedStyle(document.documentElement).getPropertyValue('--background-color'));
bgColorSwitcher.addEventListener('change', event => {
  document.documentElement.style.setProperty('--background-color', event.target.value);
});

/** @type {InputEvent} */
const fgColorSwitcher = document.querySelector('#fg-color-switch');
if (fgColorSwitcher.value) {
  document.documentElement.style.setProperty('--foreground-color', fgColorSwitcher.value);
  document.documentElement.style.setProperty('--foreground-color-inverted', invertHex(fgColorSwitcher.value));
}
else fgColorSwitcher.setAttribute('value', globalThis.getComputedStyle(document.documentElement).getPropertyValue('--foreground-color'));
fgColorSwitcher.addEventListener('change', event => {
  document.documentElement.style.setProperty('--foreground-color', event.target.value);
  document.documentElement.style.setProperty('--foreground-color-inverted', invertHex(event.target.value));
});
document.documentElement.style.setProperty('--foreground-color-secondary-inverted', invertHex(globalThis.getComputedStyle(document.documentElement).getPropertyValue('--foreground-color-secondary')));

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

  const boardMax = globalThis.htmlBoard.length - 1;

  /* eslint-disable @typescript-eslint/no-magic-numbers */
  let nextCell;
  if (event.key == eventKeys[5] || event.key == eventKeys[6]) {
    const fn = event.key == eventKeys[5] ? 'find' : 'findLast';
    const findCell = cell => !cell.disabled && (!event.shiftKey || cell.dataset.group == event.target.dataset.group);
    nextCell = (event.ctrlKey ? globalThis.htmlBoard[fn](row => row.some(findCell)) : globalThis.htmlBoard[Number(event.target.dataset.row) - 1])[fn](findCell);
  }

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
    /* eslint-enable @typescript-eslint/no-magic-numbers */
  }

  nextCell.focus();
});

let shareEventListener;

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

  if (globalThis.debug && globalThis.debugBoard)
    console.debug('Using debug board.');
  else
    console.log(`Size: ${DEFAULT_BOARD_SIZE}, Holes: ${holes}/${MAX_HOLES} (min: ${MIN_HOLES})`);

  const { fullBoard, board } = loadFromShareURL() ?? await generateSudoku(DEFAULT_BOARD_SIZE, holes);

  /* eslint-disable-next-line require-atomic-updates -- not an issue because not reassigning globalThis anywhere */
  globalThis.fullBoardNumberAmt = getNumberAmounts(fullBoard);

  displayBoard(board);
  checkErrors();

  console.debug(`Took ${performance.now() - start}ms to generate and render.`);

  document.documentElement.style.setProperty('--sudoku-row-count', board.length);
  if (globalThis.screen.availWidth < Number.parseFloat(getComputedStyle(sudoku).width) * 1.2)
    document.documentElement.style.setProperty('font-size', 'unset');

  shareButton.removeEventListener('click', shareEventListener);

  shareEventListener = async () => {
    const url = globalThis.location.search ? globalThis.location.href : generateShareURL(board, fullBoard);
    if (url != globalThis.location.href) globalThis.history.pushState({}, '', url);

    await saveToClipboard(url);
  };

  shareButton.addEventListener('click', shareEventListener);

  loadingContainer.style.setProperty('display', 'none');
  for (const element of loadingContainerSiblings) element.style.removeProperty('visibility');

  if (event) event.target.disabled = false;
}

regenerateBtn.addEventListener('click', regenerate);
void regenerate(undefined, true);