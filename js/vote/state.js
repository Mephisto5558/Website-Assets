export default class state {
  /** @type {import('.').CardsCache} */
  static cardsCache = new Map();

  /** @type {import('.').User | undefined} */ user;
  static cardsOffset = 0;
  static pageIsLoaded = false;
  static smallScreen = false;
}