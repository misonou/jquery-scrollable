# Usage

## $.scrollable([options])

Initialize the plugin.

Below is an exhaustive list of options, with the default value shown.

```javascript
{
    // specify which element to be scrolled
    // only the first matched element will be scrolled if multiple elements are matched
    content: '>:visible:eq(0)',

    // an element or a selector to avoid scroll action when mouse or touch acting on these target
    // this option is only checked when 'handle' is set to 'auto', 'content' or 'both'
    cancel: '',

    // specify the function to calculate the dimension of the container
    // the function should return an object of with 'width' and 'height' properties
    getWrapperDimension: getDimension,

    // specify the function to calculate the dimension of the content
    // the function should return an object of with 'width' and 'height' properties
    getContentDimension: getOuterDimension,

    // specify which component to be responsible for listening mouse or touch event to start scroll action
    // possible values are 'auto', 'scrollbar', 'content', 'both'
    // an 'auto' value will let the plugin to choose between 'scrollbar' or 'content'
    // based on the existence of touch events
    handle: 'auto',

    // whether scrolling by mouse wheel event is enabled
    wheel: true,

    // whether horizontal scrolling is allowed when the width of content is larger than that of container
    hScroll: true,

    // whether vertical scrolling is allowed when the height of content is larger than that of container
    vScroll: true,

    // whether to show glowing effect when scrolling horizontally to the end
    hGlow: false,

    // whether to show glowing effect when scrolling vertically to the end
    vGlow: false,

    // whether to allow drag content beyond the edge when scrolling to the end
    // and bounce back when mouse or touch is released
    bounce: true,

    // same as above but only activate on horizontal direction
    hBounce: true,

    // same as above but only activate on vertical direction
    vBounce: true,

    // duration in milliseconds for the content to be bounced back
    bounceDuration: 200,

    // whether to allow the content to continue scrolling when mouse or touch is released
    momentum: true,

    // whether the lock the scrolling direction to horizontal or vertical
    // when scrolling in both direction is possible
    lockDirection: true,

    // CSS class applied to the container when scrolling is in action
    scrollingClass: 'scrolling',

    // CSS class applied to the container when horizontal scrolling is possible
    scrollableXClass: 'scrollable-x',

    // CSS class applied to the container when vertical scrolling is possible
    scrollableYClass: 'scrollable-y',

    // specify the function to create the scrollbar elements
    scrollbar: createScrollbar,

    // CSS class applied to the scrollbar elements
    scrollbarClass: '',

    // specify the distance of the scrollbar in pixels to the edge of the container
    // if negative number is supplied, the scrollbar will be placed at the distance outside the container
    scrollbarInset: 3,

    // specify the width of the scrollbar in pixels
    scrollbarSize: 5,

    // CSS styles applied to the scrollbar element
    scrollbarStyle: {
        backgroundColor: 'black',
        opacity: 0.7
    },

    // CSS styles applied to the scrollbar track element
    scrollbarTrackStyle: {},

    // specify the function to create the element responsible for glowing effect
    glow: createGlow,

    // CSS class applied to the glowing effect element
    glowClass: '',

    // CSS styles applied to the glowing effect element
    glowStyle: {},

    // CSS selector specifying pages of scrolled content
    // this will enable `pageItem` and `pageIndex` properties during scrollMove event
    pageItem: '',

    // specify how a page is aligned when the page size is smaller the container size
    // possible values are 'center', 'left', 'top', 'bottom', and 'right'
    pageItemAlign: 'center',

    // specify content is paged horizontally or vertically
    // possible values are 'auto', 'x', and 'y'
    pageDirection: 'auto',

    // specify whether it should align page to the container (i.e. never cross-page)
    snapToPage: false,
    
    // CSS selector specifying sections of content of which sticky header will be shown for
    sticky: '',

    // CSS selector specifying which element to be cloned
    // and be placed at the top or bottom of scrolling area
    stickyHandle: '',

    // specify sticky header mode
    stickyToBottom: false,

    // CSS class applied to the cloned sticky handle
    stickyClass: 'sticky',

    // specify an event listener for the touchMove event
    touchMove: null,

    // specify an event listener for the scrollStart event
    scrollStart: null,

    // specify an event listener for the scrollMove event
    scrollMove: null,

    // specify an event listener for the scrollStop event
    scrollStop: null,

    // specify an event listener for the scrollEnd event
    scrollEnd: null,

    // specify an event listener for the scrollProgressChange event
    scrollProgressChange: null
}
```

## Styling scrollbar

Since `v1.11.0`, scrollbar can be styled by the following CSS variables

- `--jqs-scrollbar-inset`
- `--jqs-scrollbar-size`
- `--jqs-scrollbar-color`
- `--jqs-scrollbar-radius`
- `--jqs-scrollbar-opacity`

The corresponding `scrollbarInset`, `scrollbarSize` and `scrollbarStyle` (`backgroundColor`, `borderRadius`, `opacity`) options,
when specified, will override values from CSS variables.

## Methods

All methods are called by jQuery plugin convention.

### setOptions

```javascript
$elm.scrollable('setOptions', options)
```

Update options for a particular scoller.


### scrollTo

```javascript
$elm.scrollable('scrollTo', x, y, duration, callback)
```

Scroll the content element to the specified offset in each direction in pixels.

If duration in milliseconds is supplied, the scrolling will be animated in such duration of time and
the optional callback will be fired after the animation is complete.

### scrollToPage

```javascript
$elm.scrollable('scrollToPage', x, y, duration, callback)
```

Scroll the content element to the specified page (zero-based index) in each direction.

If duration in milliseconds is supplied, the scrolling will be animated in such duration of time and
the optional callback will be fired after the animation is complete.

### scrollToElement

```javascript
$elm.scrollable('scrollToElement', target, targetOrigin, wrapperOrigin, duration, callback)
```

Scroll the content element to the anchor point calculated from the mentioned element.

If the `targetOrigin` parameter is not specified, the anchor point will be chosen as the
top left corner of the mentioned element.

If the `wrapperOrigin` parameter is not specified, the content element will be scrolled such that
the anchor point calculated is located as the specified origin of the container element.

Both `targetOrigin` and `wrapperOrigin` parameter supports the keywords `left`, `right`, `top`, `bottom`, `center`
and optionally an additional offset in pixels or percentage. Note that horizontal origin must comes before vertical origin.

```
left top
left+10% top-10%
left+10px top-10px
```

If duration in milliseconds is supplied, the scrolling will be animated in such duration of time and
the optional callback will be fired after the animation is complete.

### scrollBy

```javascript
$elm.scrollable('scrollBy', dx, dy, duration, callback)
```

Scroll the content element by the specified amount in each direction in pixels.

If duration in milliseconds is supplied, the scrolling will be animated in such duration of time and
the optional callback will be fired after the animation is complete.

### scrollByPage

```javascript
$elm.scrollable('scrollByPage', x, y, duration, callback)
```

Scroll the content element by specified number of pages in each direction.

If duration in milliseconds is supplied, the scrolling will be animated in such duration of time and
the optional callback will be fired after the animation is complete.

### stop

```javascript
$elm.scrollable('stop')
```

Stop animated scrolling immediately. Content will be at the position when `stop` is called.

Animated scrolling occured when the `scrollTo`, `scrollToElement`, `scrollToPage` or `scrollBy` with a non-zero duration;
or if the `momentum` option is set to `true` and the scrolling area is in momentum mode after mouse or touch is released.

### refresh

```javascript
$elm.scrollable('refresh')
```

Force the plugin to re-select the content area to be scrolled and to re-calculate the dimensions
of both container and content element.

### enable

```javascript
$elm.scrollable('enable')
```

Re-enable the plugin on selected element which has been disabled before.

### disable

```javascript
$elm.scrollable('disable')
```

Temporarily disable the plugin on selected element. Scrollbars will be hidden and no scolling will be triggered by
mouse or touch events. However, content element can still be scrolled using plugin's methods.

### scrollPadding

```javascript
$elm.scrollable('scrollPadding')
```

Returns the padding around scrolling area of which content may be obstructed by sticky headers and scrollbars.

### destroy

```javascript
$elm.scrollable('destroy')
```

Permenantly disable the plugin on selected element. Any created element and attached event listeners will be removed. The
content element will also be reset, i.e. having no scroll offset.

## Events

For `touchMove` and `scrollMove` event, the following properties are available on the first argument.

- `startX`: horizontal position when the scrolling is started
- `startY`: vertical position when the scrolling is started
- `offsetX`: current horizontal position
- `offsetY`: current vertical position
- `percentX`: current horizontal position in percentage to the content width
- `percentY`: current vertical position in percentage to the content height
- `deltaX`: different of horizontal position between this and the last `touchMove` or `scrollMove` event
- `deltaY`: different of vertical position between this and the last `touchMove` or `scrollMove` event
- `pageIndex`: current index if paging is turned on by `pageItem` option
- `pageItem`: current element if paging is turned on by `pageItem` option

Starting from `v1.12.0`, events can be listened by global hooks via

```javascript
$.scrollable.hook({
    scrollStart: function (e) {
    },
    // ...
});
```

### touchMove

Fired when a mouse or touch move event is triggered on the content element but not necessarily starts a scrolling action.

### scrollStart

Fired when scrolling is started.

### scrollMove

Fired when a mouse or touch move event is triggered on the content element and scrolling is triggered.

### scrollStop

Fired when active scrolling by mouse or touch move is stopped, but the content may still be scrolling if
the `momentum` or `bounce` option is on.

### scrollEnd

Fired when the scrolling action is complete. The content element has now stayed in the final position.

### scrollProgressChange

Fired when the percentage of how far content has been scrolled changed, either due to scrolling, change of content, or change of container's dimensions.

# License

The MIT License (MIT)

Copyright (c) 2016 misonou

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
