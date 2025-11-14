/* eslint-disable @typescript-eslint/no-non-null-assertion */

import createElement from './createElement';

export const

  /** empty string if not on localhost */
  DEBUG_URL = ['localhost', '127.0.0.1'].includes(globalThis.location.hostname) ? `http://${globalThis.location.hostname}:8006` as const : '',
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
  headerContainer = document.body.querySelector<HTMLElement>('#header-container')!,
  cardsContainer = document.body.querySelector<HTMLElement>('#cards-container')!,
  cardsContainerPending = document.body.querySelector<HTMLElement>('#cards-container-pending')!,
  featureRequestOverlay = document.body.querySelector<HTMLElement>('#feature-request-overlay')!,
  searchBoxElement = createElement('input', {
    type: 'text', placeholder: 'Search', id: 'search-box', value: new URLSearchParams(globalThis.location.search).get('q') ?? '', className: 'grey-hover', maxLength: MAX_SEARCHBOX_LENGTH
  });