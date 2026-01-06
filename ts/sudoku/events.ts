/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

import { Key, cancelBtn, difficultyOutput, difficultySlider, htmlBoard, sizeOption, sudokuTable } from './constants';
import { checkErrors, sendPopup, startTimer, updateMinMax, updateNumberOverviewSpan } from './utils';


type T_KeyboardEvent = StrictOmit<KeyboardEvent, 'key'> & { readonly key: Key };

function handleNormalInput(target: CellInput, key: string): void {
  let newNumber = Number(target.value + key);
  if (newNumber > htmlBoard.length) newNumber = Number(key);

  if (target.value) updateNumberOverviewSpan(Number(target.value), false);

  target.value = newNumber.toString();
  updateNumberOverviewSpan(newNumber, true);
}

function handleNotesInput(target: CellInput | NoteElement, key: string): void {
  let noteSpan: NoteElement | undefined;

  if (target instanceof HTMLSpanElement) noteSpan = target;
  else if (target instanceof HTMLInputElement) {
    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    noteSpan = [...target.parentElement.querySelector<NoteDiv>('.notes')!.children].find(span => !span.textContent || span.textContent === key);
  }

  if (!noteSpan) return sendPopup('Notes full', `Your notes in row ${target.parentElement.firstChild.dataset.row}, column ${target.parentElement.firstChild.dataset.row} are full!\nYou can edit one by clicking on it.`);

  let newNumber = Number(noteSpan.textContent + key);
  if (newNumber > htmlBoard.length) newNumber = Number(key);

  noteSpan.textContent = newNumber.toString();
  noteSpan.classList.add('visible');
}


function clearInput(target?: CellInput | NoteElement | null): void {
  if (sudokuTable.classList.contains('notes-mode') && target instanceof HTMLInputElement)
    target = target.parentElement.querySelector<NoteElement>('.notes > span.visible:nth-last-child(1 of .visible)');
  if (!target) return;
  if (target instanceof HTMLSpanElement) {
    target.textContent = '';
    return target.classList.remove('visible');
  }

  updateNumberOverviewSpan(Number(target.value), false);
  target.value = '';
}

sudokuTable.addEventListener('keypress', (event: KeyboardEvent) => {
  const notesMode = sudokuTable.classList.contains('notes-mode');

  event.preventDefault();
  if (event.key == ' ') clearInput(event.target as CellInput | NoteElement);

  if (!/^[1-9]\d*$/.test(event.key)) return;
  if (notesMode && htmlBoard.length < 10 && event.target instanceof HTMLInputElement) {
    const noteSpan = [...(event.target as CellInput).parentElement.querySelector<NoteDiv>('.notes')?.children ?? []].find(e => e.textContent.trim() == event.key);
    if (noteSpan) return clearInput(noteSpan);
  }

  if (!globalThis.timerInterval) startTimer();

  if (notesMode) return handleNotesInput(event.target as CellInput | NoteElement, event.key);
  else if (event.target instanceof HTMLInputElement) return handleNormalInput(event.target as CellInput, event.key);
});

// @ts-expect-error -- overwritten KeyBoardEvent
sudokuTable.addEventListener('keydown', (event: T_KeyboardEvent) => {
  if (event.target instanceof HTMLSpanElement && event.key === Key.Enter) return event.target.blur();
  if ([Key.BackSpace, Key.Delete].includes(event.key)) {
    event.preventDefault();
    return clearInput(event.target as CellInput | NoteElement);
  }
  if (![Key.ArrowUp, Key.ArrowDown, Key.ArrowLeft, Key.ArrowRight, Key.Tab, Key.Home, Key.End].includes(event.key)) return;

  if (!(event.target instanceof HTMLInputElement)) event.preventDefault();

  const
    boardMax = htmlBoard.length - 1,
    findCell = (cell: CellInput): boolean => !cell.disabled && (!event.shiftKey || cell.dataset.group == (event.target as CellInput).dataset.group);

  let nextCell: CellInput | undefined;
  /* eslint-disable @typescript-eslint/no-non-null-assertion */
  if (event.key == Key.Home)
    nextCell = (event.ctrlKey ? htmlBoard.find(row => row.some(findCell)) : htmlBoard[Number((event.target as CellInput).dataset.row) - 1])!.find(findCell);
  else if (event.key == Key.End)
    nextCell = (event.ctrlKey ? htmlBoard.findLast(row => row.some(findCell)) : htmlBoard[Number((event.target as CellInput).dataset.row) - 1])!.findLast(findCell);
  /* eslint-enable @typescript-eslint/no-non-null-assertion */

  while ((!nextCell || nextCell.disabled) && !(nextCell && nextCell.dataset.row == (event.target as CellInput).dataset.row && nextCell.dataset.col == (event.target as CellInput).dataset.col)) {
    const
      rowId: number = Number((nextCell ?? event.target as CellInput).dataset.row) - 1,
      colId: number = Number((nextCell ?? event.target as CellInput).dataset.col) - 1;

    switch (event.key) {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      case Key.ArrowUp: nextCell = htmlBoard[rowId == 0 ? boardMax : rowId - 1]![colId]; break;
      case Key.ArrowDown: nextCell = htmlBoard[rowId == boardMax ? 0 : rowId + 1]![colId]; break;
      case Key.ArrowLeft: nextCell = htmlBoard[rowId]![colId == 0 ? boardMax : colId - 1]; break;
      case Key.ArrowRight: nextCell = htmlBoard[rowId]![colId == boardMax ? 0 : colId + 1]; break;
      case Key.Tab:
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
      default: break;
      /* eslint-enable @typescript-eslint/no-non-null-assertion */
    }
  }

  nextCell.focus();
});

sudokuTable.addEventListener('keyup', event => {
  if (event.target instanceof HTMLInputElement) return checkErrors(htmlBoard);
});

// blur is like "change" but for contenteditable elements
sudokuTable.addEventListener('blur', event => {
  if (event.target instanceof HTMLSpanElement && !event.target.textContent) return event.target.classList.remove('visible');
}, true);

/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
document.querySelector<HTMLButtonElement>('#stepper-up')!.addEventListener('click', () => {
  sizeOption.stepUp();
  sizeOption.dispatchEvent(new Event('change', { bubbles: true }));
});

/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
document.querySelector<HTMLButtonElement>('#stepper-down')!.addEventListener('click', () => {
  sizeOption.stepDown();
  sizeOption.dispatchEvent(new Event('change', { bubbles: true }));
});

sizeOption.addEventListener('change', updateMinMax);
difficultySlider.addEventListener('input', event => difficultyOutput.textContent = (event.target as typeof difficultySlider).value);

cancelBtn.addEventListener('click', () => {
  globalThis.sudokuWorker?.dispatchEvent(new MessageEvent('message', { data: { type: 'cancel', message: 'user cancel request' } }));
});

/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
document.querySelector<HTMLButtonElement>('#toggle-notes-btn')!.addEventListener('click', event => {
  (event.target as HTMLButtonElement).textContent = `${sudokuTable.classList.toggle('notes-mode') ? 'Disable' : 'Enable'} Notes Mode`;
});