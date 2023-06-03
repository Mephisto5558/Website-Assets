(() => {
  let user, cardsCache, searchTimeout, resizeTimeout, currentTheme, loaded, cardsInRows, offset = 0, oldWindowWidth = window.innerWidth;
  const
    headerContainer = document.querySelector('.header-container'),
    cardsContainer = document.getElementById('cards-container'),
    searchBoxElement = createElement('input', 'grey-hover', 'search-box');

  searchBoxElement.placeholder = 'Search';
  searchBoxElement.type = 'Text';

  //Utils
  const fetchAPI = (url, options, timeout = 5000) => new Promise((res, rej) => {
    const timeoutId = setTimeout(() => rej(new Error('Request timed out')), timeout);
    fetch(url ? `/api/v1/internal/${url}` : null, options).then(res).catch(rej).finally(() => clearTimeout(timeoutId));
  });

  function createElement(tagName, className, id, textContent, parent, type = 'append') {
    const element = document.createElement(tagName);
    if (className != null) element.className = className;
    if (id != null) element.id = id;
    if (textContent != null) element.textContent = textContent;
    if (parent) type == 'replace' ? parent.replaceChildren(element) : parent.appendChild(element);
    return element;
  }

  function updateParams(key, value) {
    const url = new URL(window.location.href), params = new URLSearchParams(window.location.search);

    value ? params.set(key, value) : params.delete(key);
    url.search = params.toString();

    window.history.pushState(null, null, url.toString());
  }

  //Elements
  async function createProfileElement(smallScreen) {
    const fragment = document.createDocumentFragment();
    const profileContainer = createElement('div', 'profile-container');

    user = await fetchAPI('user').catch(() => { }).then(e => e.json());
    if (user?.error || !user) {
      fragment.appendChild(searchBoxElement);
      createElement('button', 'grey-hover', 'feature-request-button', 'New Feature Request', fragment);
      createElement('button', 'login-button blue-button', null, smallScreen ? 'Login' : 'Login with Discord', profileContainer).addEventListener('click', () => window.location.href = `/auth/discord?redirectURL=${window.location.href}`);
      fragment.appendChild(profileContainer);
      
      return headerContainer.appendChild(fragment);
    }

    const profileImageElement = createElement('img', 'profile-image', null, null, profileContainer);
    const profileContainerWrapper = createElement('div', 'profile-container-wrapper', null, null, profileContainer);

    profileImageElement.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`;
    profileImageElement.alt = 'Profile';
    profileImageElement.addEventListener('click', () => profileContainerWrapper.style.display = profileContainerWrapper.style.display === 'block' ? 'none' : 'block');

    createElement('div', 'username', null, user.displayName || `${user.username}#${user.discriminator}`, profileContainerWrapper);
    createElement('button', 'logout-button blue-button', null, 'Logout', profileContainerWrapper).addEventListener('click', async () => {
      const res = await fetch('/auth/logout');
      if (!res.ok) return Swal.fire({ icon: 'error', title: 'Logout failed', text: res.statusText });

      await Swal.fire({ icon: 'success', title: 'Success', text: 'You are now logged out.' });
      window.location.reload();
    });

    const featureRequestButtonElement = createElement('button', 'grey-hover', 'feature-request-button', smallScreen ? 'New' : 'New Feature Request');

    const query = new URLSearchParams(window.location.search).get('q');
    if (query) searchBoxElement.value = query;

    if (smallScreen) {
      createElement('br', null, null, null, headerContainer);
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

  async function createFeatureReqElement() {
    const featureRequestOverlay = document.getElementById('feature-request-overlay');
    document.getElementById('feature-request-button').addEventListener('click', () => {
      if (!user?.id) return Swal.fire({
        icon: 'error',
        title: 'Who are you?',
        text: 'You must be logged in to be able to send a feature request!',
      });

      featureRequestOverlay.style.display = 'block';
    });

    featureRequestOverlay.addEventListener('click', event => {
      if (featureRequestOverlay.style.display === 'block') featureRequestOverlay.style.display = 'none';
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && featureRequestOverlay.style.display === 'block') featureRequestOverlay.style.display = 'none';
    });

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

    document.getElementById('feature-request-modal').addEventListener('submit', sendFeatureRequest);
  }

  function displayCards(query = searchBoxElement.value, amount = 26) {
    query = query?.toLowerCase();
    updateParams('q', query);

    let cards = cardsCache.slice(offset, amount + offset);
    if (query) cards = cards.filter(e => e.title.toLowerCase().includes(query) || e.body.toLowerCase().includes(query) || e.id.toLowerCase().includes(query));

    if (!cards.length && !cardsContainer.childElementCount) return createElement('h2', null, null, `There are currently no feature requests${query ? ' matching your search query.' : ''} :(`, cardsContainer, 'replace');

    if (!offset) cardsContainer.innerHTML = '';
    for (const card of cards) createCardElement(card);

    if (user.dev) for (const buttons of cardsContainer.querySelectorAll('.vote-buttons')) {
      const deleteButtonElement = createElement('button', 'manage-button grey-hover', null, null, buttons);
      deleteButtonElement.title = 'Delete card';
      deleteButtonElement.addEventListener('click', () => Swal.fire({
        icon: 'warning',
        title: 'Are you sure?',
        text: 'Are you sure you want to delete that card? This action cannot be undone!',
        showCancelButton: true,
        preConfirm: () => fetchAPI(`vote/delete?featureId=${buttons.parentElement.id}&userId=${user.id}`).then(e => e.statusText)
      }));

      createElement('i', 'fa-regular fa-trash-can fa-xl', null, null, deleteButtonElement);
    }

    offset += amount;
    if (cardsContainer.childElementCount < amount && cardsCache.length > offset) displayCards(...arguments);
  }

  function createCardElement(card) {
    const cardElement = createElement('div', 'card', card.id);

    if (card.title) createElement('h2', null, null, card.title, cardElement);
    if (card.body) createElement('p', null, null, card.body, cardElement);

    const voteButtonsElement = createElement('div', 'vote-buttons', null, null, cardElement);
    const upvoteCounterElement = createElement('span', 'vote-counter', null, card.votes ?? 0);

    createElement('button', 'vote-button blue-button', null, 'Upvote', voteButtonsElement).addEventListener('click', () => sendUpvote(card.id, upvoteCounterElement));
    voteButtonsElement.appendChild(upvoteCounterElement);

    const copyButtonElement = createElement('button', 'manage-button grey-hover', null, null, voteButtonsElement);
    copyButtonElement.title = 'Copy card Id';
    copyButtonElement.addEventListener('click', () => navigator.clipboard.writeText(card.id));
    createElement('i', 'fa-regular fa-copy fa-xl', null, null, copyButtonElement);

    cardsContainer.appendChild(cardElement);
  }

  //Handler
  function toggleCardDisplayMode() {
    const cardsContainer = document.getElementById('cards-container');
    cardsInRows = !cardsInRows;

    if (cardsInRows) {
      localStorage.setItem('displayMode', 'cardsInRows');
      cardsContainer.classList.remove('cards-column-mode');
      cardsContainer.classList.add('cards-row-mode');
    }
    else {
      localStorage.setItem('displayMode', 'cardsInColumns');
      cardsContainer.classList.remove('cards-row-mode');
      cardsContainer.classList.add('cards-column-mode');
    }
  }

  async function setColorScheme(scheme) {
    currentTheme = scheme || (currentTheme === 'dark' ? 'light' : 'dark');
    localStorage.setItem('theme', currentTheme);

    ['bg', 'text', 'input-bg', 'input-focus-bg', 'card-bg'].forEach(e => document.documentElement.style.setProperty(`--${e}-color`, `var(--${currentTheme}-mode-${e}-color)`));

    if (loaded) {
      const elements = document.querySelectorAll('body, #search-box, #feature-request-button, .header-container #toggle-cards-display, .header-container #toggle-light-mode, .login-button, .logout-button, .card');
      for (const e of elements) e.classList.add('color-transition');

      setTimeout(() => elements.forEach(e => e.classList.remove('color-transition')), 300);
    }
  }

  async function sendFeatureRequest(data) {
    data.preventDefault();

    const res = await fetchAPI('vote/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.target.title.value.trim(),
        description: data.target.description.value.trim(),
        authorId: user.id
      })
    }).then(e => e.json());

    if (res.error) return Swal.fire({ icon: 'error', title: 'Oops...', text: res.error });

    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: `Your feature request has been submitted and ${res.approved ? 'approved' : 'will be reviewed shortly'}.`,
    });

    if (res.approved) return window.location.reload();

    data.target.reset();
    document.getElementById('feature-request-overlay').style.display = 'none';
  }

  async function sendUpvote(cardId, voteCounter) {
    if (!user?.id) return Swal.fire({
      icon: 'error',
      title: 'Who are you?',
      text: 'You must be logged in to be able to vote!',
    });

    const res = await fetchAPI('vote/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        featureId: cardId,
        userId: user?.id,
      }),
    }).then(e => e.json());

    if (res.error) return Swal.fire({ icon: 'error', title: 'Oops...', text: res.error });

    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Your vote has been successfully recorded.'
    });

    voteCounter.textContent = parseInt(voteCounter.textContent) + 1;
  }

  //Listener
  document.getElementById('toggle-cards-display').addEventListener('click', () => toggleCardDisplayMode());
  document.getElementById('toggle-color-scheme').addEventListener('click', () => setColorScheme());

  window.addEventListener('scroll', () => {
    if (cardsCache.length > offset && document.documentElement.scrollTop + document.documentElement.clientHeight >= document.documentElement.scrollHeight - 15) displayCards();
  });
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const currentWidth = window.innerWidth;

      if (oldWindowWidth > 769 && currentWidth < 768 || oldWindowWidth < 768 && currentWidth > 769) window.location.reload();
      else oldWindowWidth = currentWidth;
    }, 500);
  });

  document.addEventListener('DOMContentLoaded', async () => {
    setColorScheme(localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches && 'light') || 'dark');

    const smallScreen = window.matchMedia('(max-width: 768px)').matches;
    if (smallScreen) cardsInRows = false;
    else cardsInRows = localStorage.getItem('displayMode') === 'cardsInRows';

    await createProfileElement(smallScreen);
    createFeatureReqElement();

    searchBoxElement.addEventListener('input', ({ target }) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        offset = 0;
        displayCards(target.value);
      }, 500);
    });

    cardsCache = (await fetchAPI(`vote/list`).then(e => e.json()))?.cards?.sort((a, b) => b.votes - a.votes) || [];
    cardsContainer.classList.add(cardsInRows ? 'cards-row-mode' : 'cards-column-mode');
    cardsContainer.style.marginTop = `${headerContainer.clientHeight + 16}px`;

    displayCards();
    loaded = true;
  });
})();