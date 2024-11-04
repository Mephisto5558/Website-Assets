export declare namespace vote {
  type Card = { id: string; title: string; body?: string; pending?: boolean; votes?: number };
  type CardsCache = Map<string, Card>;

  type UserData = { id: string; username: string; locale: string; avatar: string; banner: string | null; dev: boolean };
  type UserError = { errorCode: number; error: string };
  type User<canBeError extends boolean = true> = UserData & (canBeError extends true ? UserError : never);

  function debounce<CB extends (...args: unknown[]) => unknown>(callback: CB, wait: number): (...args: unknown[]) => Promise<ReturnType<CB>>;
  function debounceTimeoutCB(res: (...args: unknown[]) => unknown, rej: (...args: unknown[]) => never, ...args: unknown[]): void;

  function fetchAPI(url: string, options?: RequestInit, timeout?: number): Promise<Response | Error>;
  function fetchCards(): Promise<CardsCache>;
  function createElement(tagName: string, data?: Record<string, unknown>, parent?: HTMLElement, replace?: boolean): HTMLElement;
  function updateParams(key: string, value?: string): void;
  function createProfileElement(): Promise<HTMLElement | undefined>;
  function createFeatureReqElement(): void;
  function displayCards(query?: string, amount?: number): void;
  function createCardElement(card: Card): void;
  function setColorScheme(scheme?: 'dark' | 'light'): void;
  function hideFeatureReqElement(event?: KeyboardEvent): void;
  function sendFeatureRequest(event: Event): Promise<void>;
  function sendUpvote(cardId: Card['id'], voteCounter: HTMLElement): Promise<void>;
}