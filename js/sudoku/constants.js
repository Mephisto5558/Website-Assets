globalThis.debug = false;
/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/no-redundant-boolean, no-constant-binary-expression */
globalThis.debugBoard = true && globalThis.debug;

export const DEBUG_BOARDS = new Map([
  /* eslint-disable @typescript-eslint/no-magic-numbers */
  [4, '?s=2kCWOHm&m=e7W&d=4'],
  [9, '?s=1rNvQlP59hY1UJMFE5DX3hwk1qIBLnXS6ilfDGy4IGdhsC&m=bIF2NvxgrvtuEt&d=9'],
  [16, '?s=hpbjaN1Y0HMLqNcMAz1H6NmKmOMSDZBpjCBHl8dhKhATBXumBoANHGsbnmOEzTkz6ySCcfcC4LMrWKjtcnj7WF611o0NmqeiqasiTMDrNBWf7kUCpC1Yb6ExeVjZ4TopShgiCbnIhyYaAhkHaUko7rwbO5VpQjDjH8lgDvr8EmRs3VS0&m=UqAbrOMIk6BBuY6VoSasyyUP7hzZqaraIZQyp6q0d2J&d=g'],
  [25, '?s=1rCOSfPzQOeudAZ9m8Oy999CxkkEVldIOJFUQEzxCP0r9UpEghirv6argXEaeTgmFYGzgU8w37AXKDnq1IC0OaZKuAvq2ucit93d8QafCLcltCc3M8iLsyB5YfUYPyTZEe4EDhfYkrlHVw5j5Plk4mYBTbKOX4xZuma0ICk8wlKzNbyotO8cPBfgPywdrp1TQtzS57O0argCrwnk6sXZ1kouvQnvDNzZwTQrhbYXNNnSkhLcEAhqKROi73cr1QEG06ZZwY7SyInKwV10zh0O8vxcKrja7V1VKGi6mIClU82DjhSIiXukRMGreXgDv2ghXfmDNqBDlFhbagGCDjnW7WsTK3vIcGuadHO9PN3MYzCdHNohcJZaT0u7VgCuWCMd9ZO5FiRbkNIq3DPnwam2o6KVfCT3VXIPNmMZjQwBr9jvOzeBCfxlcz4mG4hUQJKsFx6fGurD0SWDHO0Wpx42YGO7SkyMQR6uqDLNyuKW7tbUMF&m=r6qJKq3BQDgjsNIGdaTn0gci7SzX3ietXdo8f974O25AjVapd2FbtnCSkyMKM27thA7WQiYgplCd2l534CNK7AOmHyy5Uz0G2ObKhElWX&d=p']
  /* eslint-enable @typescript-eslint/no-magic-numbers */
]);

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
  /** @type {HTMLTimeElement} */ timer = document.querySelector('#timer'),
  /** @type {HTMLButtonElement} */ cancelBtn = document.querySelector('#cancel-loading');