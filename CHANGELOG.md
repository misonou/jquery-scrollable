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
