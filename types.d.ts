interface JQuery<TElement = HTMLElement> {
    scrollable(options: Partial<JQueryScrollableOptions>): this;
    scrollable<T extends keyof JQueryScrollable>(action: T, ...args: JQueryScrollable[T] extends (...args) => any ? Parameters<JQueryScrollable[T]> : []): JQueryScrollable[T] extends (...args) => any ?
        ReturnType<JQueryScrollable[T]> extends void ? this : ReturnType<JQueryScrollable[T]> :
        JQueryScrollable[T];
}

interface JQueryScrollableStatic {
    (element: Element): JQueryScrollable | undefined;
    (element: Element, options: JQueryScrollableOptions): JQueryScrollable;
    hook(hooks: JQueryScrollableEventHooks): void;
}

interface JQueryStatic {
    scrollable: JQueryScrollableStatic;
}

type JQueryScrollableStickyPosition = 'none' | 'left' | 'top' | 'right' | 'bottom' | 'left bottom' | 'left top' | 'right bottom' | 'right top';

interface JQueryScrollable {
    /**
     * Gets the content element of which scrolling is being controlled.
     */
    readonly scrollTarget: Element | null;
    /**
     * Gets horizontal scroll position.
     */
    readonly scrollX: number;
    /**
     * Gets vertical scroll position.
     */
    readonly scrollY: number;
    /**
     * Gets horizontal position in percentage with respect to full content width.
     */
    readonly scrollPercentX: number;
    /**
     * Gets vertical position in percentage with respect to full content height.
     */
    readonly scrollPercentY: number;
    /**
     * Gets the maximum number of pixels that the content can be scrolled horizontally.
     */
    readonly scrollMaxX: number;
    /**
     * Gets the maximum number of pixels that the content can be scrolled vertically.
     */
    readonly scrollMaxY: number;

    /**
     * Deactivates the scrollable plugin and release all resources.
     */
    destroy(): void;
    /**
     * Enables scrolling of content area.
     */
    enable(): void;
    /**
     * Disables scrolling of content area.
     */
    disable(): void;
    /**
     * Sets options for jQuery scrollable plugin.
     * @param options A dictionary specifying options.
     */
    setOptions(options: Partial<JQueryScrollableOptions>): void;
    /**
     * Sets sticky position for one or more elements.
     * @param element An element or a valid CSS selector.
     * @param dir Which side(s) should the element be sticked onto to remain visible when the element is scrolled beyond visible area. When given `none` the element will no longer be sticky.
     * @param fixed Whether the element should be in fixed position, as if the content area is scrolled all the way in that direction.
     */
    setStickyPosition(element: Element | string, dir: JQueryScrollableStickyPosition, fixed?: boolean): void;
    /**
     * Sets sticky position for one or more elements.
     * @param element An element or a valid CSS selector.
     * @param dir Which side should the element be sticked onto to remain visible when the element is scrolled beyond visible area. When given `none` the element will no longer be sticky.
     * @param within When specified, the element will only be sticked onto the side of this element or region.
     * @param fixed Whether the element should be in fixed position, as if the content area is scrolled all the way in that direction.
     */
    setStickyPosition(element: Element | string, dir: JQueryScrollableStickyPosition, within: (() => DOMRectReadOnly) | Element | string, fixed?: boolean): void;
    /**
     * Forces recalculation of internal states.
     */
    refresh(): void;
    /**
     * Returns the scroll padding
     */
    scrollPadding(target?: Element): Readonly<{ top: number; left: number; right: number; bottom: number; }>;
    /**
     * Stops scrolling immediately.
     */
    stop(): void;
    /**
     * Gets horizontal scroll position.
     * Unlike {@link JQueryScrollable.scrollX}, if content is being scrolled in animated manner, the final position is returned.
     */
    scrollLeft(): number;
    /**
     * Gets vertical scroll position.
     * Unlike {@link JQueryScrollable.scrollY}, if content is being scrolled in animated manner, the final position is returned.
     */
    scrollTop(): number;
    /**
     * Scrolls content area by the specified number of pixels.
     * @param x Number of pixels in horizontal direction.
     * @param y Number of pixels in vertical direction.
     * @param duration Duration of animated scrolling in milliseconds. Default is `0`, meaning for no animation.
     * @param callback A callback to be invoked when scrolling is completed.
     * @returns A promise that resolves when scrolling is completed.
     */
    scrollBy(x: number, y: number, duration?: number, callback?: () => void): Promise<void> & JQueryScrollableState;
    /**
     * Scrolls content area to the specific offsets meansured from top-left corner.
     * @param x Number of pixels in horizontal direction.
     * @param y Number of pixels in vertical direction.
     * @param duration Duration of animated scrolling in milliseconds. Default is `0`, meaning for no animation.
     * @param callback A callback to be invoked when scrolling is completed.
     * @returns A promise that resolves when scrolling is completed.
     */
    scrollTo(x: number, y: number, duration?: number, callback?: () => void): Promise<void> & JQueryScrollableState;
    /**
     * Scrolls content area by the specified number of pages. It is identical to scroll by the number of pixels of the visible content area.
     * @param x Number of pages in horizontal direction.
     * @param y Number of pages in vertical direction.
     * @param duration Duration of animated scrolling in milliseconds. Default is `0`, meaning for no animation.
     * @param callback A callback to be invoked when scrolling is completed.
     * @returns A promise that resolves when scrolling is completed.
     */
    scrollByPage(x: number, y: number, duration?: number, callback?: () => void): Promise<void> & JQueryScrollableState;
    /**
     * Scrolls content area to a specified page. It is identical to scroll to the number of pixels of the visible content area times the page index.
     * @param x Page index in horizontal direction.
     * @param y Page index in vertical direction.
     * @param duration Duration of animated scrolling in milliseconds. Default is `0`, meaning for no animation.
     * @param callback A callback to be invoked when scrolling is completed.
     * @returns A promise that resolves when scrolling is completed.
     */
    scrollToPage(x: number, y: number, duration?: number, callback?: () => void): Promise<void> & JQueryScrollableState;
    /**
     * Scrolls content area so that the target element is aligned to a specific location.
     * @param target A element or a valid CSS selector.
     * @param targetOrigin The coordinate of the target element to be aligned. It supports format likes `left top`, `left+50px top-10px`, or `left+10% top+10%`.
     * @param duration Duration of animated scrolling in milliseconds. Default is `0`, meaning for no animation.
     * @param callback A callback to be invoked when scrolling is completed.
     * @returns A promise that resolves when scrolling is completed.
     */
    scrollToElement(target: Element | string, targetOrigin: string, duration: number, callback?: () => void): Promise<void> & JQueryScrollableState;
    /**
     * Scrolls content area so that the target element is aligned to a specific location.
     * @param target A element or a valid CSS selector.
     * @param targetOrigin The coordinate of the target element to be aligned. It supports format likes `left top`, `left+50px top-10px`, or `left+10% top+10%`.
     * @param wrapperOrigin The coordinate of the visible content area that the target element is aligned to. It supports format likes `left top`, `left+50px top-10px`, or `left+10% top+10%`.
     * @param duration Duration of animated scrolling in milliseconds. Default is `0`, meaning for no animation.
     * @param callback A callback to be invoked when scrolling is completed.
     * @returns A promise that resolves when scrolling is completed.
     */
    scrollToElement(target: Element | string, targetOrigin?: string, wrapperOrigin?: string, duration?: number, callback?: () => void): Promise<void> & JQueryScrollableState;
}

interface JQueryScrollableScrollbarOptions {
    /**
     * CSS class applied to the scrollbar elements.
     */
    scrollbarClass?: string;
    /**
     * Specifying the distance of the scrollbar in pixels to the edge of the container.
     * If negative number is supplied, the scrollbar will be placed at the distance outside the container.
     *
     * When option is not specified, it will fallback to `--jqs-scrollbar-inset` CSS variable.
     */
    scrollbarInset?: number;
    /**
     * Specify the width of the scrollbar in pixels.
     *
     * When option is not specified, it will fallback to `--jqs-scrollbar-size` CSS variable.
     */
    scrollbarSize?: number;
    /**
     * CSS styles applied to the scrollbar element.
     *
     * When `backgroundColor`, `borderRadius` or `opacity` is not specified,
     * it will fallback to `--jqs-scrollbar-color`, `--jqs-scrollbar-radius`, `--jqs-scrollbar-opacity`
     * CSS variable correspondingly.
     */
    scrollbarStyle?: Partial<CSSStyleDeclaration>;
    /**
     * CSS styles applied to the scrollbar track element.
     */
    scrollbarTrackStyle?: Partial<CSSStyleDeclaration>;
}

interface JQueryScrollableEventHooks {
    /**
     * Attach event listener that is invoked when touch has been moved within scrollable area.
     */
    touchMove?: (this: Element, e: JQueryScrollableEventProps) => void;
    /**
     * Attach event listener that is invoked when the scrolling of content has just started.
     */
    scrollStart?: (this: Element, e: JQueryScrollableEventProps) => void;
    /**
     * Attach event listener that is invoked when the content has scrolled to a different offset.
     */
    scrollMove?: (this: Element, e: JQueryScrollableEventProps) => void;
    /**
     * Attach event listener that is invoked when the content has just stopped being scrolled actively.
     * The content might continue to be scrolled when momentum or bounch back effect is on.
     */
    scrollStop?: (this: Element, e: JQueryScrollableEventProps) => void;
    /**
     * Attach event listener that is invoked when the scrolling of content has stopped completely.
     */
    scrollEnd?: (this: Element, e: JQueryScrollableEventProps) => void;
    /**
     * Attach event listener that is invoked when the percentage of content scrolled has changed.
     * The change can be either due to scrolling of content, or the change of size of the container or content.
     */
    scrollProgressChange?: (this: Element, e: JQueryScrollableEventProps) => void;
}

interface JQueryScrollableState {
    /**
     * Horizontal position when the scrolling is started.
     */
    readonly startX: number;
    /**
     * Vertical position when the scrolling is started
     */
    readonly startY: number;
    /**
     * Current horizontal position in scrolling events; or
     * final horizontal position returned by scroll method.
     */
    readonly offsetX: number;
    /**
     * Current vertical position in scrolling events; or
     * final vertical position returned by scroll method.
     */
    readonly offsetY: number;
    /**
     * Different of horizontal position between this and the last `touchMove` or `scrollMove` event; or
     * different between starting and final position returned by scroll method.
     */
    readonly deltaX: number;
    /**
     * Different of vertical position between this and the last `touchMove` or `scrollMove` event; or
     * different starting and final position returned by scroll method.
     */
    readonly deltaY: number;
    /**
     * Current horizontal position in percentage to the content width in scrolling events; or
     * final horizontal position returned by scroll method.
     */
    readonly percentX: number;
    /**
     * Current vertical position in percentage to the content width in scrolling events; or
     * final vertical position returned by scroll method.
     */
    readonly percentY: number;
    /**
     * Current page index if paging is turned on by `pageItem` option in scrolling events; or
     * final page index returned by scroll method.
     */
    readonly pageIndex: number;
    /**
     * Current page element if paging is turned on by `pageItem` option in scrolling events; or
     * final page element returned by scroll method.
     */
    readonly pageItem: Element | null;
}

interface JQueryScrollableEventProps extends JQueryScrollableState {
    readonly type: string;
}

interface JQueryScrollableOptions extends JQueryScrollableScrollbarOptions, JQueryScrollableEventHooks {
    /**
     * A valid CSS selector specifying which element to be scrolled
     * only the first visible element will be scrolled if multiple elements are matched.
     * Default is `>*`, i.e. the first visible child element will be scrolled.
     */
    content?: string;
    /**
     * A valid CSS selector matching elements that scroll action is avoided when mouse or touch acting on these target
     * This option has no effects when `handle` option is set to `scrollbar`.
     */
    cancel?: string;
    /**
     * Specifies a callback to calculate the dimension of the container.
     * The function should return an object of with `width` and `height` properties.
     */
    getWrapperDimension?: (elm: JQuery<HTMLElement>) => { width: number; height: number; },
    /**
     * Specifies a callback to calculate the dimension of the content.
     * The function should return an object of with `width` and `height` properties.
     */
    getContentDimension?: (elm: JQuery<HTMLElement>) => { width: number; height: number; },
    /**
     * Specifies which parts should initiate scrolling when
     * touch or mouse events is received.
     *
     * - `auto`: dragging content area on touch devices or scroll bars on other devices.
     * - `scrollbar`: only when dragging scroll bars
     * - `content`: only when dragging contents.
     *
     * Default is `auto`.
     */
    handle?: 'auto' | 'scrollbar' | 'content' | 'both',
    /**
     * Whether scrolling by mouse wheel is enabled.
     * Default is `true`.
     */
    wheel?: boolean;
    /**
     * Whether vertical wheel scroll can infer horizontal scroll when appropriate.
     * Default is `false`.
     */
    inferWheelX?: boolean;
    /**
     * Whether scrolling in horizontal direction is enabled.
     * Default is `true`.
     */
    hScroll?: boolean;
    /**
     * Whether scrolling in vertical direction is enabled.
     * Default is `true`.
     */
    vScroll?: boolean;
    /**
     * Whether to allow content to be dragged beyond the boundaries when scrolling to the end.
     * The content will be bounced back when mouse or touch is released.
     * Default is `true`.
     */
    bounce?: boolean;
    /**
     * Same as `bounce` option but only activate on horizontal direction.
     * This option has no effect when `bounce` is set to `false.
     */
    hBounce?: boolean;
    /**
     * Same as `bounce` option but only activate on vertical direction.
     * This option has no effect when `bounce` is set to `false.
     */
    vBounce?: boolean;
    /**
     * Specifying how long in milliseconds for the animated bounce back.
     */
    bounceDuration?: number;
    /**
     * Whether to allow the content to continue scrolling when mouse or touch is released.
     * Default is `true`.
     */
    momentum?: boolean;
    /**
     * Whether to lock the scrolling direction to either horizontal or vertical
     * when scrolling in both direction is possible.
     * Default is `true`.
     */
    lockDirection?: boolean;
    /**
     * CSS class applied to the container when scrolling is in action.
     * Default is `scrollable`
     */
    scrollingClass?: string;
    /**
     * CSS class applied to the container when horizontal scrolling is possible.
     * Default is `scrollable-x`.
     */
    scrollableXClass?: string;
    /**
     * CSS class applied to the container when vertical scrolling is possible.
     * Default is `scrollable-y`.
     */
    scrollableYClass?: string;
    /**
     * Specifies a callback to create scrollbar track and handle in DOM.
     * @deprecated
     */
    scrollbar?: (elm: JQuery<HTMLElement>, dir: 'x' | 'y', options: JQueryScrollableScrollbarOptions) => Element | JQuery,
    /**
     * A valid CSS selector specifying pages of scrolled content.
     * This `pageItem` and `pageIndex` properties will update according to current scroll position.
     */
    pageItem?: string;
    /**
     * Specifies how a page is aligned when size of the current page element is smaller the container size.
     * Default is `center`.
     */
    pageItemAlign?: 'center' | 'left' | 'right' | 'top' | 'bottom';
    /**
     * Specifies content is paged horizontally or vertically.
     * Default is `auto`.
     */
    pageDirection?: 'auto' | 'x' | 'y';
    /**
     * Specifies whether it should align page to the container (i.e. never cross-page).
     */
    snapToPage?: boolean;
    /**
     * A valid CSS selector specifying sections of content of which sticky header will be shown for.
     */
    sticky?: string;
    /**
     * A valid CSS selector specifying which element inside sections of content matched by `sticky` option
     * to become sticky.
     */
    stickyHandle?: string;
    /**
     * Whether the `stickyHandle` be placed at the top or ottom of scrolling area.
     */
    stickyToBottom?: boolean;
    /**
     * CSS class applied to elements that are currently sticking to boundaries of parent container.
     */
    stickyClass?: string;
}
