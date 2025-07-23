type HTMLElementData<ELEM> = { [K in keyof ELEM]: ELEM[K] };

export type Card = { id: string; title: string; body?: string; pending?: boolean; votes?: number };
export type CardsCache = Map<string, Card>;

export type UserData = { id: string; username: string; locale: string; avatar: string; banner: string | null; dev: boolean };
export type UserError = { errorCode: number; error: string };
export type User<canBeError extends boolean = true> = UserData & (canBeError extends true ? UserError : never);

export function debounce<CB extends (...args: unknown[]) => unknown>(callback: CB, wait: number): (...args: unknown[]) => Promise<ReturnType<CB>>;
export function debounceTimeoutCB(res: (...args: unknown[]) => unknown, rej: (...args: unknown[]) => never, ...args: unknown[]): void;

export function fetchAPI(url: string, options?: RequestInit, timeout?: number): Promise<Response | Error>;
export function fetchCards(): Promise<CardsCache>;
export function createElement<
  TAG_NAME extends keyof HTMLElementTagNameMap,
  ELEM extends HTMLElementTagNameMap[TAG_NAME],
  PARENT extends HTMLElement | undefined = undefined
>(
  tagName: TAG_NAME, data?: HTMLElementData<ELEM>, parent?: PARENT, replace?: boolean
): ELEM & (PARENT extends undefined ? unknown : { parentElement: PARENT });
export function updateParams(key: string, value?: string): void;
export function createProfileElement(): Promise<HTMLElement | undefined>;
export function createFeatureReqElement(): void;

/**
 * @param amount More like a max amount; will load more if the screen is not filled yet.
 * @returns all fetched cards, including not displayed ones */
export function displayCards(query?: string, amount?: number): Card[];
export function createCardElement(card: Card): void;
export function setColorScheme(scheme?: 'dark' | 'light'): void;
export function hideFeatureReqElement(event?: KeyboardEvent): void;
export function sendFeatureRequest(event: Event): Promise<void>;
export function sendUpvote(cardId: Card['id'], voteCounter: HTMLElement): Promise<void>;