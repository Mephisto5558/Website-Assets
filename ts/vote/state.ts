const state = {
  cardsCache: new Map() as CardsCache,
  user: undefined as User | undefined,
  cardsOffset: 0,
  pageIsLoaded: false,
  smallScreen: false
};

export default state;