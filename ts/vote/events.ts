import { searchBoxElement, msInSecond, headerContainer, WINDOW_WIDTH_RELOAD_TRESHOLD, ADDITIONAL_HEADER_MARGIN } from './constants';
import { debounce, displayCards, toggleCardDisplayMode, setColorScheme } from './utils';
import state from './state';

export default undefined; // Needed to load it in without actually importing anything

searchBoxElement.addEventListener('input', debounce((event: Event) => {
  if (!(event.target instanceof HTMLInputElement)) return; // typeguard

  if (event.target.value.length > event.target.maxLength) event.target.value = event.target.value.slice(0, event.target.maxLength);

  state.cardsOffset = 0;

  const cards = displayCards(event.target.value);
  document.querySelector<HTMLSpanElement>('#feature-request-count > span')!.textContent = cards.length.toLocaleString();
}, msInSecond / 2));


headerContainer.querySelector<HTMLButtonElement>('#toggle-cards-display')!.addEventListener('click', () => toggleCardDisplayMode());
headerContainer.querySelector<HTMLButtonElement>('#toggle-color-scheme')!.addEventListener('click', () => setColorScheme());

window.addEventListener('scroll', () => {
  if (state.cardsCache.size > state.cardsOffset && document.documentElement.scrollTop + document.documentElement.clientHeight >= document.documentElement.scrollHeight - ADDITIONAL_HEADER_MARGIN) displayCards();
});

let oldWindowWidth = window.innerWidth;
window.addEventListener('resize', debounce(() => {
  const currentWidth = window.innerWidth;

  if (
    oldWindowWidth >= WINDOW_WIDTH_RELOAD_TRESHOLD && currentWidth < WINDOW_WIDTH_RELOAD_TRESHOLD
    || oldWindowWidth < WINDOW_WIDTH_RELOAD_TRESHOLD && currentWidth >= WINDOW_WIDTH_RELOAD_TRESHOLD
  ) globalThis.location.reload();
  else oldWindowWidth = currentWidth;
}, msInSecond / 2));
window.addEventListener('beforeunload', event => {
  if (document.body.querySelectorAll('.card[modified]').length) event.preventDefault(); // Triggers "you have unsaved changes" dialog box
});