(() => {
  let user, cardsCache, searchTimeout, offset = 0, currentTheme, loaded, cardsInRows = localStorage.getItem('displayMode') ? localStorage.getItem('displayMode') === 'cardsInRows' : !navigator.userAgentData?.mobile;
  const
    cardsContainer = document.getElementById('cards-container'),
    searchBox = document.getElementById('search-box');

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
  async function createProfileElement() {
    user = await fetchAPI('user').catch(() => { }).then(e => e.json());
    const profileContainer = document.querySelector('.profile-container');

    if (user?.error || !user) return createElement('button', 'login-button', null, 'Login with Discord', profileContainer).addEventListener('click', () => window.location.href = `/auth/discord?redirectURL=${window.location.href}`);

    const profileContainerWrapper = createElement('div', 'profile-container-wrapper');
    const profileImageElement = createElement('img', 'profile-image', null, null, profileContainer);
    profileImageElement.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`;
    profileImageElement.alt = 'Profile';
    profileImageElement.addEventListener('click', () => profileContainerWrapper.style.display = profileContainerWrapper.style.display === 'block' ? 'none' : 'block');

    createElement('div', 'username', null, user.displayName || `${user.username}#${user.discriminator}`, profileContainerWrapper);
    createElement('button', 'logout-button', null, 'Logout', profileContainerWrapper).addEventListener('click', async () => {
      const res = await fetch('/auth/logout');
      if (!res.ok) return Swal.fire({ icon: 'error', title: 'Logout failed', text: res.statusText });

      await Swal.fire({ icon: 'success', title: 'Success', text: 'You are now logged out.' });
      window.location.reload();
    });


    profileContainer.appendChild(profileContainerWrapper);
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
      if (event.target === featureRequestOverlay) featureRequestOverlay.style.display = 'none';
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

  function displayCards(query = searchBox.value, amount = 25) {
    query = query?.toLowerCase();
    updateParams('q', query);

    let cards = cardsCache.slice(offset, amount + offset);
    if (query) cards = cards.filter(e => e.title.toLowerCase().includes(query) || e.body.toLowerCase().includes(query) || e.id.toLowerCase().includes(query));

    if (!cards.length && !cardsContainer.childElementCount) return createElement('h2', null, null, `There are currently no feature requests${query ? ' matching your search query.' : ''} :(`, cardsContainer, 'replace');

    if (!offset) cardsContainer.innerHTML = '';
    for (const card of cards) createCardElement(card);

    offset += amount;
    if (cardsContainer.childElementCount < amount) displayCards(...arguments);
  }

  function createCardElement(card) {
    const cardElement = createElement('div', 'card', card.id);

    if (card.title) createElement('h2', null, null, card.title, cardElement);
    if (card.body) createElement('p', null, null, card.body, cardElement);

    const voteButtonsElement = createElement('div', 'vote-buttons', null, null, cardElement);

    createElement('button', 'vote-button', null, 'Upvote', voteButtonsElement).addEventListener('click', () => sendUpvote(card.id, upvoteCounterElement));
    createElement('span', 'vote-counter', null, card.votes ?? 0, voteButtonsElement);

    const copyButtonElement = createElement('button', 'copy-button', null, null, voteButtonsElement);
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

    if (!scheme && user.id == '636196723852705822') await Swal.fire({
      icon: currentTheme === 'light' ? 'error' : 'success',
      title: 'Hallo Koi',
      text: currentTheme === 'light' ? 'Du kriegst keinen Lightmode, ist ungesund!' : 'Welcome to the dark side!',
    });

    ['bg', 'text', 'input-bg', 'input-focus-bg', 'card-bg'].forEach(e => document.documentElement.style.setProperty(`--${e}-color`, `var(--${currentTheme}-mode-${e}-color)`));

    if (loaded) {
      const elements = document.querySelectorAll('body, #search-box, #feature-request-button, .header-container #toggle-cards-display, .header-container #toggle-light-mode, .login-button, .logout-button, .card');
      for (const e of elements) e.classList.add('color-transition');

      setTimeout(() => elements.forEach(e => e.classList.remove('color-transition')), 300);
    }
  }

  async function sendFeatureRequest(data) {
    debugger;
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
  searchBox.addEventListener('input', ({ target }) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      offset = 0;
      displayCards(target.value);
    }, 500);
  });

  document.getElementById('toggle-cards-display').addEventListener('click', () => toggleCardDisplayMode());
  document.getElementById('toggle-color-scheme').addEventListener('click', () => setColorScheme());

  window.addEventListener('scroll', () => {
    if (cardsCache.length > offset && document.documentElement.scrollTop + document.documentElement.clientHeight >= document.documentElement.scrollHeight - 15) displayCards();
  });

  document.addEventListener('DOMContentLoaded', async () => {
    setColorScheme(localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches && 'light') || 'dark');
    const query = new URLSearchParams(window.location.search).get('q');
    if (query) searchBox.value = query;

    await createProfileElement();
    createFeatureReqElement();

    cardsCache = (await fetchAPI(`vote/list`).then(e => e.json()))?.cards || [];
    cardsContainer.classList.add(cardsInRows ? 'cards-row-mode' : 'cards-column-mode');
    cardsContainer.style.marginTop = `${document.querySelector('.header-container').clientHeight + 16}px`;

    displayCards();
    loaded = true;
  });
})()