export declare namespace vote {
  type Card = { id: string; title: string; body?: string; pending?: boolean; votes?: number };
  type CardsCache = Map<string, Card>;

  type UserData = { id: string; username: string; locale: string; avatar: string; banner: string | null; dev: boolean };
  type UserError = { errorCode: number; error: string };
  type User<canBeError extends boolean = true> = UserData & (canBeError extends true ? UserError : never);

  function debounce<CB extends (...args: unknown[]) => unknown>(callback: CB, wait: number): (...args: unknown[]) => Promise<ReturnType<CB>>;
  function fetchAPI(url: string, options?: RequestInit, timeout?: number): Promise<Response | Error>;
  function fetchCards(): Promise<CardsCache>;
  function createElement(tagName: string, data?: Record<string, unknown>, parent?: HTMLElement, replace?: boolean): HTMLElement;
  function updateParams(key: string, value?: string): void;
  function createProfileElement(smallScreen?: boolean): Promise<HTMLElement | undefined>;
  function createFeatureReqElement(smallScreen?: boolean): void;
  function displayCards(query?: string, amount?: number): void;
  function createCardElement(card: Card): void;
  function setColorScheme(scheme?: 'dark' | 'light'): void;
  function sendFeatureRequest(event: Event, smallScreen?: boolean): Promise<void>;
  function sendUpvote(cardId: Card['id'], voteCounter: HTMLElement): Promise<void>;
}