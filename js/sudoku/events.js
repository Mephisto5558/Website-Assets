import { difficultyOutput, difficultySlider, htmlBoard, sizeOption, sudoku } from './constants.js';
import { checkErrors, startTimer, updateNumberOverviewSpan, updateMinMax } from './utils.js';

export default undefined; // Needed to load it in without actually importing anything

sudoku.addEventListener('keypress', event => {
  event.preventDefault();

  if (event.key === ' ') {
    if (event.target.value) updateNumberOverviewSpan(Number(event.target.value), false);

    event.target.value = '';
    return checkErrors(htmlBoard);
  }

  if (!/^\d$/.test(event.key)) return;

  const newNumber = Number(event.target.value + event.key);
  if (!newNumber || newNumber > htmlBoard.length) return;

  if (!globalThis.timerInterval) startTimer();

  if (event.target.value) updateNumberOverviewSpan(Number(event.target.value), false);

  event.target.value = newNumber;
  updateNumberOverviewSpan(newNumber, true);

  checkErrors(htmlBoard);
});

const eventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
sudoku.addEventListener('keydown', event => {
  if (event.key == 'Backspace') {
    updateNumberOverviewSpan(Number(event.target.value), false);

    event.target.value = '';
    checkErrors(htmlBoard);
    return event.preventDefault();
  }

  if (!eventKeys.includes(event.key)) return;
  event.preventDefault();

  const boardMax = htmlBoard.length - 1;

  /* eslint-disable @typescript-eslint/no-magic-numbers */
  let nextCell;
  if (event.key == eventKeys[5] || event.key == eventKeys[6]) {
    const fn = event.key == eventKeys[5] ? 'find' : 'findLast';
    const findCell = cell => !cell.disabled && (!event.shiftKey || cell.dataset.group == event.target.dataset.group);
    nextCell = (event.ctrlKey ? htmlBoard[fn](row => row.some(findCell)) : htmlBoard[Number(event.target.dataset.row) - 1])[fn](findCell);
  }

  while ((!nextCell || nextCell.disabled) && !(nextCell && nextCell.dataset.row == event.target.dataset.row && nextCell.dataset.col == event.target.dataset.col)) {
    const rowId = Number((nextCell ?? event.target).dataset.row) - 1;
    const colId = Number((nextCell ?? event.target).dataset.col) - 1;

    switch (event.key) {
      case eventKeys[0]: nextCell = htmlBoard[rowId == 0 ? boardMax : rowId - 1][colId]; break;
      case eventKeys[1]: nextCell = htmlBoard[rowId == boardMax ? 0 : rowId + 1][colId]; break;
      case eventKeys[2]: nextCell = htmlBoard[rowId][colId == 0 ? boardMax : colId - 1]; break;
      case eventKeys[3]: nextCell = htmlBoard[rowId][colId == boardMax ? 0 : colId + 1]; break;
      case eventKeys[4]:
        if (event.shiftKey) {
          // backwards cyclic
          if (rowId == 0 && colId == 0) nextCell = htmlBoard[boardMax][boardMax];
          else if (colId == 0) nextCell = htmlBoard[rowId - 1][boardMax];
          else nextCell = htmlBoard[rowId][colId - 1];
          break;
        }

        // forwards cyclic
        if (rowId == boardMax && colId == boardMax) nextCell = htmlBoard[0][0];
        else if (colId == boardMax) nextCell = htmlBoard[rowId + 1][0];
        else nextCell = htmlBoard[rowId][colId + 1];
        break;
    }
    /* eslint-enable @typescript-eslint/no-magic-numbers */
  }

  nextCell.focus();
});

document.querySelector('#stepper-up').addEventListener('click', () => {
  sizeOption.stepUp();
  sizeOption.dispatchEvent(new Event('change', { bubbles: true }));
});

document.querySelector('#stepper-down').addEventListener('click', () => {
  sizeOption.stepDown();
  sizeOption.dispatchEvent(new Event('change', { bubbles: true }));
});

sizeOption.addEventListener('change', updateMinMax);
difficultySlider.addEventListener('input', event => difficultyOutput.textContent = event.target.value);