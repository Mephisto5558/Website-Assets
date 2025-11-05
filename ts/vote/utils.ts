/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { ADDITIONAL_HEADER_MARGIN, COLOR_TRANSITION_TIME, cardModes, cardsContainer, cardsContainerPending, headerContainer, msInSecond, searchBoxElement } from './constants';
import createElement from './createElement';
import state from './state';

export { createElement };

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export function debounce<CB extends (...args: any) => any>(callback: CB, delay: number): (...args: Parameters<CB>) => Promise<ReturnType<CB>> {
  let timer: ReturnType<typeof setTimeout>;

  return async (...args) => new Promise((res, rej) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- false positive */
      try { res(callback(...args)); }
      catch (err) { rej(err instanceof Error ? err : new Error(String(err))); }
    }, delay);
  });
}

export const sendUpvote = debounce(async (cardId: Card['id'], voteCounter: HTMLSpanElement): Promise<void> => {
  if (!state.user?.id) {
    return void Swal.fire({
      icon: 'error',
      title: 'Who are you?',
      text: 'You must be logged in to be able to vote!'
    });
  }

  let res = await fetchAPI('vote/addvote', {
    method: 'POST',
    body: JSON.stringify({ featureId: cardId })
  });

  try { res = await res.json(); }
  catch { /* empty */ }

  if (res.ok === false || res.error) return void Swal.fire({ icon: 'error', title: 'Oops...', text: res.error ?? res.statusText });

  void Swal.fire({
    icon: 'success',
    title: 'Success',
    text: 'Your vote has been successfully recorded.'
  });

  const card = state.cardsCache.get(cardId)!;
  card.votes = (card.votes ?? 0) + 1;
  voteCounter.textContent = card.votes.toLocaleString();

  state.cardsOffset = 0;
  displayCards();
}, msInSecond);

export async function fetchAPI(url: string, options: RequestInit | undefined = {}, timeout: number | undefined = 5000): Promise<Response | Error> {
  if (options.body != undefined && !options.headers) options.headers = { 'Content-Type': 'application/json' };

  const controller = new AbortController();
  options.signal = controller.signal;

  const
    timeoutId = setTimeout(() => controller.abort('Request timed out'), timeout),
    res = await fetch(`/api/v1/internal/${url}`, options).finally(() => clearTimeout(timeoutId));

  return res;
}

export async function fetchCards(): Promise<void> {
  const fetchedCards = new Map(
    ((await fetchAPI(`vote/list?includePending=${!!state.user?.dev}`).then(e => e.json()))?.cards as Card[] | undefined)
      ?.toSorted((a, b) => {
        if (!a.pending && b.pending) return 1;
        if (a.pending && !b.pending) return -1;
        return (b.votes ?? 0) - (a.votes ?? 0) || a.title.localeCompare(b.title);
      })
      .map(e => [e.id, e])
  );

  state.cardsCache.clear();
  for (const [k, v] of fetchedCards) state.cardsCache.set(k, v);
}

export function updateParams(key: string, value?: string): void {
  const
    url = new URL(globalThis.location.href),
    params = new URLSearchParams(globalThis.location.search);

  value ? params.set(key, value) : params.delete(key);
  url.search = params.toString();

  globalThis.history.pushState(undefined, '', url.toString());
}

/**
 * @param amount More like a max amount; will load more if the screen is not filled yet.
 * @returns all fetched cards, including not displayed ones */
export function displayCards(query: string | undefined = searchBoxElement.value, amount: number | undefined = 26): Card[] | undefined {
  query = query.toLowerCase();
  updateParams('q', query);

  /* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- boolean check */
  const cards = query ? [...state.cardsCache.values()].filter(e => e.title.toLowerCase().includes(query) || e.body?.toLowerCase().includes(query) || e.id.toLowerCase().includes(query)) : [...state.cardsCache.values()];
  if (!cards.length && !cardsContainer.childElementCount && !cardsContainerPending.childElementCount) return void createElement('h2', { textContent: `There are currently no feature requests${query ? ' matching your search query' : ''} :(` }, cardsContainer, true);

  if (!state.cardsOffset) {
    cardsContainer.innerHTML = '';
    cardsContainerPending.innerHTML = '';
  }

  for (const card of cards.slice(state.cardsOffset, amount + state.cardsOffset)) createCardElement(card);

  state.cardsOffset += amount;
  if (state.cardsCache.size > state.cardsOffset) {
    if (cardsContainer.childElementCount + cardsContainerPending.childElementCount < amount) displayCards(query, amount);
    else if (cardsContainer.clientHeight < window.innerHeight) { // Prevent having to add a "load more" button for big screens/large zoomout
      // displaying the approximate amount of cards required to have more than displayable (user scrolls = more cards load)
      displayCards(query, Math.ceil((window.innerHeight - cardsContainer.clientHeight) / (cardsContainer.clientHeight / cardsContainer.childElementCount)));
    }
  }

  return cards;
}

export function createCardElement(card: Card): void {
  const
    isDev = !!state.user?.dev,

    cardElement = createElement('div', { className: 'card', id: card.id }),

    titleElement = createElement('h2', { id: 'title', textContent: card.title, contentEditable: isDev ? 'plaintext-only' : 'false' }, cardElement),
    descriptionElement = card.body || isDev ? createElement('p', { id: 'description', textContent: card.body ?? '', contentEditable: isDev ? 'plaintext-only' : 'false' }, cardElement) : undefined,

    voteButtonsElement = createElement('div', { className: 'vote-buttons' }, cardElement),
    upvoteCounterElement = createElement('span', { className: 'vote-counter', textContent: card.pending ? '' : (card.votes ?? 0).toString() });

  if (card.pending && isDev) {
    createElement('button', { textContent: 'Approve', className: 'vote-button blue-button' }, voteButtonsElement).addEventListener('click', async () => {
      let res = await fetchAPI('vote/approve', {
        method: 'POST',
        body: JSON.stringify({ featureId: card.id })
      }).then(res => res.json()).catch(err => err);

      if (res.ok === false || res.error) return void Swal.fire({ icon: 'error', title: 'Oops...', text: res.error ?? res.statusText });

      void Swal.fire({ icon: 'success', title: 'Success', text: 'The feature request has been approved.' });

      cardsContainer.append(cardElement);
      if (!cardsContainerPending.childElementCount) {
        document.body.querySelector('#new-requests')?.remove();
        document.body.querySelector('#old-requests')?.remove();

        document.body.querySelector<HTMLElement>('#feature-request-overlay + *')!.style.marginTop = `${headerContainer.clientHeight + ADDITIONAL_HEADER_MARGIN}px`;
      }
    });
  }
  else if (!card.pending) {
    createElement('button', { className: 'vote-button blue-button', textContent: 'Upvote' }, voteButtonsElement)
      .addEventListener('click', async () => sendUpvote(card.id, upvoteCounterElement));
  }

  voteButtonsElement.append(upvoteCounterElement);

  const
    copyButtonElement = createElement('button', { title: 'Copy card Id', className: 'manage-button grey-hover' }, voteButtonsElement),
    copyButtonIcon = createElement('i', { className: 'far fa-copy fa-xl' }, copyButtonElement);

  copyButtonElement.addEventListener('click', () => {
    void navigator.clipboard.writeText(card.id);
    copyButtonIcon.classList = 'fas fa-check fa-xl';
    /* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- 3ms */
    setTimeout(() => copyButtonIcon.classList = 'far fa-copy fa-xl', msInSecond * 3);
  });

  if (isDev) {
    titleElement.addEventListener('keydown', event => {
      if (!(event.target instanceof HTMLElement) || !(event.target.parentElement instanceof HTMLElement)) return; // typeguard

      if (event.target.parentElement.hasAttribute('modified')) {
        if (event.target.textContent == card.title)
          event.target.parentElement.removeAttribute('modified');
      }
      else if (event.target.textContent != card.title)
        event.target.parentElement.setAttribute('modified', '');

      if (event.key !== 'Enter') return;
      event.preventDefault();
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
      (event.target.nextElementSibling!.firstElementChild! as HTMLElement).focus();
    });
    descriptionElement?.addEventListener('input', event => {
      if (!(event.target instanceof HTMLElement) || !(event.target.parentElement instanceof HTMLElement)) return; // typeguard

      if (event.target.parentElement.hasAttribute('modified')) {
        if (event.target.textContent == card.body)
          event.target.parentElement.removeAttribute('modified');
      }
      else if (event.target.textContent != card.body)
        event.target.parentElement.setAttribute('modified', '');
    });
  }

  if (isDev || state.user?.id == card.id.split('_')[0]) {
    const deleteButtonElement = createElement('button', { title: 'Delete card', className: 'manage-button grey-hover' }, voteButtonsElement);
    deleteButtonElement.addEventListener('click', async () => Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'Are you sure you want to delete that card? This action cannot be undone!',
      showCancelButton: true,
      preConfirm: async () => {
        await fetchAPI('vote/delete', {
          method: 'DELETE',
          body: JSON.stringify({ featureId: card.id })
        });

        cardElement.remove();
        if (!cardsContainerPending.childElementCount) {
          document.body.querySelector('#new-requests')?.remove();
          document.body.querySelector('#old-requests')?.remove();
          document.body.querySelector<HTMLElement>('#feature-request-overlay + *')!.style.marginTop = `${headerContainer.clientHeight + ADDITIONAL_HEADER_MARGIN}px`; // Element after `#feature-request-overlay`
        }
      }
    }));

    createElement('i', { className: 'far fa-trash-can fa-xl' }, deleteButtonElement);
  }

  if (isDev) {
    createElement('p', { id: 'userId', title: 'Click to copy', textContent: card.id.split('_')[0]! }, voteButtonsElement)
      .addEventListener('click', async () => navigator.clipboard.writeText(card.id.split('_')[0]!));
  }

  (card.pending ? cardsContainerPending : cardsContainer).append(cardElement);
  if (descriptionElement?.textContent) descriptionElement.style.height = `${descriptionElement.scrollHeight}px`;
}

/** Toggles the display mode */
export function toggleCardDisplayMode(): void {
  localStorage.setItem('displayMode', cardsContainer.classList.contains(cardModes.columnMode) ? 'cardsInRows' : 'cardsInColumns');

  cardsContainer.classList.toggle(cardModes.columnMode);
  cardsContainerPending.classList.toggle(cardModes.columnMode);
  cardsContainer.classList.toggle(cardModes.rowMode);
  cardsContainerPending.classList.toggle(cardModes.rowMode);
}

let currentTheme: 'dark' | 'light';
export function setColorScheme(scheme: 'dark' | 'light' | undefined = currentTheme === 'dark' ? 'light' : 'dark'): void {
  if (currentTheme === scheme) return;
  currentTheme = scheme;
  localStorage.setItem('theme', currentTheme);

  for (const e of ['bg', 'text', 'input-bg', 'input-focus-bg', 'card-bg', 'grey-text']) document.documentElement.style.setProperty(`--${e}-color`, `var(--${currentTheme}-mode-${e}-color)`);

  if (state.pageIsLoaded) {
    const elements = document.querySelectorAll('body, #header-container button, #header-container>#search-box, .card');
    for (const e of elements) e.classList.add('color-transition');

    setTimeout(() => {
      for (const e of elements) e.classList.remove('color-transition');
    }, COLOR_TRANSITION_TIME);
  }
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-unnecessary-type-parameters */
export function getFormElement<ElementType extends HTMLElement | null = HTMLInputElement | null>(form: HTMLFormElement, itemName: string) {
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion */
  return form.elements.namedItem(itemName) as ElementType | RadioNodeList;
}