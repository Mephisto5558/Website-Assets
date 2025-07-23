import { createElement } from './createElement.js';

export const
  HTTP_STATUS_FORBIDDEN = 403,
  MAX_SEARCHBOX_LENGTH = 200,
  MAX_TITLE_LENGTH = 140,
  MAX_BODY_LENGTH = 4000,
  PROFILE_IMG_SIZE = 39,
  ADDITIONAL_HEADER_MARGIN = 16,
  WINDOW_WIDTH_RELOAD_TRESHOLD = 768,
  COLOR_TRANSITION_TIME = 300,
  msInSecond = 1000,
  cardModes = { columnMode: 'cards-column-mode', rowMode: 'cards-row-mode' },
  /** @type {HTMLElement} */ headerContainer = document.body.querySelector('#header-container'),
  /** @type {HTMLElement} */ cardsContainer = document.body.querySelector('#cards-container'),
  /** @type {HTMLElement} */ cardsContainerPending = document.body.querySelector('#cards-container-pending'),
  /** @type {HTMLElement} */ featureRequestOverlay = document.body.querySelector('#feature-request-overlay'),

  /** @type {HTMLInputElement} */
  searchBoxElement = createElement('input', {
    type: 'text', placeholder: 'Search', id: 'search-box', value: new URLSearchParams(globalThis.location.search).get('q'), className: 'grey-hover', maxLength: MAX_SEARCHBOX_LENGTH
  });