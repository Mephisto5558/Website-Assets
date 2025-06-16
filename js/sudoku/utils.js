import { DEFAULT_BOARD_SIZE, difficultyOutput, difficultySlider, MAX_HOLES_PERCENTAGE, MIN_HOLES_PERCENTAGE, MS_IN_SEC, numberOverviewSpans, SEC_IN_MIN, sizeOption, timer } from './constants.js';

const popupTileElement = document.querySelector('#popup-container > h3');
const popupPElement = document.querySelector('#popup-container > p');

/** @type {import('.')['setRootStyle']} */
export function setRootStyle(key, value, priority) {
  return document.documentElement.style.setProperty(key, value, priority);
}

/** @type {import('.')['getRootStyle']} */
export function getRootStyle(key) {
  return globalThis.getComputedStyle(document.documentElement).getPropertyValue(key);
}

/** @type {import('.')['invertHex']} */
export function invertHex(hex) {
  hex = hex.replace('#', '');
  /* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- hex math */
  return '#' + (hex.length == 3 ? [...hex] : hex.match(/\w{2}/g)).map(e => (255 - Number.parseInt(e, 16)).toString(16).padStart(2, '0')).join('');
}

/** @type {import('.')['saveToClipboard']} */
export async function saveToClipboard(value) {
  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions -- is `undefined` on HTTP pages */
  if (globalThis.navigator.clipboard) {
    await globalThis.navigator.clipboard.writeText(value);
    return sendPopup('Saved the link in your clipboard.');
  }

  const copyArea = document.createElement('textarea');
  copyArea.value = value;
  copyArea.classList.add('hidden');

  document.body.append(copyArea);
  copyArea.focus({ preventScroll: true });
  copyArea.select();

  try {
    /* eslint-disable-next-line @typescript-eslint/no-deprecated -- workaround for HTTP context*/
    if (!document.execCommand('copy')) throw new Error('Did not save');
    sendPopup('Saved the link in your clipboard.');
  }
  catch (err) {
    console.error('Could not copy to clipboard using document.execCommand:', err);
    sendPopup('Error', 'Cold not copy the URL to your clipboard. Please copy it manually from the address bar.');
  }

  copyArea.remove();
}

/** @type {import('.')['initializeColorPicker']} */
export function initializeColorPicker(picker, storageKey, onColorChange) {
  const savedColor = localStorage.getItem(storageKey);
  picker.value = savedColor ?? getRootStyle(picker.dataset.cssProperty).trim();

  if (savedColor) onColorChange(savedColor);
  picker.addEventListener('change', event => {
    const newColor = event.target.value;
    localStorage.setItem(storageKey, newColor);
    onColorChange(newColor);
  });
}

/** @type {import('.')['getGroupId']} */
export function getGroupId(rowId, colId, boxSize) {
  return Math.floor(rowId / boxSize) * boxSize + Math.floor(colId / boxSize);
}

/** @type {import('.')['startTimer']} */
export function startTimer() {
  const start = performance.now();

  globalThis.timerInterval = setInterval(() => {
    const totalSecs = (performance.now() - start) / MS_IN_SEC;
    const mins = Math.floor(totalSecs / SEC_IN_MIN).toString().padStart(2, '0');
    const secs = Math.round(totalSecs % SEC_IN_MIN).toString().padStart(2, '0');

    timer.textContent = `${mins}:${secs}`;
    timer.setAttribute('datetime', `PT${mins}M${secs}S`);
  }, MS_IN_SEC);
}

/** @type {import('.')['clearTimer']} */
export function clearTimer() {
  globalThis.timerInterval = clearInterval(globalThis.timerInterval);
  timer.textContent = '00:00';
  timer.setAttribute('datetime', 'PT0S');
}

/** @type {import('.')['updateNumberOverviewSpan']} */
export function updateNumberOverviewSpan(val, up = true) {
  const span = numberOverviewSpans[val - 1];
  span.textContent = Number(span.textContent) + (up ? 1 : -1);
  if (span.textContent == numberOverviewSpans.length) {
    span.classList.add('complete');
    for (const noteSpan of document.querySelectorAll('#sudoku td > .notes > span')) {
      if (noteSpan.textContent != val) continue;

      noteSpan.textContent = '';
      noteSpan.classList.remove('visible');
    }
  }
  else span.classList.remove('complete');

  if (!numberOverviewSpans.some(e => !e.classList.contains('complete')))
    globalThis.timerInterval = clearInterval(globalThis.timerInterval);
}

/** @type {import('.')['checkErrors']} */
export function checkErrors(htmlBoard) {
  /* eslint-disable-next-line jsdoc/valid-types */
  /** @type {Set<`${number}-${number}`>} */
  const errorCells = new Set();

  /** @param {import('.').CellInput[]} cells */
  const findDuplicates = cells => {
    /** @type {Map<number, import('.').CellInput[]>} */
    const seen = new Map();
    for (const cell of cells) {
      const value = Number(cell.value);
      if (!value) continue;

      if (!seen.has(value)) seen.set(value, []);
      seen.get(value).push(cell);
    }

    if ([...seen.values()].some(group => group.length > 1)) {
      for (const cell of cells)
        errorCells.add(`${cell.dataset.row}-${cell.dataset.col}`);
    }
  };

  for (let i = 0; i < htmlBoard.length; i++) {
    findDuplicates(htmlBoard[i]); // check row
    findDuplicates(htmlBoard.map(row => row[i])); // check col
  }

  // check boxes
  const boxSize = Math.sqrt(htmlBoard.length);
  for (let boxRow = 0; boxRow < boxSize; boxRow++) {
    for (let boxCol = 0; boxCol < boxSize; boxCol++) {
      const boxCells = [];

      for (let rowId = 0; rowId < boxSize; rowId++) {
        for (let colId = 0; colId < boxSize; colId++)
          boxCells.push(htmlBoard[boxRow * boxSize + rowId][boxCol * boxSize + colId]);
      }

      findDuplicates(boxCells);
    }
  }

  for (const cell of htmlBoard.flat())
    cell.parentElement.classList[errorCells.has(`${cell.dataset.row}-${cell.dataset.col}`) ? 'add' : 'remove']('error');
}

/** @type {import('.')['updateMinMax']} */
export function updateMinMax() {
  const size = Number(sizeOption.value) ** 2 || DEFAULT_BOARD_SIZE;
  sizeOption.value = Math.sqrt(size);

  const minHoles = Math.floor(size ** 2 * MIN_HOLES_PERCENTAGE);
  const maxHoles = Math.ceil(size ** 2 * MAX_HOLES_PERCENTAGE);
  difficultySlider.min = minHoles;
  difficultySlider.max = maxHoles;

  const holes = Number(difficultySlider.value) || rando(minHoles, maxHoles);
  difficultySlider.value = holes;
  difficultyOutput.textContent = holes;

  return { size, minHoles, maxHoles, holes };
}

/** @type {import('.')['sendPopup']} */
export function sendPopup(title, text = title) {
  if (title !== text) popupTileElement.textContent = title;
  popupPElement.textContent = text;

  popupTileElement.parentElement.classList.add('visible');
  setTimeout(() => popupTileElement.parentElement.classList.remove('visible'), MS_IN_SEC * 3);
}