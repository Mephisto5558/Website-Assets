export default class state {
  static readonly cardsCache: CardsCache = new Map();

  static user: User | undefined;
  static cardsOffset = 0;
  static pageIsLoaded = false;
  static smallScreen = false;
}