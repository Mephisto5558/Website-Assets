import {
  featureRequestOverlay, headerContainer, cardsContainer, cardsContainerPending, msInSecond, searchBoxElement, cardModes,
  HTTP_STATUS_FORBIDDEN, PROFILE_IMG_SIZE, MAX_TITLE_LENGTH, MAX_BODY_LENGTH, ADDITIONAL_HEADER_MARGIN
} from './constants';
import { debounce, fetchAPI, fetchCards, createElement, displayCards, setColorScheme } from './utils';
import state from './state';

import __ from './events';

declare global {
export type Card = { id: string; title: string; body?: string; pending?: boolean; votes?: number; approved?: boolean };
export type CardsCache = Map<string, Card>;

export type UserData = { id: string; username: string; locale: string; avatar: string; banner: string | null; dev: boolean; displayName: string };
export type UserError = { errorCode: number; error: string };
export type User<canBeError extends boolean = true> = UserData & (canBeError extends true ? UserError : never);
}

let saveButtonElement: HTMLButtonElement | undefined;

export const
  hideFeatureReqElement = (event?: KeyboardEvent | PointerEvent): void => {
    if (!event || event instanceof KeyboardEvent && event.key !== 'Escape' || featureRequestOverlay.style.display === 'none') return;

    headerContainer.removeAttribute('inert');
    cardsContainer.removeAttribute('inert');
    cardsContainerPending.removeAttribute('inert');
    if (saveButtonElement) saveButtonElement.removeAttribute('inert');

    if (state.smallScreen) cardsContainer.style.removeProperty('display');
    featureRequestOverlay.style.removeProperty('display');
  },

  // Debounced Handlers
  sendFeatureRequest = debounce(async (event: PointerEvent): Promise<void> => {
    event.preventDefault();

    const target = (event.target as HTMLButtonElement).parentElement as HTMLFormElement | null;
    if (!target || !target.title || !target.description) return;

    let apiRes = await fetchAPI('vote/new', {
      method: 'POST',
      body: JSON.stringify({
        title: target.title.value.trim(),
        description: target.description.value.trim()
      })
    }).catch(err => err as Error);

    let res = await (apiRes instanceof Response ? apiRes.json().catch(err => err) : undefined) as Card | Error | UserError | undefined;

    if (!res || res instanceof Error || apiRes instanceof Error || !apiRes.ok || 'error' in apiRes || 'error' in res)
      return void Swal.fire({ icon: 'error', title: 'Oops...', text: apiRes.error ?? apiRes.statusText ?? res?.message });

    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: `Your feature request has been submitted and ${res.approved ? 'approved' : 'will be reviewed shortly'}.`
    });

    state.cardsCache.set(res.id, res);

    if (res.approved) {
      state.cardsOffset = 0;
      displayCards();
    }

    hideFeatureReqElement();
    target.reset(); // resets the form's values
  }, msInSecond),

  /** Updates the cards */
  updateCards = debounce(async () => {
    const updateList = [...document.body.querySelectorAll('.card[modified]')].reduce((acc: Card[], card: Element) => {
      card.removeAttribute('modified');

      const originalData = state.cardsCache.get(card.id);
      if (originalData?.title && card.children.title.textContent.trim() !== originalData.title || originalData?.body && card.children.description?.textContent.trim() !== originalData.body)
        acc.push({ id: card.id, title: card.children.title.textContent.trim(), body: card.children.description.textContent.trim() });
      return acc;
    }, []);

    if (!updateList.length) return void Swal.fire({ icon: 'error', title: 'Oops...', text: 'No cards have been modified.' });

    let res = await fetchAPI('vote/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateList)
    }).then(res => res.json?.()).catch(() => { /* empty */ });

    if (res.ok === false || res.error) return void Swal.fire({ icon: 'error', title: 'Oops...', text: res.error ?? res.statusText });

    void Swal.fire({ icon: 'success', title: 'Success', text: 'The cards have been updated.' });

    state.cardsOffset = 0;
    await fetchCards();
    displayCards();
  }, msInSecond);

// Elements

async function createProfileElement(): Promise<HTMLElement | undefined> {
  const fragment = document.createDocumentFragment();
  const profileContainer = createElement('div', { id: 'profile-container' });

  state.user = await fetchAPI('user').then(e => e.json()).catch(() => { /* empty */ });
  if (!state.user || state.user.errorCode) {
    if (state.user?.errorCode == HTTP_STATUS_FORBIDDEN) return createElement('h2', { textContent: state.user.error }, document.body, true);

    fragment.append(searchBoxElement);
    createElement('button', { id: 'feature-request-button', textContent: state.smallScreen ? 'New Request' : 'New Feature Request', className: 'grey-hover' }, fragment);
    createElement('button', { id: 'login-button', textContent: state.smallScreen ? 'Login' : 'Login with Discord', className: 'blue-button' }, profileContainer)
      .addEventListener('click', () => globalThis.location.href = `/auth/discord?redirectUrl=${globalThis.location.href}`);
    fragment.append(profileContainer);

    return void headerContainer.append(fragment);
  }

  const profileContainerWrapper = createElement('div', { id: 'profile-container-wrapper' }, profileContainer);
  profileContainer.addEventListener('click', (event: PointerEvent) => {
    if (!profileContainerWrapper.contains(event.target)) profileContainerWrapper.style.display = profileContainerWrapper.style.display === 'flex' ? 'none' : 'flex';
  });

  const img = new Image(PROFILE_IMG_SIZE, PROFILE_IMG_SIZE);
  img.onload = () => profileContainer.append(img);
  img.alt = 'Profile';
  img.src = `https://cdn.discordapp.com/avatars/${state.user.id}/${state.user.avatar}.webp?size=64`;

  createElement('div', { id: 'username', textContent: state.user.displayName ?? state.user.username }, profileContainerWrapper);
  createElement('button', { id: 'logout-button', textContent: 'Logout', className: 'blue-button' }, profileContainerWrapper).addEventListener('click', async () => {
    const res = await fetch('/auth/logout');

    await Swal.fire(res.ok ? { icon: 'success', title: 'Success', text: 'You are now logged out.' } : { icon: 'error', title: 'Logout failed', text: res.statusText });
    if (res.ok) globalThis.location.reload();
  });

  const featureRequestButtonElement = createElement('button', { id: 'feature-request-button', textContent: state.smallScreen ? 'New Request' : 'New Feature Request', className: 'grey-hover' });
  if (state.smallScreen) {
    createElement('br', fragment);
    fragment.append(profileContainer);
    fragment.append(searchBoxElement);
    fragment.append(featureRequestButtonElement);
  }
  else {
    fragment.append(searchBoxElement);
    fragment.append(featureRequestButtonElement);
    fragment.append(profileContainer);
  }

  headerContainer.append(fragment);
}

function createFeatureReqElement(): void {
  const featureRequestModal = featureRequestOverlay.querySelector<HTMLDivElement>('#feature-request-modal')!;

  featureRequestModal.querySelector<HTMLButtonElement>('#feature-request-submit-button')!.addEventListener('click', sendFeatureRequest);
  headerContainer.querySelector<HTMLButtonElement>('#feature-request-button')!.addEventListener('click', () => {
    if (!state.user?.id) {
      return Swal.fire({
        icon: 'error',
        title: 'Who are you?',
        text: 'You must be logged in to be able to create a feature request!'
      });
    }

    headerContainer.inert = true;
    cardsContainer.inert = true;
    cardsContainerPending.inert = true;
    if (saveButtonElement) saveButtonElement.inert = true;

    featureRequestOverlay.style.display = 'block';
    if (state.smallScreen) cardsContainer.style.display = 'none';
  });

  featureRequestModal.querySelector<HTMLButtonElement>('#feature-request-reset-btn')!.addEventListener('click', hideFeatureReqElement);
  document.addEventListener('keydown', hideFeatureReqElement);

  const descriptionElement = featureRequestModal.querySelector<HTMLTextAreaElement>('#feature-request-description')!;
  if (state.user?.dev) descriptionElement.removeAttribute('required');

  const titleCounter = featureRequestModal.querySelector<HTMLSpanElement>('#title-counter')!;
  const descriptionCounter = featureRequestModal.querySelector<HTMLSpanElement>('#description-counter')!;

  featureRequestModal.querySelector<HTMLInputElement>('#feature-request-title')!.addEventListener('input', event => {
    titleCounter.textContent = `${(event.target as HTMLInputElement).value.length}/${MAX_TITLE_LENGTH}`;
    if ((event.target as HTMLInputElement).value.length >= MAX_TITLE_LENGTH) titleCounter.classList.add('limit-reached');
    else titleCounter.classList.remove('limit-reached');
  });
  descriptionElement.addEventListener('input', event => {
    descriptionCounter.textContent = `${(event.target as HTMLTextAreaElement).value.length}/${MAX_BODY_LENGTH}`;
    if ((event.target as HTMLTextAreaElement).value.length >= MAX_BODY_LENGTH) descriptionCounter.classList.add('limit-reached');
    else descriptionCounter.classList.remove('limit-reached');
  });
}

async function findAndScrollToCard(cardId: Card['id']) {
  if (!state.cardsCache.has(cardId)) return;

  /* eslint-disable-next-line unicorn/prefer-query-selector */
  while (!document.getElementById(cardId) && state.cardsCache.size > state.cardsOffset) {
    displayCards();
    /* eslint-disable-next-line @typescript-eslint/no-magic-numbers -- short timeout to prevent browser lag */
    await new Promise(res => setTimeout(res, 50));
  }

  /* eslint-disable-next-line unicorn/prefer-query-selector */
  return document.getElementById(cardId)?.scrollIntoView({ behavior: 'smooth' });
}

// Listener

document.addEventListener('DOMContentLoaded', async () => {
  setColorScheme(localStorage.getItem('theme') as 'dark' | 'light' | undefined ?? (globalThis.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

  state.smallScreen = globalThis.matchMedia('(max-width: 768px)').matches;
  const cardsInRows = state.smallScreen && localStorage.getItem('displayMode') === 'cardsInRows';

  await createProfileElement();
  createFeatureReqElement();

  await fetchCards();

  cardsContainer.classList.add(cardsInRows ? cardModes.rowMode : cardModes.columnMode);
  cardsContainerPending.classList.add(cardsInRows ? cardModes.rowMode : cardModes.columnMode);

  document.querySelector<HTMLSpanElement>('#feature-request-count > span')!.textContent = state.cardsCache.size.toLocaleString();

  if (globalThis.location.hash == '#new') headerContainer.querySelector<HTMLButtonElement>('#feature-request-button')!.click();

  // @ts-expect-error -- navigator.clipboard is not available with HTTP, meaning it is not readonly with HTTP
  navigator.clipboard ??= {
    writeText: data => Swal.fire({ icon: 'error', title: 'Copying is not available due to this page being served over HTTP.', text: `This was what you tried to copy: ${data}` })
  };

  displayCards();

  setTimeout(() => findAndScrollToCard(globalThis.location.hash.slice(1)), msInSecond / 10);

  if (state.user?.dev) {
    if (cardsContainerPending.childElementCount) {
      document.body.insertBefore(createElement('h2', { id: 'new-requests', textContent: 'New Requests' }), cardsContainerPending);
      document.body.insertBefore(createElement('h2', { id: 'old-requests', textContent: 'Approved Requests' }), cardsContainer);
    }

    saveButtonElement = createElement('button', { id: 'save-button', title: 'Save', className: 'blue-button' }, document.body);
    createElement('i', { className: 'fas fa-save fa-xl' }, saveButtonElement);

    saveButtonElement.addEventListener('click', updateCards);
  }

  document.body.querySelector<HTMLElement>('#feature-request-overlay + *')!.style.marginTop = `${headerContainer.clientHeight + ADDITIONAL_HEADER_MARGIN}px`;
  document.documentElement.style.scrollPaddingTop = `${headerContainer.clientHeight + 20}px`;

  state.pageIsLoaded = true;
});