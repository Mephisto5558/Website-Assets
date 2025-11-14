import {
  DEBUG_BOARDS, MAX_GENERATION_ATTEMPTS, MS_IN_SEC, WORKER_URL,
  bgColorSwitcher, cancelBtn, fgColorSwitcher, htmlBoard, loadingContainer, loadingStatusSpan, numberOverviewSpans, regenerateBtn, shareBtn, solutionBtn
} from './constants';
import './events';
import { createHTMLBoard, createHTMLOverviewSpans, displayBoard } from './generateSudoku';
import { generateShareURL, loadFromShareURL } from './shareSudoku';
import { checkErrors, clearTimer, getRootStyle, initializeColorPicker, invertHex, saveToClipboard, sendPopup, setRootStyle, updateMinMax } from './utils';

declare global {
  /* eslint-disable vars-on-top, no-inner-declarations */
  var
    debugBoard: boolean,
    timerInterval: number | undefined,
    sudokuWorker: Worker | undefined;
  /* eslint-enable vars-on-top, no-inner-declarations */

  type NoteDiv = HTMLDivElement & { firstChild: NoteElement; childNodes: NodeListOf<NoteElement>; children: HTMLCollectionOf<NoteElement> };
  type NoteElement = HTMLSpanElement & { dataset: { note: `${number}` }; parentElement: NoteDiv };

  type CellInput = HTMLInputElement & { type: 'number'; dataset: { group: `${number}`; row: `${number}`; col: `${number}`; val?: `${number}` }; parentElement: CellList };
  type CellList = HTMLTableCaptionElement & { firstChild: CellInput; childNodes: NodeListOf<CellInput | NoteDiv>; children: HTMLCollectionOf<CellInput | NoteDiv> };
  type HTMLBoard = CellInput[][];

  type Board = number[][];
  type FullBoard = number[][];
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
    if (!(event.target instanceof HTMLButtonElement)) return; // typeguard
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

let
  resolveFunction: ((value: { fullBoard: FullBoard; board: Board }) => void) | undefined,
  rejectFunction: ((value: unknown) => void) | undefined;

function createSudokuWorker(): Worker {
  const sudokuWorker = new Worker(WORKER_URL);
  sudokuWorker.addEventListener('message', (e: MessageEvent<
    { type: 'progress' | 'cancel' | 'debug' | 'error'; message: string }
    | { type: 'result'; result: { fullBoard: FullBoard; board: Board } }
  >) => {
    switch (e.data.type) {
      case 'cancel':
        console.log(`UI: Canceling worker generation${e.data.message ? ' due to ' + e.data.message : ''}.`);
        sendPopup('Canceled');

        return rejectFunction?.(e.data.message);
      case 'result':
        console.log('UI: Received result from worker.');

        resolveFunction?.(e.data.result);
        resolveFunction = undefined;
        return;
      case 'progress':
        loadingStatusSpan.textContent = e.data.message;
        e.data.type = 'debug';

        // fall through
      default:
        console[e.data.type]('Worker: ' + e.data.message);
    }
  });
  sudokuWorker.addEventListener('error', e => rejectFunction?.(e.error));

  return sudokuWorker;
}

let
  showedLoading = false,
  isGenerating = false;

async function regenerate(event?: PointerEvent, firstTime = false): Promise<void> {
  if (isGenerating) return;
  isGenerating = true;

  if (event?.target instanceof HTMLButtonElement) event.target.disabled = true;

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

    const
      start = performance.now(),
      { size, minHoles, maxHoles, holes } = updateMinMax();

    if (globalThis.debugBoard) console.debug('Using debug board.');
    else console.log(`Size: ${size}, Holes: ${holes}/${maxHoles} (min: ${minHoles})`);

    let result = loadFromShareURL(globalThis.debugBoard ? DEBUG_BOARDS.get(size) : undefined);
    if (!result) {
      /* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- relatively arbitrary: 5s + size ** 4 */
      const timeoutDuration = MS_IN_SEC * 5 + (size ** 4);
      for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
        console.log(`UI: Starting generation attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}...`);

        globalThis.sudokuWorker ??= createSudokuWorker();

        try {
          result = await Promise.race([
            /* eslint-disable-next-line @typescript-eslint/no-loop-func -- resolveFunction and rejectFunction are reassigned in each loop iteration */
            new Promise<{ fullBoard: FullBoard; board: Board }>((res, rej) => {
              resolveFunction = res;
              rejectFunction = rej;

              console.log('UI: Posting task to worker...');
              /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- fine to throw if it is undefined for some reason */
              globalThis.sudokuWorker!.postMessage({ size, holes, debugBoard: globalThis.debugBoard });
            }),
            new Promise<undefined>((_, rej) => void setTimeout(() => rej(new Error(`Timeout after ${timeoutDuration}ms`)), timeoutDuration))
          ]);

          break; // exit if the promise didn't throw
        }
        catch (rawErr) {
          /* eslint-disable max-depth */
          const err = rawErr instanceof Error ? rawErr : new Error(String(rawErr));
          if (err.message != 'user cancel request') {
            console.warn(`UI: Attempt ${attempt} failed. Reason: ${err.message}`);
            loadingStatusSpan.textContent = `Attempt ${attempt}/${MAX_GENERATION_ATTEMPTS} failed. Retrying.`;
          }

          globalThis.sudokuWorker.terminate();
          globalThis.sudokuWorker = undefined;

          if (err.message == 'user cancel request') break;
          if (attempt >= MAX_GENERATION_ATTEMPTS)
            throw new Error('Failed to generate Sudoku after all attempts.', { cause: rawErr });
          /* eslint-enable max-depth */
        }
      }
    }

    if (!result) return; // User cancled the generation.
    const { fullBoard, board } = result;

    if (fullBoard.length != htmlBoard.length) {
      createHTMLBoard(fullBoard.length);
      htmlBoard.length = 0;

      htmlBoard.push(...document.querySelectorAll<HTMLTableRowElement & { children: HTMLCollectionOf<CellList> }>('#sudoku > tbody > tr').values().map(e => [...e.children].map(e => e.firstChild)));

      createHTMLOverviewSpans(fullBoard.length);
      numberOverviewSpans.length = 0;
      numberOverviewSpans.push(...document.querySelectorAll<HTMLSpanElement>('#number-overview > tbody > tr > td > span'));
    }
    setRootStyle('--sudoku-row-count', fullBoard.length);
    document.documentElement.dataset.sudokuBoxSize = Math.sqrt(fullBoard.length).toString();

    displayBoard(board, htmlBoard, numberOverviewSpans);
    checkErrors(htmlBoard);

    console.debug(`Took ${performance.now() - start}ms to generate and render.`);

    updateBtnListeners(board, fullBoard);
  }
  catch (err) {
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
    if (event?.target instanceof HTMLButtonElement) event.target.disabled = false;
    if (firstTime) cancelBtn.classList.remove('invisible');
  }
}

regenerateBtn.addEventListener('click', regenerate);
await regenerate(undefined, true);