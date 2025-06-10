globalThis.debug = false;
/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/no-redundant-boolean, no-constant-binary-expression */
globalThis.debugBoard = true && globalThis.debug;

export const DEFAULT_BOARD_SIZE = 9;
export const MIN_HOLES_PERCENTAGE = .2;
export const MAX_HOLES_PERCENTAGE = .75;

export const MS_IN_SEC = 1000;
export const SEC_IN_MIN = 60;

export const DEBUG_BOARDS = {
  board: [
    /* eslint-disable @typescript-eslint/no-magic-numbers */
    [6, 5, 8, 4, 2, 0, 0, 0, 0],
    [0, 2, 3, 7, 0, 0, 4, 0, 0],
    [4, 1, 7, 6, 0, 9, 0, 0, 5],
    [0, 0, 6, 8, 0, 5, 7, 4, 2],
    [0, 9, 2, 3, 0, 7, 5, 6, 1],
    [7, 4, 5, 1, 6, 2, 9, 0, 8],
    [0, 0, 1, 5, 0, 4, 2, 8, 0],
    [0, 7, 0, 9, 8, 0, 0, 5, 0],
    [5, 0, 9, 2, 0, 3, 6, 0, 4]
  ],
  fullBoard: [
    [6, 5, 8, 4, 2, 1, 3, 9, 7],
    [9, 2, 3, 7, 5, 8, 4, 1, 6],
    [4, 1, 7, 6, 3, 9, 8, 2, 5],
    [1, 3, 6, 8, 9, 5, 7, 4, 2],
    [8, 9, 2, 3, 4, 7, 5, 6, 1],
    [7, 4, 5, 1, 6, 2, 9, 3, 8],
    [3, 6, 1, 5, 7, 4, 2, 8, 9],
    [2, 7, 4, 9, 8, 6, 1, 5, 3],
    [5, 8, 9, 2, 1, 3, 6, 7, 4]
    /* eslint-enable @typescript-eslint/no-magic-numbers */
  ]
};

/** @type {import('.').HTMLBoard} */
export const htmlBoard = [];

export const
  /** @type {HTMLTableElement} */ sudoku = document.querySelector('#sudoku'),
  /** @type {HTMLOutputElement} */ difficultyOutput = document.querySelector('#difficulty-slider + output'),
  /** @type {HTMLDivElement} */ loadingContainer = document.querySelector('#loading-container'),
  /** @type {Element[]} */ loadingContainerSiblings = [...loadingContainer.parentElement.children].filter(e => e != loadingContainer),
  /** @type {HTMLSpanElement[]} */ numberOverviewSpans = [...document.querySelectorAll('#number-overview > tbody > tr > td > span')],
  /** @type {HTMLButtonElement} */ solutionBtn = document.querySelector('#solution-btn'),
  /** @type {HTMLButtonElement} */ regenerateBtn = document.querySelector('#regenerate-btn'),
  /** @type {HTMLButtonElement} */ shareBtn = document.querySelector('#share-btn'),
  /** @type {HTMLInputElement} */ difficultySlider = document.querySelector('#difficulty-slider'),
  /** @type {HTMLInputElement} */ sizeOption = document.querySelector('#size-option'),
  /** @type {HTMLInputElement} */ bgColorSwitcher = document.querySelector('#bg-color-switch'),
  /** @type {HTMLInputElement} */ fgColorSwitcher = document.querySelector('#fg-color-switch'),
  /** @type {HTMLTimeElement} */ timer = document.querySelector('#timer');