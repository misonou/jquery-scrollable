interface JQuery<TElement = HTMLElement> {
    scrollable(options: Partial<JQueryScrollableOptions>): this;
    scrollable<T extends keyof JQueryScrollable>(action: T, ...args: JQueryScrollable[T] extends (...args) => any ? Parameters<JQueryScrollable[T]> : []): JQueryScrollable[T] extends (...args) => any ?
        ReturnType<JQueryScrollable[T]> extends void ? this : ReturnType<JQueryScrollable[T]> :
        JQueryScrollable[T];
}

interface JQueryStatic {
    scrollable(element: Element): JQueryScrollable | undefined;
    scrollable(element: Element, options: JQueryScrollableOptions): JQueryScrollable;
}

interface JQueryScrollable {
    readonly scrollTarget: Element | null;
    readonly scrollX: number;
    readonly scrollY: number;
    readonly scrollPercentX: number;
    readonly scrollPercentY: number;
    readonly scrollMaxX: number;
    readonly scrollMaxY: number;

    destroy(): void;
    enable(): void;
    disable(): void;
    setOptions(options: Partial<JQueryScrollableOptions>): void;
    refresh(): void;
    scrollPadding(): Readonly<{ top: number; left: number; right: number; bottom: number; }>;
    stop(): void;
    scrollLeft(): number;
    scrollTop(): number;
    scrollBy(x: number, y: number, duration?: number, callback?: () => void): Promise<void>;
    scrollTo(x: number, y: number, duration?: number, callback?: () => void): Promise<void>;
    scrollByPage(x: number, y: number, duration?: number, callback?: () => void): Promise<void>;
    scrollToPage(x: number, y: number, duration?: number, callback?: () => void): Promise<void>;
    scrollToElement(target: Element, targetOrigin: string, duration: number, callback?: () => void): Promise<void>;
    scrollToElement(target: Element, targetOrigin?: string, wrapperOrigin?: string, duration?: number, callback?: () => void): Promise<void>;
}

interface JQueryScrollableScrollbarOptions {
    scrollbarClass?: string;
    scrollbarInset?: number;
    scrollbarSize?: number;
    scrollbarStyle?: Partial<CSSStyleDeclaration>;
    scrollbarTrackStyle?: Partial<CSSStyleDeclaration>;
}

interface JQueryScrollableEventProps {
    readonly type: string;
    readonly startX: number;
    readonly startY: number;
    readonly offsetX: number;
    readonly offsetY: number;
    readonly deltaX: number;
    readonly deltaY: number;
    readonly percentX: number;
    readonly percentY: number;
    readonly pageIndex: number;
    readonly pageItem: Element | null;
}

interface JQueryScrollableOptions extends JQueryScrollableScrollbarOptions {
    content: string;
    cancel: string;
    getWrapperDimension: (elm: JQuery<HTMLElement>) => { width: number; height: number; },
    getContentDimension: (elm: JQuery<HTMLElement>) => { width: number; height: number; },
    handle: 'auto' | 'scrollbar' | 'content' | 'both',
    wheel: boolean;
    hScroll: boolean;
    vScroll: boolean;
    bounce: boolean;
    hBounce: boolean;
    vBounce: boolean;
    bounceDuration: number;
    momentum: boolean;
    lockDirection: boolean;
    scrollingClass: string;
    scrollableXClass: string;
    scrollableYClass: string;
    scrollbar: (elm: JQuery<HTMLElement>, dir: 'x' | 'y', options: JQueryScrollableScrollbarOptions) => Element | JQuery,
    pageItem: string;
    pageItemAlign: 'center' | 'left' | 'right' | 'top' | 'bottom';
    pageDirection: 'auto' | 'x' | 'y';
    snapToPage: boolean;
    sticky: string;
    stickyHandle: string;
    stickyToBottom: boolean;
    stickyClass: string;
    touchMove: (e: JQueryScrollableEventProps) => void,
    scrollStart: (e: JQueryScrollableEventProps) => void,
    scrollMove: (e: JQueryScrollableEventProps) => void,
    scrollStop: (e: JQueryScrollableEventProps) => void,
    scrollEnd: (e: JQueryScrollableEventProps) => void,
    scrollProgressChange: (e: JQueryScrollableEventProps) => void;
}
