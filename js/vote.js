(() => {
  let
    /** @type {import('.').vote.User?}*/ user,
    /** @type {import('.').vote.CardsCache}*/ cardsCache,
    currentTheme, saveButtonElement, pageIsLoaded,
    cardsInRows = false,
    cardsOffset = 0,
    oldWindowWidth = window.innerWidth;

  const
    HTTP_STATUS_FORBIDDEN = 403,
    cardModes = { columnMode: 'cards-column-mode', rowMode: 'cards-row-mode' },
    headerContainer = document.body.querySelector('#header-container'),
    cardsContainer = document.body.querySelector('#cards-container'),
    cardsContainerPending = document.body.querySelector('#cards-container-pending'),
    featureRequestOverlay = document.body.querySelector('#feature-request-overlay'),

    /** @type {HTMLInputElement} */
    searchBoxElement = createElement('input', {
      type: 'text', placeholder: 'Search', id: 'search-box', value: new URLSearchParams(globalThis.location.search).get('q'), className: 'grey-hover', maxLength: 200
    }),

    /** @type {import('.').vote.debounce} */
    debounce = (callback, delay) => {
      let timer;

      /** @type {import('.').vote.debounceTimeoutCB} */
      const timeoutCallback = (res, rej, ...args) => {
        try { res(callback(...args)); }
        catch (err) { rej(err instanceof Error ? err : new Error(err)); }
      };

      return (...args) => new Promise((res, rej) => {
        clearTimeout(timer);
        timer = setTimeout(timeoutCallback.bind(undefined, res, rej, ...args), delay);
      });
    },

    // Debounced Handlers
    /** @type {import('.').vote.sendFeatureRequest}*/
    sendFeatureRequest = debounce(async (event, smallScreen) => {
      event.preventDefault();

      let res = await fetchAPI('vote/new', {
        method: 'POST',
        body: JSON.stringify({
          title: event.target.title.value.trim(),
          description: event.target.description.value.trim()
        })
      });

      try { res = await res.json(); }
      catch { /* empty */ }

      if (res.ok === false || res.error) return void Swal.fire({ icon: 'error', title: 'Oops...', text: res.error ?? res.statusText });

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Your feature request has been submitted and ${res.approved ? 'approved' : 'will be reviewed shortly'}.`
      });

      cardsCache.set(res.id, res);

      event.target.reset();

      if (smallScreen) cardsContainer.style.display = '';
      featureRequestOverlay.style.display = 'none';
    }, 1000),

    /** @type {import('.').vote.sendUpvote}*/
    sendUpvote = debounce(async (cardId, voteCounter) => {
      if (!user?.id) {
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
    }, 1000),

    /** Updates the cards*/
    updateCards = debounce(async () => {
      const updateList = [...document.body.querySelectorAll('.card[modified]')].reduce((acc, card) => {
        card.removeAttribute('modified');

        const originalData = cardsCache.get(card.id);
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

      cardsOffset = 0;
      cardsCache = await fetchCards();
      displayCards();
    }, 1000);

  searchBoxElement.addEventListener('input', debounce(({ target }) => {
    if (target.value.length > target.maxLength) target.value = target.value.slice(0, target.maxLength);

    cardsOffset = 0;
    displayCards(target.value);
  }, 500));

  // Utils

  /** @type {import('.').vote.fetchAPI}*/
  async function fetchAPI(url, options = {}, timeout = 5000) {
    if (options.body != undefined && !options.headers) options.headers = { 'Content-Type': 'application/json' };
    options.signal ??= new AbortController().signal;

    const timeoutId = setTimeout(() => options.signal.abort('Request timed out'), timeout);
    const res = await fetch(url ? `/api/v1/internal/${url}` : undefined, options);
    clearTimeout(timeoutId);

    return res;
  }

  /** @type {import('.').vote.fetchCards}*/
  async function fetchCards() {
    return new Map(
      (await fetchAPI(`vote/list?includePending=${!!user.dev}`).then(e => e.json()))?.cards
        ?.sort(

          /**
           * @param {import('.').vote.Card}a
           * @param {import('.').vote.Card}b*/
          (a, b) => {
            if (!a.pending && b.pending) return 1;
            if (a.pending && !b.pending) return -1;
            return (b.votes ?? 0) - (a.votes ?? 0) || a.title.localeCompare(b.title);
          }
        ).map(e => [e.id, e])
    );
  }

  /** @type {import('.').vote.createElement}*/
  function createElement(tagName, data, parent, replace) {
    const element = document.createElement(tagName);
    if (Object.keys(data ?? {}).length) {
      for (const [k, v] of Object.entries(data)) {
        if (v == undefined) continue;
        if (typeof v == 'object') Object.assign(element[k], v);
        else element[k] = v;
      }
    }
    if (parent) replace ? parent.replaceChildren(element) : parent.append(element);
    return element;
  }

  /** @type {import('.').vote.updateParams}*/
  function updateParams(key, value) {
    const
      url = new URL(globalThis.location.href),
      params = new URLSearchParams(globalThis.location.search);

    value ? params.set(key, value) : params.delete(key);
    url.search = params.toString();

    globalThis.history.pushState(undefined, undefined, url.toString());
  }

  // Elements

  /** @type {import('.').vote.createProfileElement}*/
  async function createProfileElement(smallScreen) {
    const fragment = document.createDocumentFragment();
    const profileContainer = createElement('div', { id: 'profile-container' });

    user = await fetchAPI('user').then(e => e.json()).catch(() => { /* empty */ });
    if (!user || user.errorCode) {
      if (user?.errorCode == HTTP_STATUS_FORBIDDEN) return createElement('h2', { textContent: user.error }, document.body, true);

      fragment.append(searchBoxElement);
      createElement('button', { id: 'feature-request-button', textContent: smallScreen ? 'New Request' : 'New Feature Request', className: 'grey-hover' }, fragment);
      createElement('button', { id: 'login-button', textContent: smallScreen ? 'Login' : 'Login with Discord', className: 'blue-button' }, profileContainer)
        .addEventListener('click', () => globalThis.location.href = `/auth/discord?redirectURL=${globalThis.location.href}`);
      fragment.append(profileContainer);

      return headerContainer.append(fragment);
    }

    const profileContainerWrapper = createElement('div', { id: 'profile-container-wrapper' }, profileContainer);
    profileContainer.addEventListener('click', () => profileContainerWrapper.style.display = profileContainerWrapper.style.display === 'block' ? 'none' : 'block');

    const img = new Image(39, 39);
    img.onload = () => profileContainer.append(img);
    img.alt = 'Profile';
    img.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`;

    createElement('div', { id: 'username', textContent: user.displayName ?? user.username }, profileContainerWrapper);
    createElement('button', { id: 'logout-button', textContent: 'Logout', className: 'blue-button' }, profileContainerWrapper).addEventListener('click', async () => {
      const res = await fetch('/auth/logout');

      await Swal.fire(res.ok ? { icon: 'success', title: 'Success', text: 'You are now logged out.' } : { icon: 'error', title: 'Logout failed', text: res.statusText });
      if (res.ok) globalThis.location.reload();
    });

    const featureRequestButtonElement = createElement('button', { id: 'feature-request-button', textContent: smallScreen ? 'New Request' : 'New Feature Request', className: 'grey-hover' });
    if (smallScreen) {
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

  /** @type {import('.').vote.createFeatureReqElement}*/
  function createFeatureReqElement(smallScreen) {
    const featureRequestModal = featureRequestOverlay.querySelector('#feature-request-modal');

    featureRequestModal.addEventListener('submit', data => sendFeatureRequest(data, smallScreen));
    headerContainer.querySelector('#feature-request-button').addEventListener('click', () => {
      if (!user?.id) {
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
      if (smallScreen) cardsContainer.style.display = 'none';
    });

    const hideFeatureReqElement = ({ key }) => {
      if (key && key !== 'Escape' || featureRequestOverlay.style.display === 'none') return;

      headerContainer.inert = '';
      cardsContainer.inert = '';
      cardsContainerPending.inert = '';
      if (saveButtonElement) saveButtonElement.inert = '';

      if (smallScreen) cardsContainer.style.display = '';
      featureRequestOverlay.style.display = 'none';
    };

    featureRequestModal.querySelector('#feature-request-reset-btn').addEventListener('click', hideFeatureReqElement);
    document.addEventListener('keydown', hideFeatureReqElement);

    if (user.dev) featureRequestModal.querySelector('#feature-request-description').removeAttribute('required');

    const titleCounter = featureRequestModal.querySelector('#title-counter');
    const descriptionCounter = featureRequestModal.querySelector('#description-counter');

    featureRequestModal.querySelector('#feature-request-title').addEventListener('input', event => {
      titleCounter.textContent = `${event.target.value.length}/140`;
      if (event.target.value.length >= 140) titleCounter.classList.add('limit-reached');
      else titleCounter.classList.remove('limit-reached');
    });
    featureRequestModal.querySelector('#feature-request-description').addEventListener('input', event => {
      descriptionCounter.textContent = `${event.target.value.length}/4000`;
      if (event.target.value.length >= 4000) descriptionCounter.classList.add('limit-reached');
      else descriptionCounter.classList.remove('limit-reached');
    });
  }

  /** @type {import('.').vote.displayCards}*/
  function displayCards(query = searchBoxElement.value, amount = 26) {
    query = query.toLowerCase();
    updateParams('q', query);

    const cards = (query ? [...cardsCache.values()].filter(e => e.title.toLowerCase().includes(query) || e.body.toLowerCase().includes(query) || e.id.toLowerCase().includes(query)) : [...cardsCache.values()]).slice(cardsOffset, amount + cardsOffset);
    if (!cards.length && !cardsContainer.childElementCount && !cardsContainerPending.childElementCount) return void createElement('h2', { textContent: `There are currently no feature requests${query ? ' matching your search query' : ''} :(` }, cardsContainer, true);

    if (!cardsOffset) {
      cardsContainer.innerHTML = '';
      cardsContainerPending.innerHTML = '';
    }

    for (const card of cards) createCardElement(card);

    cardsOffset += amount;
    if (cardsContainer.childElementCount + cardsContainerPending.childElementCount < amount && cardsCache.size > cardsOffset) return displayCards(query, amount);
  }

  /** @type {import('.').vote.createCardElement}*/
  function createCardElement(card) {
    const cardElement = createElement('div', { className: 'card', id: card.id });

    const titleElement = createElement('h2', { id: 'title', textContent: card.title, contentEditable: String(!!user.dev) }, cardElement);
    const descriptionElement = card.body || user.dev ? createElement('p', { id: 'description', textContent: card.body, contentEditable: String(!!user.dev) }, cardElement) : undefined;

    const voteButtonsElement = createElement('div', { className: 'vote-buttons' }, cardElement);
    const upvoteCounterElement = createElement('span', { className: 'vote-counter', textContent: card.pending ? '' : card.votes ?? 0 });

    if (card.pending && user.dev) {
      createElement('button', { textContent: 'Approve', className: 'vote-button blue-button' }, voteButtonsElement).addEventListener('click', async () => {
        let res = await fetchAPI('vote/approve', {
          method: 'POST',
          body: JSON.stringify({ featureId: card.id })
        });

        try { res = await res.json(); }
        catch { /* empty */ }

        if (res.ok === false || res.error) return void Swal.fire({ icon: 'error', title: 'Oops...', text: res.error ?? res.statusText });

        void Swal.fire({ icon: 'success', title: 'Success', text: 'The feature request has been approved.' });

        cardsContainer.append(cardElement);
        if (!cardsContainerPending.childElementCount) {
          document.body.querySelector('#new-requests')?.remove();
          document.body.querySelector('#old-requests')?.remove();

          document.body.querySelector('#feature-request-overlay + *').style.marginTop = `${headerContainer.clientHeight + 16}px`;
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
      setTimeout(() => copyButtonIcon.classList = 'far fa-copy fa-xl', 3000);
    });

    if (user.dev) {
      titleElement.addEventListener('keydown', event => {
        if (!event.target.parentElement.hasAttribute('modified')) event.target.parentElement.setAttribute('modified', '');

        if (event.key !== 'Enter') return;
        event.preventDefault();
        const element = event.target.nextElementSibling;
        element.firstChild.focus();
      });
      descriptionElement?.addEventListener('input', ({ target }) => {
        if (!target.parentElement.hasAttribute('modified')) target.parentElement.setAttribute('modified', '');
      });
    }
    if (user.dev || user.id == card.id.split('_')[0]) {
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
            document.body.querySelector('#feature-request-overlay + *').style.marginTop = `${headerContainer.clientHeight + 16}px`; // Element after `#feature-request-overlay`
          }
        }
      }));

      createElement('i', { className: 'far fa-trash-can fa-xl' }, deleteButtonElement);
    }

    if (user.dev) createElement('p', { id: 'userId', title: 'Click to copy', textContent: card.id.split('_')[0] }, voteButtonsElement).addEventListener('click', () => navigator.clipboard.writeText(card.id.split('_')[0]));

    (card.pending ? cardsContainerPending : cardsContainer).append(cardElement);
    if (descriptionElement?.value) descriptionElement.style.height = `${descriptionElement.scrollHeight}px`;
  }

  // Handler

  /** Toggles the display mode*/
  function toggleCardDisplayMode() {
    cardsInRows = !cardsInRows;

    if (cardsInRows) {
      localStorage.setItem('displayMode', 'cardsInRows');
      cardsContainer.classList.remove(cardModes.columnMode);
      cardsContainerPending.classList.remove(cardModes.columnMode);
      cardsContainer.classList.add(cardModes.rowMode);
      cardsContainerPending.classList.add(cardModes.rowMode);
    }
    else {
      localStorage.setItem('displayMode', 'cardsInColumns');
      cardsContainer.classList.remove(cardModes.rowMode);
      cardsContainerPending.classList.remove(cardModes.rowMode);
      cardsContainer.classList.add(cardModes.columnMode);
      cardsContainerPending.classList.add(cardModes.columnMode);
    }
  }

  /** @type {import('.').vote.setColorScheme}*/
  function setColorScheme(scheme = currentTheme === 'dark' ? 'light' : 'dark') {
    if (currentTheme === scheme) return;
    currentTheme = scheme;
    localStorage.setItem('theme', currentTheme);

    for (const e of ['bg', 'text', 'input-bg', 'input-focus-bg', 'card-bg', 'grey-text']) document.documentElement.style.setProperty(`--${e}-color`, `var(--${currentTheme}-mode-${e}-color)`);

    if (pageIsLoaded) {
      const elements = document.querySelectorAll('body, #header-container button, #header-container>#search-box, .card');
      for (const e of elements) e.classList.add('color-transition');

      setTimeout(() => { for (const e of elements) e.classList.remove('color-transition'); }, 300);
    }
  }

  // Listener

  headerContainer.querySelector('#toggle-cards-display').addEventListener('click', () => toggleCardDisplayMode());
  headerContainer.querySelector('#toggle-color-scheme').addEventListener('click', () => setColorScheme());

  window.addEventListener('scroll', () => {
    if (cardsCache.size > cardsOffset && document.documentElement.scrollTop + document.documentElement.clientHeight >= document.documentElement.scrollHeight - 15) displayCards();
  });
  window.addEventListener('resize', debounce(() => {
    const currentWidth = window.innerWidth;

    if (oldWindowWidth > 769 && currentWidth < 768 || oldWindowWidth < 768 && currentWidth > 769) globalThis.location.reload();
    else oldWindowWidth = currentWidth;
  }, 500));
  window.addEventListener('beforeunload', event => {
    if (!document.body.querySelectorAll('.card[modified]').length) return;

    event.preventDefault(); // Triggers "you have unsaved changes" dialog box
    /* eslint-disable-next-line @typescript-eslint/no-deprecated -- Legacy support */
    event.returnValue = true;
  });

  document.addEventListener('DOMContentLoaded', async () => {
    setColorScheme(localStorage.getItem('theme') ?? (globalThis.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));

    const smallScreen = globalThis.matchMedia('(max-width: 768px)').matches;
    if (!smallScreen) cardsInRows = localStorage.getItem('displayMode') === 'cardsInRows';

    await createProfileElement(smallScreen);
    createFeatureReqElement(smallScreen);

    cardsCache = await fetchCards();
    cardsContainer.classList.add(cardsInRows ? cardModes.rowMode : cardModes.columnMode);
    cardsContainerPending.classList.add(cardsInRows ? cardModes.rowMode : cardModes.columnMode);

    if (globalThis.location.hash == '#new') headerContainer.querySelector('#feature-request-button').click();

    // navigator.clipboard is not available with HTTP
    navigator.clipboard ??= {
      writeText: data => Swal.fire({ icon: 'error', title: 'Copying is not available due to this page being served over HTTP.', text: `This was what you tried to copy: ${data}` })
    };

    displayCards();
    if (user.dev) {
      if (cardsContainerPending.childElementCount) {
        document.body.insertBefore(createElement('h2', { id: 'new-requests', textContent: 'New Requests' }), cardsContainerPending);
        document.body.insertBefore(createElement('h2', { id: 'old-requests', textContent: 'Approved Requests' }), cardsContainer);
      }

      saveButtonElement = createElement('button', { id: 'save-button', title: 'Save', classList: 'blue-button' }, document.body);
      createElement('i', { classList: 'fas fa-save fa-xl' }, saveButtonElement);

      saveButtonElement.addEventListener('click', updateCards);
    }

    document.body.querySelector('#feature-request-overlay + *').style.marginTop = `${headerContainer.clientHeight + 16}px`;
    document.documentElement.style.scrollPaddingTop = `${headerContainer.clientHeight + 20}px`;

    pageIsLoaded = true;
  });
})();