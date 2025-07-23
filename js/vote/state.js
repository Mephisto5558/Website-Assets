/** @type {import('.').CardsCache} */
export const cardsCache = new Map();

export let /** @type {import('.').User | undefined} */ user;
export let cardsOffset = 0;
export let pageIsLoaded = false;
export let smallScreen = false;

/** @param {import('.').User} newUser */
export const setUser = newUser => user = newUser;
export const setCardsOffset = newOffset => cardsOffset = newOffset;
export const incrementCardsOffset = amount => cardsOffset += amount;
export const setPageIsLoaded = loaded => pageIsLoaded = loaded;
export const setSmallScreen = isSmall => smallScreen = isSmall;

export default { cardsCache, user, cardsOffset, pageIsLoaded, smallScreen, setUser, setCardsOffset, incrementCardsOffset, setPageIsLoaded, setSmallScreen };