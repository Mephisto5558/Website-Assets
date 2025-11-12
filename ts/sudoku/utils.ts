/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { DEFAULT_BOARD_SIZE, MAX_HOLES_PERCENTAGE, MIN_HOLES_PERCENTAGE, MS_IN_SEC, SEC_IN_MIN, difficultyOutput, difficultySlider, numberOverviewSpans, sizeOption, timer } from './constants';

const
  popupTileElement = document.querySelector<HTMLHeadElement>('#popup-container > h3')!,
  popupPElement = document.querySelector<HTMLParagraphElement>('#popup-container > p')!;

export function setRootStyle(key: string, value: string | null, priority?: string): void {
  return document.documentElement.style.setProperty(key, value, priority);
}

export function getRootStyle(key: string): string {
  return globalThis.getComputedStyle(document.documentElement).getPropertyValue(key);
}

export function invertHex(hex: string): `#${string}` {
  hex = hex.replace('#', '');
  /* eslint-disable-next-line @typescript-eslint/no-magic-numbers, @typescript-eslint/no-misused-spread, @typescript-eslint/no-unsafe-type-assertion -- hex math */
  return '#' + (hex.length == 3 ? [...hex] : hex.match(/\w{2}/g)!).map(e => (255 - Number.parseInt(e, 16)).toString(16).padStart(2, '0')).join('') as `#${string}`;
}

export async function saveToClipboard(value: string): Promise<void> {
  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- is `undefined` on HTTP pages */
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
    /* eslint-disable-next-line @typescript-eslint/no-deprecated -- workaround for HTTP context */
    if (!document.execCommand('copy')) throw new Error('Did not save');
    sendPopup('Saved the link in your clipboard.');
  }
  catch (err) {
    console.error('Could not copy to clipboard using document.execCommand:', err);
    sendPopup('Error', 'Cold not copy the URL to your clipboard. Please copy it manually from the address bar.');
  }

  copyArea.remove();
}

export function initializeColorPicker(picker: HTMLInputElement, storageKey: string, onColorChange: (color: string) => void): void {
  const savedColor = localStorage.getItem(storageKey);
  picker.value = savedColor ?? getRootStyle(picker.dataset.cssProperty).trim();

  if (savedColor) onColorChange(savedColor);
  picker.addEventListener('change', event => {
    const newColor = event.target.value;
    localStorage.setItem(storageKey, newColor);
    onColorChange(newColor);
  });
}

export function getGroupId(rowId: number, colId: number, boxSize: number): number {
  return Math.floor(rowId / boxSize) * boxSize + Math.floor(colId / boxSize);
}

export function startTimer(): void {
  const start = performance.now();

  globalThis.timerInterval = setInterval(() => {
    const
      totalSecs = (performance.now() - start) / MS_IN_SEC,
      mins = Math.floor(totalSecs / SEC_IN_MIN).toString().padStart(2, '0'),
      secs = Math.round(totalSecs % SEC_IN_MIN).toString().padStart(2, '0');

    timer.textContent = `${mins}:${secs}`;
    timer.setAttribute('datetime', `PT${mins}M${secs}S`);
  }, MS_IN_SEC);
}

export function clearTimer(): void {
  clearInterval(globalThis.timerInterval);
  globalThis.timerInterval = undefined;

  timer.textContent = '00:00';
  timer.setAttribute('datetime', 'PT0S');
}

export function updateNumberOverviewSpan(val: number, up = false): void {
  const span = numberOverviewSpans[val - 1]!;
  span.textContent = (Number(span.textContent) + (up ? 1 : -1)).toString();
  if (Number(span.textContent) == numberOverviewSpans.length) {
    span.classList.add('complete');
    for (const noteSpan of document.querySelectorAll('#sudoku td > .notes > span')) {
      if (Number(noteSpan.textContent) != val) continue;

      noteSpan.textContent = '';
      noteSpan.classList.remove('visible');
    }
  }
  else span.classList.remove('complete');

  if (!numberOverviewSpans.some(e => !e.classList.contains('complete'))) {
    clearInterval(globalThis.timerInterval);
    globalThis.timerInterval = undefined;
  }
}

export function checkErrors(htmlBoard: HTMLBoard): void {
  const
    errorCells = new Set<`${number}-${number}`>(),
    findDuplicates = (cells: CellInput[]): void => {
      const seen = new Map<number, CellInput[]>();
      for (const cell of cells) {
        const value = Number(cell.value);
        if (!value) continue;

        if (!seen.has(value)) seen.set(value, []);
        seen.get(value)!.push(cell);
      }

      if ([...seen.values()].some(group => group.length > 1)) {
        for (const cell of cells)
          errorCells.add(`${cell.dataset.row}-${cell.dataset.col}`);
      }
    };

  for (let i = 0; i < htmlBoard.length; i++) {
    findDuplicates(htmlBoard[i]!); // check row
    findDuplicates(htmlBoard.map(row => row[i]!)); // check col
  }

  // check boxes
  const boxSize = Math.sqrt(htmlBoard.length);
  for (let boxRow = 0; boxRow < boxSize; boxRow++) {
    for (let boxCol = 0; boxCol < boxSize; boxCol++) {
      const boxCells = [];

      for (let rowId = 0; rowId < boxSize; rowId++) {
        for (let colId = 0; colId < boxSize; colId++)
          boxCells.push(htmlBoard[boxRow * boxSize + rowId]![boxCol * boxSize + colId]!);
      }

      findDuplicates(boxCells);
    }
  }

  for (const cell of htmlBoard.flat())
    cell.parentElement!.classList.toggle('error', errorCells.has(`${cell.dataset.row}-${cell.dataset.col}`));
}

export function updateMinMax(): { size: number; minHoles: number; maxHoles: number; holes: number } {
  const size = Number(sizeOption.value) ** 2 || DEFAULT_BOARD_SIZE;
  sizeOption.value = Math.sqrt(size).toString();

  const
    minHoles = Math.floor(size ** 2 * MIN_HOLES_PERCENTAGE),
    maxHoles = Math.ceil(size ** 2 * MAX_HOLES_PERCENTAGE);

  difficultySlider.min = minHoles.toString();
  difficultySlider.max = maxHoles.toString();

  const holes = Number(difficultySlider.value) || rando(minHoles, maxHoles);
  difficultySlider.value = holes.toString();
  difficultyOutput.textContent = holes.toString();

  return { size, minHoles, maxHoles, holes };
}

export function sendPopup(title: string, text = ''): void {
  if (title !== text) popupTileElement.textContent = title;
  popupPElement.textContent = text;

  popupTileElement.parentElement!.classList.add('visible');

  /* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- 3s */
  setTimeout(() => popupTileElement.parentElement!.classList.remove('visible'), MS_IN_SEC * 3);
}