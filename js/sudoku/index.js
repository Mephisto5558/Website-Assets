/** @typedef {import('.').CellInput} CellInput */
/** @typedef {import('.').CellList} CellList */

import { bgColorSwitcher, DEFAULT_BOARD_SIZE, fgColorSwitcher, htmlBoard, loadingContainer, loadingContainerSiblings, numberOverviewSpans, regenerateBtn, shareBtn, solutionBtn } from './constants.js';
import { createHTMLBoard, generateSudoku, displayBoard, getNumberAmounts } from './generateSudoku.js';
import { generateShareURL, loadFromShareURL } from './shareSudoku.js';
import { setRootStyle, getRootStyle, invertHex, saveToClipboard, initializeColorPicker, clearTimer, checkErrors, updateMinMax } from './utils.js';
import __ from './events.js';

document.documentElement.removeAttribute('style'); // remove temp background-color

initializeColorPicker(bgColorSwitcher, 'sudoku-bg-color', color => setRootStyle('--background-color', color));
initializeColorPicker(
  fgColorSwitcher, 'sudoku-fg-color',
  color => {
    setRootStyle('--foreground-color', color);
    setRootStyle('--foreground-color-inverted', invertHex(color));
  }
);

/* // TODO: Implement
initializeColorPicker(
  fgColorSwitcher, 'sudoku-fg-color-secondary',
  color => {
    setRootStyle('--foreground-color-secondary', color);
    setRootStyle('--foreground-color-secondary-inverted', invertHex(color));
  }
);
*/
setRootStyle('--foreground-color-secondary-inverted', invertHex(getRootStyle('--foreground-color-secondary')));

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
function regenerate(event, firstTime) {
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

  const { size, minHoles, maxHoles, holes } = updateMinMax();

  if (globalThis.debugBoard)
    console.debug('Using debug board.');
  else
    console.log(`Size: ${size}, Holes: ${holes}/${maxHoles} (min: ${minHoles})`);

  if (htmlBoard.length != size) {
    createHTMLBoard(globalThis.debugBoard ? DEFAULT_BOARD_SIZE : size);
    htmlBoard.length = 0;
    htmlBoard.push(...[...document.querySelectorAll('#sudoku > tbody > tr')].map(e => [...e.children].map(e => e.firstChild)));
  }

  const { fullBoard, board } = loadFromShareURL() ?? generateSudoku(size, holes);

  globalThis.fullBoardNumberAmt = getNumberAmounts(fullBoard);

  displayBoard(board, htmlBoard, numberOverviewSpans);
  checkErrors(htmlBoard);

  console.debug(`Took ${performance.now() - start}ms to generate and render.`);

  setRootStyle('--sudoku-row-count', board.length);

  updateBtnListeners(board, fullBoard);

  loadingContainer.style.setProperty('display', 'none');
  for (const element of loadingContainerSiblings) element.style.removeProperty('visibility');

  if (event) event.target.disabled = false;
}

regenerateBtn.addEventListener('click', regenerate);
regenerate(undefined, true);