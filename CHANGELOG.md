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
