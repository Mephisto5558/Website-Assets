/** @typedef {import('.').CellInput} CellInput */
/** @typedef {import('.').CellList} CellList */

import {
  bgColorSwitcher, cancelBtn, DEFAULT_BOARD_SIZE, fgColorSwitcher, htmlBoard, loadingContainer,
  MS_IN_SEC, numberOverviewSpans, regenerateBtn, REPORT_PROD_WORKER_URL, shareBtn, solutionBtn
} from './constants.js';
import { createHTMLBoard, createHTMLOverviewSpans, displayBoard, getNumberAmounts } from './generateSudoku.js';
import { generateShareURL, loadFromShareURL } from './shareSudoku.js';
import { setRootStyle, getRootStyle, invertHex, saveToClipboard, initializeColorPicker, clearTimer, checkErrors, updateMinMax, sendPopup } from './utils.js';
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
  fgSecondaryColorSwitcher, 'sudoku-fg-color-secondary',
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

let workerBlobURL;
async function fetchScript(url) {
  const workerScript = await fetch(url).then(res => res.text());
  return URL.createObjectURL(new Blob([workerScript], { type: 'application/javascript' }));
}

let resolveFunction, rejectFunction;
async function createSudokuWorker() {
  workerBlobURL ??= await fetchScript(globalThis.debug ? './sudoku.worker.js' : REPORT_PROD_WORKER_URL);
  const sudokuWorker = new Worker(workerBlobURL);

  sudokuWorker.addEventListener('message', e => {
    if (e.data.type == 'cancel') {
      console.log(`UI: Canceling worker generation${e.data.message ? ' due to ' + e.data.message : ''}.`);
      return rejectFunction?.(e.data);
    }
    if (e.data.type == 'result') {
      console.log('UI: Received result from worker.');

      resolveFunction?.(e.data.payload);
      return resolveFunction = undefined;
    }

    (console[e.data.type == 'progress' ? 'debug' : e.data.type] ?? console.log)('Worker: ' + e.data.message);
    if (e.data.type == 'progress') loadingContainer.children.namedItem('loading-status').textContent = e.data.message;
  });
  sudokuWorker.addEventListener('error', e => console.error('Worker:', e));

  return sudokuWorker;
}

let showedLoading = false;
let isGenerating = false;

/**
 * @param {Event | undefined} event
 * @param {boolean | undefined} firstTime */
async function regenerate(event, firstTime) {
  if (isGenerating) return;
  isGenerating = true;

  if (event) event.target.disabled = true;

  if (firstTime) cancelBtn.classList.add('invisible');
  else {
    const url = new URL(globalThis.location.href);
    url.search = '';

    globalThis.history.pushState({}, '', url);
  }

  const loadingTimeout = setTimeout(() => {
    showedLoading = true;

    loadingContainer.classList.remove('hiding', 'hidden');
  }, MS_IN_SEC / 10);

  try {
    clearTimer();

    const start = performance.now();

    const { size, minHoles, maxHoles, holes } = updateMinMax();

    if (globalThis.debugBoard)
      console.debug('Using debug board.');
    else
      console.log(`Size: ${size}, Holes: ${holes}/${maxHoles} (min: ${minHoles})`);

    /* eslint-disable-next-line require-atomic-updates -- safe due to being in a try*/
    globalThis.sudokuWorker ??= await createSudokuWorker();

    /** @type {{ fullBoard: import('.').FullBoard, board: import('.').Board }} */
    const { fullBoard, board } = loadFromShareURL() ?? await new Promise((res, rej) => {
      resolveFunction = res;
      rejectFunction = rej;

      console.log('UI: Posting task to worker...');
      globalThis.sudokuWorker.postMessage({ size, holes, debugBoard: globalThis.debugBoard });
    });

    /* eslint-disable-next-line require-atomic-updates -- globalThis won't change */
    globalThis.fullBoardNumberAmt = getNumberAmounts(fullBoard);
    setRootStyle('--sudoku-row-count', board.length);
    document.documentElement.dataset.sudokuBoxSize = Math.sqrt(board.length);

    if (fullBoard.length != htmlBoard.length) {
      createHTMLBoard(globalThis.debugBoard ? DEFAULT_BOARD_SIZE : fullBoard.length);
      htmlBoard.length = 0;
      htmlBoard.push(...[...document.querySelectorAll('#sudoku > tbody > tr')].map(e => [...e.children].map(e => e.firstChild)));

      createHTMLOverviewSpans(globalThis.debugBoard ? DEFAULT_BOARD_SIZE : fullBoard.length);
      numberOverviewSpans.length = 0;
      numberOverviewSpans.push(...document.querySelectorAll('#number-overview > tbody > tr > td > span'));
    }

    displayBoard(board, htmlBoard, numberOverviewSpans);
    checkErrors(htmlBoard);

    console.debug(`Took ${performance.now() - start}ms to generate and render.`);

    updateBtnListeners(board, fullBoard);
  }
  catch (err) {
    if (err?.type === 'cancel') return console.log('UI: Generation was successfully canceled.');

    console.error('An error occurred during Sudoku generation:', err);
    sendPopup('An unexpected error occurred during Sudoku generation. Please try again.');
  }
  finally {
    clearTimeout(loadingTimeout);
    if (showedLoading) {
      loadingContainer.classList.add('hiding');
      loadingContainer.addEventListener('animationend', () => loadingContainer.classList.add('hidden'), { once: true });
    }
    else loadingContainer.classList.add('hidden');

    /* eslint-disable-next-line require-atomic-updates -- false positive: can never execute if the variable is already false */
    isGenerating = false;
    resolveFunction = undefined;
    rejectFunction = undefined;
    if (event) event.target.disabled = false;
    if (firstTime) cancelBtn.classList.remove('invisible');
  }
}

regenerateBtn.addEventListener('click', regenerate);
void regenerate(undefined, true);