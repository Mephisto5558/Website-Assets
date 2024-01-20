(() => {
  let
    /**@type {{id: string, username: string, locale: string, avatar: string, banner: string?, dev: boolean} | {errorCode: number, error: string}}*/
    user,
    /**@type {Map<string, {title:string, body:string, id:string, votes:number, pending?:true}>}*/
    cardsCache, searchTimeout, resizeTimeout, currentTheme, saveButtonElement, loaded, cardsInRows = false, offset = 0, oldWindowWidth = window.innerWidth;

  const
    headerContainer = document.getElementById('header-container'),
    cardsContainer = document.getElementById('cards-container'),
    cardsContainerPending = document.getElementById('cards-container-pending'),
    searchBoxElement = createElement('input', { type: 'text', placeholder: 'Search', id: 'search-box', value: new URLSearchParams(window.location.search).get('q'), className: 'grey-hover', maxLength: 200 });

  searchBoxElement.addEventListener('input', ({ target }) => {
    if (target.value.length > target.maxLength) target.value = target.value.slice(0, target.maxLength);

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      offset = 0;
      displayCards(target.value);
    }, 500);
  });

  // Utils
  /**@param {?RequestInit}options @returns {Promise<Response|Error>}*/
  const fetchAPI = (url, options, timeout = 5000) => new Promise((res, rej) => {
    const timeoutId = setTimeout(() => rej(new Error('Request timed out')), timeout);
    fetch(url ? `/api/v1/internal/${url}` : null, options).then(res).catch(rej).finally(() => clearTimeout(timeoutId));
  });

  /**@returns {Promise<cardsCache>}*/
  const fetchCards = async () => new Map((await fetchAPI(`vote/list?includePending=${user.dev || false}`).then(e => e.json()))?.cards?.sort((a, b) => (a.pending && !b.pending ? -1 : a.pending - b.pending) || b.votes - a.votes || a.title.localeCompare(b.title)).map(e => [e.id, e]));

  /**@param {string}tagName @param {obj|*|null}data @param {?HTMLElement}parent @param {?boolean}replace*/
  function createElement(tagName, data, parent, replace) {
    const element = document.createElement(tagName);
    if (Object.keys(data || {}).length) for (const [k, v] of Object.entries(data)) {
      if (v == null) continue;
      if (typeof v == 'object') Object.assign(element[k], v);
      else element[k] = v;
    }
    if (parent) replace ? parent.replaceChildren(element) : parent.appendChild(element);
    return element;
  }

  /**@param {string}key @param {?string}value*/
  function updateParams(key, value) {
    const url = new URL(window.location.href), params = new URLSearchParams(window.location.search);

    value ? params.set(key, value) : params.delete(key);
    url.search = params.toString();

    window.history.pushState(null, null, url.toString());
  }

  // Elements
  /**@param {boolean}smallScreen*/
  async function createProfileElement(smallScreen) {
    const fragment = document.createDocumentFragment();
    const profileContainer = createElement('div', { id: 'profile-container' });

    user = await fetchAPI('user').catch(() => { }).then(e => e.json());
    if (!user || user.errorCode) {
      if (user.errorCode == 403) return createElement('h2', { textContent: user.error }, document.body, true);

      fragment.appendChild(searchBoxElement);
      createElement('button', { id: 'feature-request-button', textContent: smallScreen ? 'New Request' : 'New Feature Request', className: 'grey-hover' }, fragment);
      createElement('button', { id: 'login-button', textContent: smallScreen ? 'Login' : 'Login with Discord', className: 'blue-button' }, profileContainer)
        .addEventListener('click', () => window.location.href = `/auth/discord?redirectURL=${window.location.href}`);
      fragment.appendChild(profileContainer);

      return void headerContainer.appendChild(fragment);
    }

    profileContainer.addEventListener('click', () => profileContainerWrapper.style.display = profileContainerWrapper.style.display === 'block' ? 'none' : 'block');

    const img = new Image(39, 39);
    img.onload = () => profileContainer.appendChild(img);
    img.alt = 'Profile';
    img.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp?size=64`;

    const profileContainerWrapper = createElement('div', { id: 'profile-container-wrapper' }, profileContainer);

    createElement('div', { id: 'username', textContent: user.displayName || user.username }, profileContainerWrapper);
    createElement('button', { id: 'logout-button', textContent: 'Logout', className: 'blue-button' }, profileContainerWrapper).addEventListener('click', async () => {
      const res = await fetch('/auth/logout');

      await Swal.fire(res.ok ? { icon: 'success', title: 'Success', text: 'You are now logged out.' } : { icon: 'error', title: 'Logout failed', text: res.statusText });
      if (res.ok) window.location.reload();
    });

    const featureRequestButtonElement = createElement('button', { id: 'feature-request-button', textContent: smallScreen ? 'New Request' : 'New Feature Request', className: 'grey-hover' });
    if (smallScreen) {
      createElement('br', fragment);
      fragment.appendChild(profileContainer);
      fragment.appendChild(searchBoxElement);
      fragment.appendChild(featureRequestButtonElement);
    }
    else {
      fragment.appendChild(searchBoxElement);
      fragment.appendChild(featureRequestButtonElement);
      fragment.appendChild(profileContainer);
    }

    headerContainer.appendChild(fragment);
  }

  /**@param {boolean}smallScreen*/
  async function createFeatureReqElement(smallScreen) {
    const featureRequestOverlay = document.getElementById('feature-request-overlay');
    document.getElementById('feature-request-button').addEventListener('click', () => {
      if (!user?.id) return Swal.fire({
        icon: 'error',
        title: 'Who are you?',
        text: 'You must be logged in to be able to create a feature request!',
      });

      headerContainer.inert = true;
      cardsContainer.inert = true;
      cardsContainerPending.inert = true;
      if (saveButtonElement) saveButtonElement.inert = true;

      featureRequestOverlay.style.display = 'block';
      if (smallScreen) cardsContainer.style.display = 'none';
    });

    const closeButtonElement = document.querySelector('#feature-request-modal>button');
    const hideFeatureReqElement = ({ key }) => {
      if (key && key !== 'Escape' || featureRequestOverlay.style.display === 'none') return;

      headerContainer.inert = '';
      cardsContainer.inert = '';
      cardsContainerPending.inert = '';
      if (saveButtonElement) saveButtonElement.inert = '';

      if (smallScreen) cardsContainer.style.display = '';
      featureRequestOverlay.style.display = 'none';
    };

    closeButtonElement.addEventListener('click', hideFeatureReqElement);
    document.addEventListener('keydown', hideFeatureReqElement);

    const titleCounter = document.getElementById('title-counter');
    const descriptionCounter = document.getElementById('description-counter');

    document.getElementById('feature-request-title').addEventListener('input', event => {
      titleCounter.textContent = `${event.target.value.length}/140`;
      if (event.target.value.length >= 140) titleCounter.classList.add('limit-reached');
      else titleCounter.classList.remove('limit-reached');
    });
    document.getElementById('feature-request-description').addEventListener('input', event => {
      descriptionCounter.textContent = `${event.target.value.length}/4000`;
      if (event.target.value.length >= 4000) descriptionCounter.classList.add('limit-reached');
      else descriptionCounter.classList.remove('limit-reached');
    });

    document.getElementById('feature-request-modal').addEventListener('submit', data => sendFeatureRequest(data, smallScreen));
  }

  /**@param {?string}query*/
  function displayCards(query = searchBoxElement.value, amount = 26) {
    query = query?.toLowerCase();
    updateParams('q', query);

    const cards = (query ? [...cardsCache.values()].filter(e => e.title.toLowerCase().includes(query) || e.body.toLowerCase().includes(query) || e.id.toLowerCase().includes(query)) : [...cardsCache.values()]).slice(offset, amount + offset);
    if (!cards.length && !cardsContainer.childElementCount && !cardsContainerPending.childElementCount) return void createElement('h2', { textContent: `There are currently no feature requests${query ? ' matching your search query' : ''} :(` }, cardsContainer, true);

    if (!offset) {
      cardsContainer.innerHTML = '';
      cardsContainerPending.innerHTML = '';
    }

    for (const card of cards) createCardElement(card);

    offset += amount;
    if (cardsContainer.childElementCount + cardsContainerPending.childElementCount < amount && cardsCache.size > offset) return displayCards(query, amount);
  }

  /**@param {{id:string,title?:string,body?:string,pending?:boolean,votes?:number}}card*/
  function createCardElement(card) {
    const cardElement = createElement('div', { className: 'card', id: card.id });

    const titleElement = createElement('h2', { id: 'title', textContent: card.title, contentEditable: String(!!user.dev) }, cardElement);
    const descriptionElement = card.body || user.dev ? createElement('p', { id: 'description', textContent: card.body, contentEditable: String(!!user.dev) }, cardElement) : null;

    const voteButtonsElement = createElement('div', { className: 'vote-buttons' }, cardElement);
    const upvoteCounterElement = createElement('span', { className: 'vote-counter', textContent: card.pending ? '' : card.votes ?? 0 });

    if (card.pending && user.dev) createElement('button', { textContent: 'Approve', className: 'vote-button blue-button' }, voteButtonsElement).addEventListener('click', async () => {
      const res = await fetchAPI(`vote/approve?featureId=${card.id}`).then(e => e.json());

      if (res.error) return Swal.fire({ icon: 'error', title: 'Oops...', text: res.error });

      Swal.fire({ icon: 'success', title: 'Success', text: `The feature request has been approved.` });

      cardsContainer.appendChild(cardElement);
      if (!cardsContainerPending.childElementCount) {
        document.getElementById('new-requests')?.remove();
        document.getElementById('old-requests')?.remove();

        document.querySelector('#feature-request-overlay + *').style.marginTop = `${headerContainer.clientHeight + 16}px`;
      }
    });
    else if (!card.pending) createElement('button', { className: 'vote-button blue-button', textContent: 'Upvote' }, voteButtonsElement).addEventListener('click', () => sendUpvote(card.id, upvoteCounterElement));

    voteButtonsElement.appendChild(upvoteCounterElement);

    const copyButtonElement = createElement('button', { title: 'Copy card Id', className: 'manage-button grey-hover' }, voteButtonsElement);
    const copyButtonIcon = createElement('i', { className: 'far fa-copy fa-xl' }, copyButtonElement);

    copyButtonElement.addEventListener('click', () => {
      navigator.clipboard.writeText(card.id);
      copyButtonIcon.classList = 'fas fa-check fa-xl';
      setTimeout(() => copyButtonIcon.classList = 'far fa-copy fa-xl', 3000);
    });

    if (user.dev) {
      titleElement.addEventListener('keydown', event => {
        if (!event.target.parentElement.parentElement.hasAttribute('modified')) event.target.parentElement.parentElement.setAttribute('modified', '');

        if (event.key !== 'Enter') return;
        event.preventDefault();
        const element = event.target.parentElement.nextElementSibling;
        element.firstChild.focus();
      });
      descriptionElement?.addEventListener('input', ({ target }) => {
        if (!target.parentElement.hasAttribute('modified')) target.parentElement.setAttribute('modified', '');
      });
    }
    if (user.dev || user.id == card.id.split('_')[0]) {
      const deleteButtonElement = createElement('button', { title: 'Delete card', className: 'manage-button grey-hover', }, voteButtonsElement);
      deleteButtonElement.addEventListener('click', () => Swal.fire({
        icon: 'warning',
        title: 'Are you sure?',
        text: 'Are you sure you want to delete that card? This action cannot be undone!',
        showCancelButton: true,
        preConfirm: () => {
          fetchAPI(`vote/delete?featureId=${cardElement.id}`).then(e => e.statusText);

          cardElement.remove();
          if (!cardsContainerPending.childElementCount) {
            document.getElementById('new-requests')?.remove();
            document.getElementById('old-requests')?.remove();
            document.querySelector('#feature-request-overlay + *').style.marginTop = `${headerContainer.clientHeight + 16}px`;
          }
        }
      }));

      createElement('i', { className: 'far fa-trash-can fa-xl' }, deleteButtonElement);
    }

    if (user.dev) createElement('p', { id: 'userId', title: 'Click to copy', textContent: card.id.split('_')[0] }, voteButtonsElement).addEventListener('click', () => navigator.clipboard.writeText(card.id.split('_')[0]));

    (card.pending ? cardsContainerPending : cardsContainer).appendChild(cardElement);
    if (descriptionElement?.value) descriptionElement.style.height = `${descriptionElement.scrollHeight}px`;
  }

  // Handler 
  function toggleCardDisplayMode() {
    cardsInRows = !cardsInRows;

    if (cardsInRows) {
      localStorage.setItem('displayMode', 'cardsInRows');
      cardsContainer.classList.remove('cards-column-mode');
      cardsContainer.classList.add('cards-row-mode');
      cardsContainerPending.classList.remove('cards-column-mode');
      cardsContainerPending.classList.add('cards-row-mode');
    }
    else {
      localStorage.setItem('displayMode', 'cardsInColumns');
      cardsContainer.classList.remove('cards-row-mode');
      cardsContainer.classList.add('cards-column-mode');
      cardsContainerPending.classList.remove('cards-row-mode');
      cardsContainerPending.classList.add('cards-column-mode');
    }
  }

  /**@param {'dark'|'light'}scheme*/
  async function setColorScheme(scheme = (currentTheme === 'dark' ? 'light' : 'dark')) {
    if (currentTheme === scheme) return;
    currentTheme = scheme;
    localStorage.setItem('theme', currentTheme);

    ['bg', 'text', 'input-bg', 'input-focus-bg', 'card-bg', 'grey-text'].forEach(e => document.documentElement.style.setProperty(`--${e}-color`, `var(--${currentTheme}-mode-${e}-color)`));

    if (loaded) {
      const elements = document.querySelectorAll('body, #header-container button, #header-container>#search-box, .card');
      for (const e of elements) e.classList.add('color-transition');

      setTimeout(() => elements.forEach(e => e.classList.remove('color-transition')), 300);
    }
  }

  /**@param {Event}event @param {boolean}smallScreen*/
  async function sendFeatureRequest(event, smallScreen) {
    event.preventDefault();

    const res = await fetchAPI('vote/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: event.target.title.value.trim(),
        description: event.target.description.value.trim()
      })
    }).then(e => e.json());

    if (res.error) return void Swal.fire({ icon: 'error', title: 'Oops...', text: res.error });

    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: `Your feature request has been submitted and ${res.approved ? 'approved' : 'will be reviewed shortly'}.`,
    });

    cardsCache.set(res.id, res);

    event.target.reset();

    if (smallScreen) cardsContainer.style.display = '';
    document.getElementById('feature-request-overlay').style.display = 'none';
  }

  /**@param {str}cardId @param {HTMLElement}voteCounter*/
  async function sendUpvote(cardId, voteCounter) {
    if (!user?.id) return void Swal.fire({
      icon: 'error',
      title: 'Who are you?',
      text: 'You must be logged in to be able to vote!',
    });

    const res = await fetchAPI(`vote/addvote?featureId=${cardId}`).then(e => e.json());
    if (res.error) return void Swal.fire({ icon: 'error', title: 'Oops...', text: res.error });

    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Your vote has been successfully recorded.'
    });

    voteCounter.textContent = parseInt(voteCounter.textContent) + 1;
  }

  async function updateCards() {
    const updateList = [...document.querySelectorAll('.card[modified]')].reduce((acc, card) => {
      card.removeAttribute('modified');

      const originalData = cardsCache.get(card.id);
      if (originalData && (card.children.title.textContent.trim() !== originalData.title || card.children.description.textContent.trim() != originalData.body))
        acc.push({ id: card.id, title: card.children.title.textContent.trim(), body: card.children.description.textContent.trim() });
      return acc;
    }, []);

    if (!updateList.length) return void Swal.fire({ icon: 'error', title: 'Oops...', text: 'No cards have been modified.' });

    const res = await fetchAPI('vote/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateList)
    }).then(e => e.json());

    if (res.error) return void Swal.fire({ icon: 'error', title: 'Oops...', text: res.error });

    Swal.fire({ icon: 'success', title: 'Success', text: 'The cards have been updated.' });

    offset = 0;
    cardsCache = await fetchCards();
    displayCards();
  }

  //Listener
  document.getElementById('toggle-cards-display').addEventListener('click', () => toggleCardDisplayMode());
  document.getElementById('toggle-color-scheme').addEventListener('click', () => setColorScheme());

  window.addEventListener('scroll', () => {
    if (cardsCache.size > offset && document.documentElement.scrollTop + document.documentElement.clientHeight >= document.documentElement.scrollHeight - 15) displayCards();
  });
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentWidth = window.innerWidth;

      if (oldWindowWidth > 769 && currentWidth < 768 || oldWindowWidth < 768 && currentWidth > 769) window.location.reload();
      else oldWindowWidth = currentWidth;
    }, 500);
  });
  window.addEventListener('beforeunload', event => {
    if (document.querySelectorAll('.card[modified]').length) event.returnValue = 'You have unsaved changes.';
  });

  document.addEventListener('DOMContentLoaded', async () => {
    setColorScheme(localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches && 'light') || 'dark');

    const smallScreen = window.matchMedia('(max-width: 768px)').matches;
    if (!smallScreen) cardsInRows = localStorage.getItem('displayMode') === 'cardsInRows';

    await createProfileElement(smallScreen);
    createFeatureReqElement(smallScreen);

    cardsCache = await fetchCards();
    cardsContainer.classList.add(cardsInRows ? 'cards-row-mode' : 'cards-column-mode');
    cardsContainerPending.classList.add(cardsInRows ? 'cards-row-mode' : 'cards-column-mode');

    if (window.location.hash == '#new') document.getElementById('feature-request-button').click();

    //navigator.clipboard is not available with HTTP
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

    document.querySelector('#feature-request-overlay + *').style.marginTop = `${headerContainer.clientHeight + 16}px`;
    document.documentElement.style.scrollPaddingTop = `${headerContainer.clientHeight + 20}px`;

    loaded = true;
  });
})();
