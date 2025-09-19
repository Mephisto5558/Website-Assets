import {
  featureRequestOverlay, headerContainer, cardsContainer, cardsContainerPending, msInSecond, searchBoxElement, cardModes,
  HTTP_STATUS_FORBIDDEN, PROFILE_IMG_SIZE, MAX_TITLE_LENGTH, MAX_BODY_LENGTH, ADDITIONAL_HEADER_MARGIN
} from './constants.js';
import { debounce, fetchAPI, fetchCards, createElement, displayCards, setColorScheme } from './utils.js';
import state from './state.js';

import __ from './events.js';

/** @type {HTMLButtonElement | undefined} */
let saveButtonElement;

const

  /** @type {import('.')['hideFeatureReqElement']} */
  hideFeatureReqElement = (event = {}) => {
    if (event.key && event.key !== 'Escape' || featureRequestOverlay.style.display === 'none') return;

    headerContainer.removeAttribute('inert');
    cardsContainer.removeAttribute('inert');
    cardsContainerPending.removeAttribute('inert');
    if (saveButtonElement) saveButtonElement.removeAttribute('inert');

    if (state.smallScreen) cardsContainer.style.removeProperty('display');
    featureRequestOverlay.style.removeProperty('display');
  },

  // Debounced Handlers
  /** @type {import('.')['sendFeatureRequest']} */
  sendFeatureRequest = debounce(async event => {
    event.preventDefault();

    const target = event.target.parentElement;
    if (!target.title || !target.description) return;

    /** @type {import('.').Card | Awaited<ReturnType<import('.')['fetchAPI']>> | undefined} */
    let apiRes = await fetchAPI('vote/new', {
      method: 'POST',
      body: JSON.stringify({
        title: target.title.value.trim(),
        description: target.description.value.trim()
      })
    }).catch(err => apiRes = err);

    /** @type {import('.').Card | Error | undefined} */
    let res = await apiRes.json?.().catch(err => res = err);

    if (!apiRes.ok || apiRes.error || res instanceof Error) return void Swal.fire({ icon: 'error', title: 'Oops...', text: apiRes.error ?? apiRes.statusText ?? res?.message });

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
    const updateList = [...document.body.querySelectorAll('.card[modified]')].reduce((acc, card) => {
      card.removeAttribute('modified');

      const originalData = state.cardsCache.get(card.id);
      if (originalData?.title && card.children.title.textContent.trim() !== originalData.title || originalData.body && card.children.description?.textContent.trim() !== originalData.body)
        acc.push({ id: card.id, title: card.children.title.textContent.trim(), body: card.children.description.textContent.trim() });
      return acc;
    }, []);

    if (!updateList.length) return void Swal.fire({ icon: 'error', title: 'Oops...', text: 'No cards have been modified.' });

    let res = await fetchAPI('vote/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateList)
    });

    try { res = await res.json(); }
    catch { /* empty */ }

    if (res.ok === false || res.error) return void Swal.fire({ icon: 'error', title: 'Oops...', text: res.error ?? res.statusText });

    void Swal.fire({ icon: 'success', title: 'Success', text: 'The cards have been updated.' });

    state.cardsOffset = 0;
    await fetchCards();
    displayCards();
  }, msInSecond);

// Elements

/** @type {import('.')['createProfileElement']} */
async function createProfileElement() {
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

    return headerContainer.append(fragment);
  }

  const profileContainerWrapper = createElement('div', { id: 'profile-container-wrapper' }, profileContainer);
  profileContainer.addEventListener('click', event => {
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

/** @type {import('.')['createFeatureReqElement']} */
function createFeatureReqElement() {
  const featureRequestModal = featureRequestOverlay.querySelector('#feature-request-modal');

  featureRequestModal.querySelector('#feature-request-submit-button').addEventListener('click', sendFeatureRequest);
  headerContainer.querySelector('#feature-request-button').addEventListener('click', () => {
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

  featureRequestModal.querySelector('#feature-request-reset-btn').addEventListener('click', hideFeatureReqElement);
  document.addEventListener('keydown', hideFeatureReqElement);

  if (state.user?.dev) featureRequestModal.querySelector('#feature-request-description').removeAttribute('required');

  const titleCounter = featureRequestModal.querySelector('#title-counter');
  const descriptionCounter = featureRequestModal.querySelector('#description-counter');

  featureRequestModal.querySelector('#feature-request-title').addEventListener('input', event => {
    titleCounter.textContent = `${event.target.value.length}/${MAX_TITLE_LENGTH}`;
    if (event.target.value.length >= MAX_TITLE_LENGTH) titleCounter.classList.add('limit-reached');
    else titleCounter.classList.remove('limit-reached');
  });
  featureRequestModal.querySelector('#feature-request-description').addEventListener('input', event => {
    descriptionCounter.textContent = `${event.target.value.length}/${MAX_BODY_LENGTH}`;
    if (event.target.value.length >= MAX_BODY_LENGTH) descriptionCounter.classList.add('limit-reached');
    else descriptionCounter.classList.remove('limit-reached');
  });
}

async function findAndScrollToCard(cardId) {
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
  setColorScheme(localStorage.getItem('theme') ?? (globalThis.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

  state.smallScreen = globalThis.matchMedia('(max-width: 768px)').matches;
  const cardsInRows = state.smallScreen && localStorage.getItem('displayMode') === 'cardsInRows';

  await createProfileElement();
  createFeatureReqElement();

  await fetchCards();

  cardsContainer.classList.add(cardsInRows ? cardModes.rowMode : cardModes.columnMode);
  cardsContainerPending.classList.add(cardsInRows ? cardModes.rowMode : cardModes.columnMode);

  document.querySelector('#feature-request-count > span').textContent = state.cardsCache.size;

  if (globalThis.location.hash == '#new') headerContainer.querySelector('#feature-request-button').click();

  // navigator.clipboard is not available with HTTP
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

    saveButtonElement = createElement('button', { id: 'save-button', title: 'Save', classList: 'blue-button' }, document.body);
    createElement('i', { classList: 'fas fa-save fa-xl' }, saveButtonElement);

    saveButtonElement.addEventListener('click', updateCards);
  }

  document.body.querySelector('#feature-request-overlay + *').style.marginTop = `${headerContainer.clientHeight + ADDITIONAL_HEADER_MARGIN}px`;
  document.documentElement.style.scrollPaddingTop = `${headerContainer.clientHeight + 20}px`;

  state.pageIsLoaded = true;
});