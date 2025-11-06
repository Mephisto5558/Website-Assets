/* eslint-disable @typescript-eslint/no-non-null-assertion */

import {
  DEBUG_BOARDS, MAX_GENERATION_ATTEMPTS, MS_IN_SEC, REPORT_PROD_WORKER_URL,
  bgColorSwitcher, cancelBtn, fgColorSwitcher, htmlBoard, loadingContainer, numberOverviewSpans, regenerateBtn, shareBtn, solutionBtn
} from './constants.js';
import __ from './events.js';
import { createHTMLBoard, createHTMLOverviewSpans, displayBoard } from './generateSudoku.js';
import { generateShareURL, loadFromShareURL } from './shareSudoku.js';
import { checkErrors, clearTimer, getRootStyle, initializeColorPicker, invertHex, saveToClipboard, sendPopup, setRootStyle, updateMinMax } from './utils.js';

declare global {
  /* eslint-disable vars-on-top, no-inner-declarations */
  var
    debug: boolean,
    debugBoard: boolean,
    timerInterval: number | undefined,
    sudokuWorker: Worker | undefined,
    runBench: boolean;
  /* eslint-enable vars-on-top, no-inner-declarations */

  export type NoteDiv = HTMLDivElement & { childNodes: NodeListOf<NoteElement> };
  export type NoteElement = HTMLSpanElement & { dataset: { note: `${number}` } };

  export type CellInput = HTMLInputElement & { type: 'number'; dataset: { group: `${number}`; row: `${number}`; col: `${number}`; val?: `${number}` } };
  export type CellList = HTMLTableCaptionElement & { firstChild: CellInput; childNodes: [CellInput, NoteDiv]; children: [CellInput, NoteDiv] };
  export type HTMLBoard = CellInput[][];

  export type Board = number[][];
  export type FullBoard = number[][];
}


document.documentElement.removeAttribute('style'); // remove temp background-color

initializeColorPicker(bgColorSwitcher, 'sudoku-bg-color', color => setRootStyle('--background-color', color));
initializeColorPicker(
  fgColorSwitcher, 'sudoku-fg-color',
  (color: string) => {
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

let
  shareEventListener: ((event: PointerEvent) => unknown) | undefined,
  solutionEventListener: ((event: PointerEvent) => unknown) | undefined;

function updateBtnListeners(board: Board, fullBoard: FullBoard): void {
  let solutionShown = false;

  if (shareEventListener) shareBtn.removeEventListener('click', shareEventListener);
  if (solutionEventListener) solutionBtn.removeEventListener('click', solutionEventListener);

  shareEventListener = async (): Promise<void> => {
    const url = globalThis.location.search ? globalThis.location.href : generateShareURL(board, fullBoard);
    if (url != globalThis.location.href) globalThis.history.pushState({}, '', url);

    await saveToClipboard(url);
  };
  solutionEventListener = (event: PointerEvent): void => {
    solutionShown = !solutionShown;
    if (solutionShown) {
      console.debug('Showing solution.');
      displayBoard(fullBoard, htmlBoard, numberOverviewSpans, true);
      event.target!.textContent = 'Hide Solution';
      return;
    }

    console.debug('Hiding solution.');
    displayBoard(board, htmlBoard, numberOverviewSpans, false);
    event.target!.textContent = 'Show Solution';
  };

  shareBtn.addEventListener('click', shareEventListener);
  solutionBtn.addEventListener('click', solutionEventListener);
}

let workerBlobURL: string | undefined;
async function fetchScript(url: string): Promise<string> {
  const workerScript = await fetch(url).then(async res => res.text());
  return URL.createObjectURL(new Blob([workerScript], { type: 'application/javascript' }));
}

let
  resolveFunction: ((...args: unknown[]) => unknown) | undefined,
  rejectFunction: ((...args: unknown[]) => unknown) | undefined;

async function createSudokuWorker(): Promise<Worker> {
  workerBlobURL ??= await fetchScript(globalThis.debug ? './sudoku.worker.js' : REPORT_PROD_WORKER_URL);
  const sudokuWorker = new Worker(workerBlobURL);

  sudokuWorker.addEventListener('message', (e: MessageEvent<{ type: string; message?: string; payload: string }>) => {
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

    (console[e.data.type == 'progress' ? 'debug' : e.data.type] ?? console.log)!('Worker: ' + e.data.message);
    if (e.data.type == 'progress') loadingContainer.children.namedItem('loading-status')!.textContent = e.data.message;
  });
  sudokuWorker.addEventListener('error', e => console.error('Worker:', e));

  return sudokuWorker;
}

let showedLoading = false,
  isGenerating = false;

async function regenerate(event?: PointerEvent, firstTime = false): Promise<void> {
  if (isGenerating) return;
  isGenerating = true;

  if (event) event.target!.disabled = true;

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

    const start = performance.now(),

      { size, minHoles, maxHoles, holes } = updateMinMax();

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
              globalThis.sudokuWorker!.postMessage({ size, holes, debugBoard: globalThis.debugBoard });
            }),
            new Promise((_, rej) => void setTimeout(() => rej(new Error(`Timeout after ${timeoutDuration}ms`)), timeoutDuration))
          ]);

          break; // exit if the promise didn't throw
        }
        catch (err) {
          console.warn(`UI: Attempt ${attempt} failed. Reason: ${err.message}`);
          loadingContainer.children.namedItem('loading-status')!.textContent = `Attempt ${attempt}/${MAX_GENERATION_ATTEMPTS} failed. Retrying.`;

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