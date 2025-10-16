import { searchBoxElement, cardsContainer, cardsContainerPending, msInSecond, headerContainer, ADDITIONAL_HEADER_MARGIN, cardModes, COLOR_TRANSITION_TIME } from './constants';
import createElement from './createElement';
import state from './state';

export { createElement }

export function debounce<CB extends (...args: any) => any>(callback: CB, delay: number): (...args: Parameters<CB>) => Promise<ReturnType<CB>> {
  let timer: ReturnType<typeof setTimeout>;

  return (...args) => new Promise((res, rej) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { res(callback(...args)); }
      catch (err) { rej(err instanceof Error ? err : new Error(err)); }
    }, delay);
  });
}

export const
  sendUpvote = debounce(async (cardId: Card['id'], voteCounter: HTMLElement): Promise<void> => {
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

    voteCounter.textContent = Number.parseInt(voteCounter.textContent) + 1;

    state.cardsOffset = 0;
    displayCards();
  }, msInSecond);

export async function fetchAPI(url: string, options: RequestInit | undefined = {}, timeout: number | undefined = 5000): Promise<Response | Error> {
  if (options.body != undefined && !options.headers) options.headers = { 'Content-Type': 'application/json' };
  options.signal ??= new AbortController().signal;

  const timeoutId = setTimeout(() => options.signal.abort('Request timed out'), timeout);
  const res = await fetch(url ? `/api/v1/internal/${url}` : undefined, options);
  clearTimeout(timeoutId);

  return res;
}

export async function fetchCards(): Promise<void> {
  const fetchedCards = new Map(
    ((await fetchAPI(`vote/list?includePending=${!!state.user?.dev}`).then(e => e.json()))?.cards as Card[])
      ?.sort((a, b) => {
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
  const isDev = !!state.user?.dev;

  const cardElement = createElement('div', { className: 'card', id: card.id });

  const titleElement = createElement('h2', { id: 'title', textContent: card.title, contentEditable: isDev ? 'plaintext-only' : 'false' }, cardElement);
  const descriptionElement = card.body || isDev ? createElement('p', { id: 'description', textContent: card.body ?? '', contentEditable: isDev ? 'plaintext-only' : 'false' }, cardElement) : undefined;

  const voteButtonsElement = createElement('div', { className: 'vote-buttons' }, cardElement);
  const upvoteCounterElement = createElement('span', { className: 'vote-counter', textContent: card.pending ? '' : (card.votes ?? 0).toString() });

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
  else if (!card.pending) createElement('button', { className: 'vote-button blue-button', textContent: 'Upvote' }, voteButtonsElement).addEventListener('click', () => sendUpvote(card.id, upvoteCounterElement));

  voteButtonsElement.append(upvoteCounterElement);

  const copyButtonElement = createElement('button', { title: 'Copy card Id', className: 'manage-button grey-hover' }, voteButtonsElement);
  const copyButtonIcon = createElement('i', { className: 'far fa-copy fa-xl' }, copyButtonElement);

  copyButtonElement.addEventListener('click', () => {
    void navigator.clipboard.writeText(card.id);
    copyButtonIcon.classList = 'fas fa-check fa-xl';
    /* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- 3ms */
    setTimeout(() => copyButtonIcon.classList = 'far fa-copy fa-xl', msInSecond * 3);
  });

  if (isDev) {
    titleElement.addEventListener('keydown', event => {
      if (!(event.target instanceof HTMLElement) || !(event.target?.parentElement instanceof HTMLElement)) return; // typeguard

      if (event.target.parentElement.hasAttribute('modified')) {
        if (event.target.textContent == card.title)
          event.target.parentElement.removeAttribute('modified');
      }
      else if (event.target.textContent != card.title)
        event.target.parentElement.setAttribute('modified', '');

      if (event.key !== 'Enter') return;
      event.preventDefault();
      event.target.nextElementSibling!.firstChild!.focus();
    });
    descriptionElement?.addEventListener('input', ({ target }) => {
      if (target.parentElement.hasAttribute('modified')) {
        if (target.textContent == card.body)
          target.parentElement.removeAttribute('modified');
      }
      else if (target.textContent != card.body)
        target.parentElement.setAttribute('modified', '');
    });
  }

  if (isDev || state.user?.id == card.id.split('_')[0]) {
    const deleteButtonElement = createElement('button', { title: 'Delete card', className: 'manage-button grey-hover' }, voteButtonsElement);
    deleteButtonElement.addEventListener('click', () => Swal.fire({
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
          document.body.querySelector('#feature-request-overlay + *').style.marginTop = `${headerContainer.clientHeight + ADDITIONAL_HEADER_MARGIN}px`; // Element after `#feature-request-overlay`
        }
      }
    }));

    createElement('i', { className: 'far fa-trash-can fa-xl' }, deleteButtonElement);
  }

  if (isDev) createElement('p', { id: 'userId', title: 'Click to copy', textContent: card.id.split('_')[0] }, voteButtonsElement).addEventListener('click', () => navigator.clipboard.writeText(card.id.split('_')[0]));

  (card.pending ? cardsContainerPending : cardsContainer).append(cardElement);
  if (descriptionElement?.value) descriptionElement.style.height = `${descriptionElement.scrollHeight}px`;
}

/** Toggles the display mode */
export function toggleCardDisplayMode() {
  localStorage.setItem('displayMode', cardsContainer.classList.contains(cardModes.columnMode) ? 'cardsInRows' : 'cardsInColumns');

  cardsContainer.classList.toggle(cardModes.columnMode);
  cardsContainerPending.classList.toggle(cardModes.columnMode);
  cardsContainer.classList.toggle(cardModes.rowMode);
  cardsContainerPending.classList.toggle(cardModes.rowMode);
}

let currentTheme: 'dark' | 'light';
export function setColorScheme(scheme: 'dark' | 'light' | undefined = currentTheme === 'dark' ? 'light' : 'dark') {
  if (currentTheme === scheme) return;
  currentTheme = scheme;
  localStorage.setItem('theme', currentTheme);

  for (const e of ['bg', 'text', 'input-bg', 'input-focus-bg', 'card-bg', 'grey-text']) document.documentElement.style.setProperty(`--${e}-color`, `var(--${currentTheme}-mode-${e}-color)`);

  if (state.pageIsLoaded) {
    const elements = document.querySelectorAll('body, #header-container button, #header-container>#search-box, .card');
    for (const e of elements) e.classList.add('color-transition');

    setTimeout(() => { for (const e of elements) e.classList.remove('color-transition'); }, COLOR_TRANSITION_TIME);
  }
}