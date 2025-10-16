/** @typedef {import('./index.js').CellInput} CellInput */
/** @typedef {import('./index.js').CellList} CellList */

import {
  bgColorSwitcher, cancelBtn, DEBUG_BOARDS, fgColorSwitcher, htmlBoard, loadingContainer,
  MS_IN_SEC, numberOverviewSpans, regenerateBtn, REPORT_PROD_WORKER_URL, shareBtn, solutionBtn,
  MAX_GENERATION_ATTEMPTS
} from './constants.js';
import { createHTMLBoard, createHTMLOverviewSpans, displayBoard } from './generateSudoku.js';
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
      event.target.textContent = 'Hide Solution';
      return;
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
      sendPopup('Canceled');

      return rejectFunction?.(e.data);
    }
    if (e.data.type == 'result') {
      console.log('UI: Received result from worker.');

      resolveFunction?.(e.data.payload);
      resolveFunction = undefined;
      return;
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

    let result = loadFromShareURL(globalThis.debugBoard ? DEBUG_BOARDS.get(size) : undefined);
    if (!result) {
      const timeoutDuration = MS_IN_SEC * 5 + (size ** 4);
      for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
        console.log(`UI: Starting generation attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}...`);

        /* eslint-disable-next-line require-atomic-updates -- globalThis won't change */
        globalThis.sudokuWorker ??= await createSudokuWorker();

        try {
          result = await Promise.race([
            /* eslint-disable-next-line @typescript-eslint/no-loop-func -- resolveFunction and rejectFunction are reassigned in each loop iteration */
            new Promise((res, rej) => {
              resolveFunction = res;
              rejectFunction = rej;

              console.log('UI: Posting task to worker...');
              globalThis.sudokuWorker.postMessage({ size, holes, debugBoard: globalThis.debugBoard });
            }),
            new Promise((_, rej) => setTimeout(() => rej(new Error(`Timeout after ${timeoutDuration}ms`)), timeoutDuration))
          ]);

          break; // exit if the promise didn't throw
        }
        catch (err) {
          console.warn(`UI: Attempt ${attempt} failed. Reason: ${err.message}`);
          loadingContainer.children.namedItem('loading-status').textContent = `Attempt ${attempt}/${MAX_GENERATION_ATTEMPTS} failed. Retrying.`;

          globalThis.sudokuWorker.terminate();
          delete globalThis.sudokuWorker;

          if (attempt >= MAX_GENERATION_ATTEMPTS)
            throw new Error('Failed to generate Sudoku after all attempts.');
        }
      }
    }

    const { fullBoard, board } = result;

    if (fullBoard.length != htmlBoard.length) {
      createHTMLBoard(fullBoard.length);
      htmlBoard.length = 0;
      htmlBoard.push(...[...document.querySelectorAll('#sudoku > tbody > tr')].map(e => [...e.children].map(e => e.firstChild)));

      createHTMLOverviewSpans(fullBoard.length);
      numberOverviewSpans.length = 0;
      numberOverviewSpans.push(...document.querySelectorAll('#number-overview > tbody > tr > td > span'));
    }
    setRootStyle('--sudoku-row-count', fullBoard.length);
    document.documentElement.dataset.sudokuBoxSize = Math.sqrt(fullBoard.length);

    displayBoard(board, htmlBoard, numberOverviewSpans);
    checkErrors(htmlBoard);

    console.debug(`Took ${performance.now() - start}ms to generate and render.`);

    updateBtnListeners(board, fullBoard);
  }
  catch (err) {
    if (err?.type === 'cancel') return console.log('UI: Generation was successfully canceled.');

    console.error('An error occurred during Sudoku generation:', err);
    sendPopup('Error', 'An unexpected error occurred during Sudoku generation. Please try again.');
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