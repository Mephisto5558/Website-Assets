globalThis.debug = false;
/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/no-redundant-boolean, no-constant-binary-expression */
globalThis.debugBoard = true && globalThis.debug;

export const DEFAULT_BOARD_SIZE = 9;
export const MIN_HOLES_PERCENTAGE = .2;
export const MAX_HOLES_PERCENTAGE = .75;

export const MS_IN_SEC = 1000;
export const SEC_IN_MIN = 60;

export const REPORT_PROD_WORKER_URL = 'https://mephisto5558.github.io/Website-Assets/min/js/sudoku/sudoku.worker.js';

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