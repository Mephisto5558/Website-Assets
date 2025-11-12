/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { cancelBtn, difficultyOutput, difficultySlider, htmlBoard, sizeOption, sudoku } from './constants';
import { checkErrors, sendPopup, startTimer, updateMinMax, updateNumberOverviewSpan } from './utils';

export default undefined; // Needed to load it in without actually importing anything

function handleNormalInput(target: HTMLInputElement, key: string): void {
  let newNumber = Number(target.value + key);
  if (newNumber > htmlBoard.length) newNumber = Number(key);

  if (target.value) updateNumberOverviewSpan(Number(target.value), false);

  target.value = newNumber.toString();
  updateNumberOverviewSpan(newNumber, true);
  checkErrors(htmlBoard);
}

function handleNotesInput(target: HTMLInputElement | NoteElement, key: string): void {
  let noteSpan: NoteElement | undefined;

  if (target instanceof HTMLSpanElement) noteSpan = target;
  else if (target instanceof HTMLInputElement) {
    const notes = [...target.parentElement!.querySelector('.notes')!.children] as NoteElement[];
    noteSpan = notes.find(span => !span.textContent || span.textContent === key);
  }

  if (!noteSpan) return sendPopup('Notes full', `Your notes in row ${target.parentElement!.firstChild!.dataset.row}, column ${target.parentElement!.firstChild!.dataset.row} are full!\nYou can edit one by clicking on it.`);

  let newNumber = Number(noteSpan.textContent + key);
  if (newNumber > htmlBoard.length) newNumber = Number(key);

  noteSpan.textContent = newNumber.toString();
  noteSpan.classList.add('visible');
}

function clearNote(target: HTMLSpanElement): void {
  target.textContent = '';
  target.classList.remove('visible');
}

function clearInput(target: HTMLInputElement): void {
  updateNumberOverviewSpan(Number(target.value), false);

  target.value = '';
  checkErrors(htmlBoard);
}

sudoku.addEventListener('keypress', event => {
  event.preventDefault();

  const notesMode = sudoku.classList.contains('notes-mode');

  if (event.key === ' ') {
    if (notesMode && event.target.matches('.notes > span'))
      return clearNote(event.target);

    if (!notesMode && event.target.matches('input') && event.target.value)
      return clearInput(event.target);
  }

  if (!/^[1-9]\d*$/.test(event.key)) return;

  if (!globalThis.timerInterval) startTimer();

  if (notesMode) return handleNotesInput(event.target, event.key);
  if (event.target.matches('input')) return handleNormalInput(event.target, event.key);
});

const eventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', 'Backspace'];
sudoku.addEventListener('keydown', event => {
  if (eventKeys.includes(event.key) && event.target.tagName != 'INPUT') event.preventDefault();

  if (event.key === 'Enter' && event.target.tagName == 'SPAN') return event.target.blur();
  if (event.target.tagName != 'INPUT' || !eventKeys.includes(event.key)) return;
  if (event.key == eventKeys[7]) return clearInput(event.target);

  event.preventDefault();

  const boardMax = htmlBoard.length - 1;

  /* eslint-disable @typescript-eslint/no-magic-numbers */
  let nextCell: CellInput | undefined;
  if (event.key == eventKeys[5] || event.key == eventKeys[6]) {
    const
      fn = event.key == eventKeys[5] ? 'find' : 'findLast',
      findCell = (cell: HTMLElement): boolean => !cell.disabled && (!event.shiftKey || cell.dataset.group == event.target.dataset.group);

    nextCell = (event.ctrlKey ? htmlBoard[fn](row => row.some(findCell)) : htmlBoard[Number(event.target.dataset.row) - 1])[fn](findCell);
  }

  while ((!nextCell || nextCell.disabled) && !(nextCell && nextCell.dataset.row == event.target.dataset.row && nextCell.dataset.col == event.target.dataset.col)) {
    const
      rowId: number = Number((nextCell ?? event.target).dataset.row) - 1,
      colId: number = Number((nextCell ?? event.target).dataset.col) - 1;

    switch (event.key) {
      case eventKeys[0]: nextCell = htmlBoard[rowId == 0 ? boardMax : rowId - 1]![colId]; break;
      case eventKeys[1]: nextCell = htmlBoard[rowId == boardMax ? 0 : rowId + 1]![colId]; break;
      case eventKeys[2]: nextCell = htmlBoard[rowId]![colId == 0 ? boardMax : colId - 1]; break;
      case eventKeys[3]: nextCell = htmlBoard[rowId]![colId == boardMax ? 0 : colId + 1]; break;
      case eventKeys[4]:
        if (event.shiftKey) {
          // backwards cyclic
          if (rowId == 0 && colId == 0) nextCell = htmlBoard[boardMax]![boardMax];
          else if (colId == 0) nextCell = htmlBoard[rowId - 1]![boardMax];
          else nextCell = htmlBoard[rowId]![colId - 1];
          break;
        }

        // forwards cyclic
        if (rowId == boardMax && colId == boardMax) nextCell = htmlBoard[0]![0];
        else if (colId == boardMax) nextCell = htmlBoard[rowId + 1]![0];
        else nextCell = htmlBoard[rowId]![colId + 1];
        break;
    }
    /* eslint-enable @typescript-eslint/no-magic-numbers */
  }

  nextCell.focus();
});

// blur is like "change" but for contenteditable elements
sudoku.addEventListener('blur', event => {
  if (event.target instanceof HTMLSpanElement && !event.target.textContent) return event.target.classList.remove('visible');
}, true);

document.querySelector<HTMLButtonElement>('#stepper-up')!.addEventListener('click', () => {
  sizeOption.stepUp();
  sizeOption.dispatchEvent(new Event('change', { bubbles: true }));
});

document.querySelector<HTMLButtonElement>('#stepper-down')!.addEventListener('click', () => {
  sizeOption.stepDown();
  sizeOption.dispatchEvent(new Event('change', { bubbles: true }));
});

sizeOption.addEventListener('change', updateMinMax);
difficultySlider.addEventListener('input', event => difficultyOutput.textContent = event.target.value);

cancelBtn.addEventListener('click', () => {
  globalThis.sudokuWorker?.terminate();
  globalThis.sudokuWorker?.dispatchEvent(new MessageEvent('message', { data: { type: 'cancel', message: 'user request' } }));
  delete globalThis.sudokuWorker;
});

document.querySelector<HTMLButtonElement>('#toggle-notes-btn')!.addEventListener('click', event => {
  event.target!.textContent = `${sudoku.classList.toggle('notes-mode') ? 'Disable' : 'Enable'} Notes Mode`;
});