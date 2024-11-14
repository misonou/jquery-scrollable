## v1.15.0 / 2024-11-14

- Subpixel handling
- Add `trigger` to event properties
- Specifying `handle` as `auto` will result in `content` mode is scrollbar is off
- Continuous scrolling by holding mouse button on scroll track
- Improved scrolling by `keydown`, `auxclick` and `wheel`
- Improved handling of wheel event series emulated by touch pads in Mac devices
- Improved handling of global keyboard event
- Fix: overshoot in incorrect direction on drag
- Fix: momentum and bouncing effect is disrupted

## v1.14.3 / 2024-11-08

- Fix: state CSS class for scrolling, specified by the `scrollingClass` option, remained if scrolling is not triggered in wheel event

## v1.14.2 / 2024-08-22

- Fix: stick to closest matched parent when the same element is set to be sticky in multiple nested instances

## v1.14.1 / 2024-08-06

- ~~Fix: ignore sticky element found in nested instances~~ (further fixed in v1.14.2)

## v1.14.0 / 2024-06-20

- Auto detect sticky elements when selector is given
- Monitor reflow using `ResizeObserver`
- Fix: reduce updates triggered from nested instances
- Fix: incorrect event sequences in `auxclick` and `wheel` handler
- Fix: element should stick to container's right or bottom edge when content is underflow and `within` is not specified

## v1.13.2 / 2024-06-12

- Fix: incorrect sticky position when content updated during scrolling
- Fix: unable to refresh in subsequent `transitionend` or `animationend` events

## v1.13.1 / 2024-06-03

- Fix: scrollbars was not shown after re-enabling (issue introduced in v1.12.3)

## v1.13.0 / 2024-02-21

- Support jQuery 4
- Add `inferWheelX` option to infer horizontal scroll in wheel event
- Fix: scrollbar should be hidden in initial state
- Miscellaneous: expose correct file for unpkg

## v1.12.6 / 2024-01-14

- Fix: update detection for CSS transform for JSDom
- Fix: reattach scrollbars and grows in case being detached

## v1.12.5 / 2023-11-21

- Fix: `scrollBy*` and `scrollTo*` methods should apply to all elements in the jQuery instance

## v1.12.4 / 2023-11-16

- Fix: `scrollMove` should be fired after scroll position updated
- Fix: incorrect or missing `deltaX/Y` reported in `scrollMove` event

## v1.12.3 / 2023-10-13

- Fix: reduce unnecessary refresh and style update

## v1.12.2 / 2023-09-27

- Fix: possible infinite loop if no content element is matched
- Fix: error in `canScrollInnerElement`

## v1.12.1 / 2023-09-07

- Fix: possible error in `hashchange` event

## v1.12.0 / 2023-09-04

- Add the following properties:
  - `scrollTarget`
  - `scrollX`
  - `scrollY`
  - `scrollPercentX`
  - `scrollPercentY`
  - `scrollMaxX`
  - `scrollMaxY`
- Expose scroll information from `scrollBy*` and `scrollTo*` methods
- Allow scroll by clicking mouse wheel
- Allow hooking event through `$.scrollable.hook`
- Rewrite sticky position feature, add `setStickyPosition` method
- Fix: unable to scroll natively outer container by touches
- Fix: remove inferring horizontal scroll with mouse wheel, aligns with native behavior
- Fix: scroll padding calculation
- Fix: should not activate twice on same element
- Fix: ensure matched content element is not nested in another scrollable

## v1.11.4 / 2023-08-24

- Fix: treat area as unscrollable by wheel when content is underflow

## v1.11.3 / 2023-08-14

- Fix: max scroll offset calculation issue when content is hidden

## v1.11.2 / 2023-08-01

- Fix: max scroll offset calculation with border and negative margin

## v1.11.1 / 2023-07-24

- Fix: prevent scroll on mouse and touch events if default is prevented
- Fix: handle native scroll happened between wrapper and content

## v1.11.0 / 2023-07-10

- Support styling by CSS variables
- Allow overriding in-view content area calculation by `scroll-padding` CSS property
- Fix: skip scrolling in `focusin` event when it has been handled by others
- Fix: scrolling by keyboard should act on visible scrollable instances only

## v1.10.2 / 2023-06-26

- Fix: improve interoperability with nested native scrollable area
- Fix: prevent native scrolling upon `hashchange` (content offset by scrollTop/scrollLeft of parent element)

## v1.10.1 / 2023-06-19

- Fix: presence of x-direction in wheel event not detected properly

## v1.10.0 / 2023-06-07

- Lock scrolling element when using mouse wheel, similar to default browser behavior
- Honor `overscroll-behavior: none` on container element

## v1.9.3 / 2023-05-12

- Fix: restore wheel behavior when only x-dir is scrollable

## v1.9.2 / 2023-05-11

- Fix: unable to scroll by mouse wheel if either `hScroll` or `vScroll` is set to `false`
- Fix: unable to drag scrollbar when page is scrolled down due to hit test failure

## v1.9.0 / 2023-03-29

- Add `scrollProgressChange` event
- Fix: dimension calculation issue when container has border
- Fix: should not scroll for wheel event with modified key (Ctrl/Shift/Alt/Meta)

## v1.8.1 / 2022-09-26

- Fix: mouse event being prevented when using pen device

## v1.8.0 / 2022-09-13

- Allow clicking on scrollbar track area to scroll by page
- Fix: missing events when content is scrolled after refresh
- Fix: do not handle mousedown event after touch

## v1.7.3 / 2022-07-25

- Fix: memory leak issue

## v1.7.2 / 2022-07-12

- Fix: `scrollLeft` and `scrollTop` may report incorrect values after refresh

## v1.7.1 / 2022-06-29

- Fix: `scrollMove` event not fired when scroll duration is 0

## v1.7.0 / 2022-06-21

- Add method to directly get scrollable api
- Add key binding for scrolling by keyboard
- Fix: error when content or wrapper size is undefined
- Fix: force page change when calling `scrollByPage`
- Fix: memory leak due to retained jquery object

## v1.6.4 / 2022-06-16

- Fix: should not over scroll when fixing native auto scrolling behavior

## v1.6.3 / 2022-06-01

- Fix: prevent exception when calling method on uninitialized element
- Fix: extra `scrollStart` and `scrollEnd` event fired during momemtum and bouncing phase
- Fix: incorrect `startX` and `startY` reported in scroll events during momemtum and bouncing phase
- Fix: incorrect value reported from `scrollLeft` and `scrollTop` method after scrolling by mouse wheel

## v1.6.2 / 2022-05-19

- Fix: `scrollTop` and `scrollLeft` return `NaN` initially
- Fix: missing `scrollStart` event when scrolled by wheel

## v1.6.1 / 2022-04-10

- Fix: bind simultaneously to mouse and touch events

## v1.6.0 / 2022-03-27

- Add `wheel` option to enable or disable wheel scrolling
- Add `scrollByPage` method
- Fix: use true rounding for position determined when calling `scrollToElement`
- Fix: improve horizontal or vertical wheel scrolling when using touchpad

## v1.5.1 / 2022-03-10

- Fix: scrolling target not updated on DOM mutations
- Fix: incorrect calculation on scroll bar size

## v1.5.0 / 2022-02-18

- All scrolling method now returns promise to indicate when scrolling has ended
- Automatically re-calculate content dimension when DOM has updated
- Automatically re-calculate content dimension at `animationend` and `transitionend` events

## v1.4.5 / 2022-02-17

- Fix: scroll amount by mouse wheel in Firefox

## v1.4.4 / 2022-01-17

- Fix: end-padding calculation

## v1.4.3 / 2022-01-13

- Fix: container become unscrollable due to end-padding calculation
- Fix: scroll animation interrupted by refresh

## v1.4.2 / 2022-01-12

- Umd-ify and prebuild minified version
- TypeScript definitions
- Fix: honor end-padding of parent container
- Fix: `scrollEnd` event not fired when `snapToPage` is on
- Fix: position not normalized after refresh with `updateContent` flag
- Fix: scrollbar styles and insdication CSS classes not updated after refresh

## v1.4.1 / 2022-01-07

- Fix: `pageDirection` detection

## v1.4.0 / 2020-06-29

- Add `setOptions` method
- Add `pageItem`, `snapToPage` and related options
- Fix: scrolling indication CSS class (`options.scrollingClass`) not added when scrolling by mouse wheel

## v1.3.4 / 2020-04-25

- Fix: handling of `wheel` events
- Fix: CSS classes are not propertly updated after refresh
- Fix: scroller remain in incorrect position after content element is changed
- Fix: restore scroll offsets after content element is changed
- Fix: set `touch-action` to `none` for better compability
- Fix: scrollToElement calculation when there is sticky headers
- Fix: scrolling animation does not stopped when `stop()` is called
- Fix: maximum scroll offset calculation

## v1.3.3 / 2019-03-26

- Fix: suppress intervention error in Chrome
- Fix: avoid script scrolling being cancelled by `touchend` event

## v1.3.2 / 2019-01-17

- Fix: horizontal/vertical direction scrolled by API when `hScroll`/`vScroll` is set to `false`
- Fix: sticky header position when container has padding
- Fix: scrollbars re-appear when refreshing a disabled container
- Fix: content dimension calculation
- Fix: allow outer container can be scrolled when content in current container is underflow

## v1.3.1 / 2018-11-23

- Honor `event.defaultPrevented`
- Automatically set overflow to `hidden` if the container is `auto` or `scroll`
- Automatically re-calculate content dimension before scroll starts
- Apply scrollable indicating CSS class during overscroll disregarding whether container is actually scrollable
- Fix: overfiring during wheel event
- Fix: scroll started when user is scrolling inner content
- Fix: error when there is no content element selected

## v1.3.0 / 2018-10-23

- Add sticky header feature
- Methods added: stop, scrollPadding
- Allow propagation of touchstart and mousedown event
- Prevent pull to refresh behavior in mobile
- Prevent native scrolling on focusing input (content offset by scrollTop/scrollLeft of parent element)
- Fix: incorrectly marked current if scrolling is not started
- Fix: error due to destroyed scroll area
- Fix: cater content offset by padding
- Fix: mouse delta locked in one direction in scrollbar mode
- Fix: accumulative error in calculating new X/Y
- Fix: interruption by refresh method during scroll

## v1.2.0 / 2017-09-04

- Add event firing for scrolling by mousewheel or API calling
- Methods added: scrollLeft, scrollTop

## v1.1.0 / 2016-06-30

- Calculate container and content dimension more accurately (avoid rounding error by jQuery API)
- Options added: handle: 'auto'
- Methods added: enable, disable, scrollToElement
- Content element re-selected when calling 'refresh'
- Event 'scrollMove' now also fired when scrolling with mouse wheel
- CSS classes for state indication added to content element even though scrollbars are OFF
- Fix: e.offsetX/Y now report current offset values instead of previous ones
- Fix: Scroll gestures erroneously detected as clicks on touch device
- Fix: Plug-in not property destroyed

## v1.0.0 / 2014-07-23

- JSLint
- Options added: content, cancel, handle, glow, glowClass, glowStyle, hGlow, vGlow, hBounce, vBounce, scrollingClass, touchMove
- More CSS classes for state indication added to container element (whether can scroll up/down/left/right)
- e.percentX/Y now report number ranging from 0 to 100
- Fix: Get outer dimension (includes paddings and borders) for content element
- Fix: Cancel scrolling after mouse pointer leaves and re-enters browser window during scrolling

## v1.0.0-beta / 2014-01-06

Initial release
