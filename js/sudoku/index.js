/** @typedef {import('.').CellInput} CellInput */
/** @typedef {import('.').CellList} CellList */

import { bgColorSwitcher, DEFAULT_BOARD_SIZE, fgColorSwitcher, htmlBoard, loadingContainer, MS_IN_SEC, numberOverviewSpans, regenerateBtn, shareBtn, solutionBtn } from './constants.js';
import { createHTMLBoard, displayBoard, getNumberAmounts } from './generateSudoku.js';
import { generateShareURL, loadFromShareURL } from './shareSudoku.js';
import { setRootStyle, getRootStyle, invertHex, saveToClipboard, initializeColorPicker, clearTimer, checkErrors, updateMinMax } from './utils.js';
import __ from './events.js';

const sudokuWorker = new Worker((globalThis.debug ? '.' : 'https://mephisto5558.github.io/Website-Assets/min/js/sudoku') + '/sudoku.worker.js');

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

let resolveFunction;
sudokuWorker.addEventListener('message', e => {
  if (e.data.type == 'result') {
    console.log('UI: Received result from worker.');

    resolveFunction?.(e.data.payload);
    return resolveFunction = undefined;
  }

  (console[e.data.type == 'progress' ? 'debug' : e.data.type] ?? console.log)('Worker: ' + e.data.message);
  if (e.data.type == 'progress') loadingContainer.children.namedItem('loading-status').textContent = e.data.message;
});
sudokuWorker.addEventListener('error', e => console.error('Worker: ' + e.message));

let showedLoading = false;

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

  const loadingTimeout = setTimeout(() => {
    showedLoading = true;

    loadingContainer.classList.remove('hiding');
    loadingContainer.style.removeProperty('display');
  }, MS_IN_SEC / 10);

  clearTimer();

  const start = performance.now();

  const { size, minHoles, maxHoles, holes } = updateMinMax();

  if (globalThis.debugBoard)
    console.debug('Using debug board.');
  else
    console.log(`Size: ${size}, Holes: ${holes}/${maxHoles} (min: ${minHoles})`);

  /** @type {{ fullBoard: import('.').FullBoard, board: import('.').Board }} */
  const { fullBoard, board } = loadFromShareURL() ?? await new Promise(res => {
    resolveFunction = res;

    console.log('UI: Posting task to worker...');
    sudokuWorker.postMessage({ size, holes, debugBoard: globalThis.debugBoard });
  });

  globalThis.fullBoardNumberAmt = getNumberAmounts(fullBoard);
  setRootStyle('--sudoku-row-count', board.length);

  if (fullBoard.length != htmlBoard.length) {
    createHTMLBoard(globalThis.debugBoard ? DEFAULT_BOARD_SIZE : fullBoard.length);
    htmlBoard.length = 0;
    htmlBoard.push(...[...document.querySelectorAll('#sudoku > tbody > tr')].map(e => [...e.children].map(e => e.firstChild)));
  }

  displayBoard(board, htmlBoard, numberOverviewSpans);
  checkErrors(htmlBoard);

  console.debug(`Took ${performance.now() - start}ms to generate and render.`);

  updateBtnListeners(board, fullBoard);

  clearTimeout(loadingTimeout);
  if (showedLoading) {
    loadingContainer.classList.add('hiding');
    loadingContainer.addEventListener('animationend', () => loadingContainer.style.display = 'none', { once: true });
  }
  else loadingContainer.style.display = 'none';

  if (event) event.target.disabled = false;
}

regenerateBtn.addEventListener('click', regenerate);
void regenerate(undefined, true);