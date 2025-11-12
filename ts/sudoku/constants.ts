/* eslint-disable @typescript-eslint/no-non-null-assertion */

globalThis.debug = false;
/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/no-redundant-boolean, no-constant-binary-expression */
globalThis.debugBoard = true && globalThis.debug;
globalThis.runBench = false;

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
export const MAX_GENERATION_ATTEMPTS = 5;

export const MS_IN_SEC = 1000;
export const SEC_IN_MIN = 60;

export const REPORT_PROD_WORKER_URL = 'https://mephisto5558.github.io/Website-Assets/min/js/sudoku/sudoku.worker.js';

export const htmlBoard: HTMLBoard = [];

export const
  sudoku = document.querySelector<HTMLTableElement>('#sudoku')!,
  difficultyOutput = document.querySelector<HTMLOutputElement>('#difficulty-slider + output')!,
  loadingContainer = document.querySelector<HTMLDivElement>('#loading-container')!,
  loadingContainerSiblings = [...loadingContainer.parentElement!.children].filter(e => e != loadingContainer),
  numberOverviewTable = document.querySelector<HTMLTableElement>('#number-overview')!,
  numberOverviewSpans = [...numberOverviewTable.querySelectorAll<HTMLSpanElement>('tbody > tr > td > span')],
  solutionBtn = document.querySelector<HTMLButtonElement>('#solution-btn')!,
  regenerateBtn = document.querySelector<HTMLButtonElement>('#regenerate-btn')!,
  shareBtn = document.querySelector<HTMLButtonElement>('#share-btn')!,
  difficultySlider = document.querySelector<HTMLInputElement>('#difficulty-slider')!,
  sizeOption = document.querySelector<HTMLInputElement>('#size-option')!,
  bgColorSwitcher = document.querySelector<HTMLInputElement>('#bg-color-switch')!,
  fgColorSwitcher = document.querySelector<HTMLInputElement>('#fg-color-switch')!,
  timer = document.querySelector<HTMLTimeElement>('#timer')!,
  cancelBtn = document.querySelector<HTMLButtonElement>('#cancel-loading')!;