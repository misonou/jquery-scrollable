const $ = require('jquery');

(function () {
    const zeroMomentum = {
        dist: 0,
        time: 0
    };
    const zeroSize = {
        width: 0,
        height: 0
    };
    const zeroOrigin = {
        percentX: 0,
        percentY: 0,
        offsetX: 0,
        offsetY: 0
    };
    const zeroOffset = {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    };
    const originKeyword = {
        center: 0.5,
        right: 1,
        bottom: 1
    };
    const pMargin = [
        'marginTop',
        'marginRight',
        'marginBottom',
        'marginLeft'
    ];
    const pPadding = [
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft'
    ];
    const pBorder = [
        'borderTopWidth',
        'borderRightWidth',
        'borderBottomWidth',
        'borderLeftWidth'
    ];
    const pScrollPadding = [
        'scrollPaddingTop',
        'scrollPaddingRight',
        'scrollPaddingBottom',
        'scrollPaddingLeft'
    ];
    const mround = function (r) {
        return r >> 0;
    };
    const array = Array.prototype;
    const m = Math;

    const vendor = /webkit/i.test(navigator.appVersion) ? 'webkit' : /firefox/i.test(navigator.userAgent) ? 'Moz' : /trident/i.test(navigator.userAgent) ? 'ms' : window.opera ? 'O' : '';

    // browser capabilities
    const isAndroid = /android/gi.test(navigator.appVersion);

    const DOMMatrix = window.DOMMatrix || window.WebKitCSSMatrix || window.MSCSSMatrix;
    const root = document.documentElement;
    const hasTransform3d = DOMMatrix && (new DOMMatrix()).m11 !== undefined;
    const hasTransform = hasTransform3d || root.style[vendor + 'Transform'] !== undefined;

    // value helpers
    const trnOpen = 'translate' + (hasTransform3d ? '3d(' : '(');
    const trnClose = hasTransform3d ? ',0)' : ')';
    const translate = function (x, y) {
        return trnOpen + x + ',' + y + trnClose;
    };
    const pc = function (v) {
        return (v || 0).toFixed(5) + '%';
    };
    const px = function (v) {
        return (v || 0) + 'px';
    };
    const cssvar = isCSSVarSupported() ? function (varname, value) {
        return 'var(--jqs-' + varname + ', ' + value + ')';
    } : function (_, value) {
        return value;
    };
    const coalesce = function (v, def) {
        return v === undefined ? def : v;
    };

    // events
    const EV_RESIZE = 'orientationchange resize';
    const EV_WHEEL = 'onwheel' in window ? 'wheel' : vendor === 'Moz' ? 'DOMMouseScroll' : 'mousewheel';

    const nextFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
        return setTimeout(callback, 0);
    };

    const cancelFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || clearTimeout;

    // blocking layer to prevent click event after scrolling
    const $blockLayer = $('<div style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:white;opacity:0;filter:alpha(opacity=0);"></div>');
    const $originDiv = $('<div style="position:fixed;top:0;left:0;">')[0];
    const activated = new Map();
    const stickyParents = new WeakMap();
    const hooks = [];
    const DATA_ID = 'xScrollable';

    var $current;
    var wheelLock;
    var muteMutations;

    function isCSSVarSupported() {
        return window.CSS && CSS.supports('color', 'var(--primary)');
    }

    function parseOrigin(value) {
        if (/(left|center|right)?(?:((?:^|\s|[+-]?)\d+(?:\.\d+)?)(px|%))?(?:\s+(top|center|bottom)?(?:((?:^|\s|[+-]?)\d+(?:\.\d+)?)(px|%))?)?/g.test(value)) {
            return {
                percentX: (originKeyword[RegExp.$1] || 0) + (RegExp.$3 === '%' && +RegExp.$2),
                percentY: (originKeyword[RegExp.$4 || (!RegExp.$5 && RegExp.$1)] || 0) + (RegExp.$6 === '%' && +RegExp.$5),
                offsetX: +(RegExp.$3 === 'px' && +RegExp.$2),
                offsetY: +(RegExp.$6 === 'px' && +RegExp.$5)
            };
        }
        return zeroOrigin;
    }

    function createScrollbar($elm, dir, options) {
        var $track = $('<div style="position:absolute;font-size:0;z-index:1;"><div style="position:absolute;"></div></div>').appendTo($elm);
        var $scrollbar = $track.children().eq(0);

        $track.css(options.scrollbarTrackStyle);
        $track.css(dir === 'x' ? 'left' : 'top', options.scrollbarTrackStyle[dir === 'x' ? 'right' : 'bottom']);
        $scrollbar.css(options.scrollbarStyle);
        if (options.scrollbarClass) {
            $track.addClass(options.scrollbarClass + ' ' + options.scrollbarClass + '-' + dir);
        }
        return $scrollbar;
    }

    function createGlow($elm, dir, options) {
        var $track = $('<div style="position:absolute;pointer-events:none;font-size:0;z-index:1;"><div style="position:absolute;"></div></div>').appendTo($elm);
        var $scrollbar = $track.children().eq(0);

        $track.css(dir === 'x' ? 'height' : 'width', '100%');
        $track.css(options.glowStyle);
        $scrollbar.css(dir === 'x' ? 'height' : 'width', '100%');
        if (options.glowClass) {
            $track.addClass(options.glowClass + ' ' + options.glowClass + '-' + dir);
        }
        return $scrollbar;
    }

    function getEventPosition(e) {
        var point = (e.originalEvent.touches || [e])[0];
        return {
            x: point.clientX,
            y: point.clientY
        };
    }

    function Rect(l, t, r, b) {
        var self = this;
        self.left = l;
        self.top = t;
        self.right = r;
        self.bottom = b;
        self.width = self.right - self.left;
        self.height = self.bottom - self.top;
    }

    function toPlainRect(l, t, r, b) {
        function clip(v) {
            // IE provides precision up to 0.05 but with floating point errors that hinder comparisons
            return mround(v * 1000) / 1000;
        }
        if (l.top !== undefined) {
            return new Rect(clip(l.left), clip(l.top), clip(l.right), clip(l.bottom));
        }
        if (r === undefined) {
            return new Rect(l, t, l, t);
        }
        return new Rect(l, t, r, b);
    }

    function getRect(elm) {
        var rect;
        if (elm === root || elm === window) {
            if (!document.body.contains($originDiv[0])) {
                document.body.appendChild($originDiv[0]);
            }
            // origin used by CSS, DOMRect and properties like clientX/Y may move away from the top-left corner of the window
            // when virtual keyboard is shown on mobile devices
            var o = getRect($originDiv[0]);
            rect = toPlainRect(0, 0, root.offsetWidth, root.offsetHeight).translate(o.left, o.top);
        } else if (!root.contains(elm)) {
            // IE10 throws Unspecified Error for detached elements
            rect = toPlainRect(0, 0, 0, 0);
        } else {
            rect = toPlainRect(elm.getBoundingClientRect());
        }
        return rect;
    }

    function rectIntersects(a, b) {
        return !(b.right < a.left || b.left > a.right) && !(b.bottom < a.top || b.top > a.bottom);
    }

    function getDimension($elm) {
        if ($elm[0]) {
            var style = getComputedStyle($elm[0]);
            var rect = getRect($elm[0]);
            return {
                width: (rect.right - rect.left) - (parseFloat(style[pPadding[1]]) + parseFloat(style[pPadding[3]]) + parseFloat(style[pBorder[1]]) + parseFloat(style[pBorder[3]])),
                height: (rect.bottom - rect.top) - (parseFloat(style[pPadding[0]]) + parseFloat(style[pPadding[2]]) + parseFloat(style[pBorder[0]]) + parseFloat(style[pBorder[2]]))
            };
        }
    }

    function getOuterDimension($elm) {
        if ($elm[0]) {
            var rect = getRect($elm[0]);
            return {
                width: rect.width,
                height: rect.height
            };
        }
    }

    function getHit($elm, margin, point, isDirY) {
        var r0 = getRect($elm[0]);
        var hitX = point.x + margin >= r0.left && point.x - margin <= r0.right;
        var hitY = point.y + margin >= r0.top && point.y - margin <= r0.bottom;
        if (hitX && hitY) {
            return 2;
        }
        var r1 = getRect($elm.parent()[0]);
        if (isDirY) {
            if (hitX && point.y >= r1.top && point.y <= r1.bottom) {
                return point.y > r0.bottom ? 1 : -1;
            }
        } else {
            if (hitY && point.x >= r1.left && point.x <= r1.right) {
                return point.x > r0.right ? 1 : -1;
            }
        }
    }

    function calculateMomentum(signSpeed, maxDist, overshoot) {
        if (!signSpeed) {
            return zeroMomentum;
        }
        var deceleration = 0.0006;
        var speed = m.abs(signSpeed);
        var newDist = (speed * speed) / (2 * deceleration);

        // Proportinally reduce speed if we are outside of the boundaries
        if (newDist > maxDist) {
            maxDist += overshoot / (6 / (newDist / speed * deceleration));
            speed = speed * maxDist / newDist;
            newDist = maxDist;
        }
        return {
            dist: newDist * (signSpeed < 0 ? -1 : 1),
            time: m.max(10, mround(speed / deceleration))
        };
    }

    function isPageScrollable() {
        if (getComputedStyle(root).overflow === 'hidden') {
            return false;
        }
        if (window.scrollX || window.scrollY) {
            return true;
        }
        window.scrollTo(1, 1);
        var result = mround(window.scrollX) || mround(window.scrollY);
        window.scrollTo(0, 0);
        return result;
    }

    function getAnchorElement() {
        if (document.activeElement !== document.body) {
            return document.activeElement;
        }
        var selection = window.getSelection();
        var range = selection && selection.type === 'Range' && selection.getRangeAt(0);
        return range && range.commonAncestorContainer;
    }

    function canScrollInnerElement(cur, parent) {
        var clampX, clampY;
        if ($.contains(parent, cur)) {
            for (; cur !== parent; cur = cur.parentNode) {
                var style = getComputedStyle(cur);
                clampY = clampY || (cur.scrollHeight > cur.offsetHeight && (style.overflowY === 'auto' || style.overflowY === 'scroll'));
                clampX = clampX || (cur.scrollWidth > cur.offsetWidth && (style.overflowX === 'auto' || style.overflowX === 'scroll'));
            }
        }
        return (clampX || clampY) && {
            x: clampX,
            y: clampY
        };
    }

    function getParentWrapper(cur) {
        for (; (cur = cur.parentNode) && !activated.has(cur););
        return cur;
    }

    function getActivatedWrappers() {
        var elements = [];
        activated.forEach(function (v, i) {
            elements.push(i);
        });
        return elements;
    }

    function flushChanges(mute) {
        muteMutations = mute;
        activated.forEach(function (v) {
            v();
        });
        muteMutations = false;
    }

    $.fn.scrollable = function (optionOverrides) {
        if (typeof optionOverrides === 'string') {
            var args = arguments;
            var returnValue;
            this.each(function () {
                var obj = $.data(this, DATA_ID);
                var value;
                if (!obj) {
                    console.warn('Scrollable ' + optionOverrides + ' should not be called before initialization');
                    switch (optionOverrides) {
                        case 'scrollLeft':
                        case 'scrollTop':
                            value = 0;
                            break;
                        case 'scrollPadding':
                            value = { top: 0, left: 0, right: 0, bottom: 0 };
                            break;
                        case 'scrollBy':
                        case 'scrollTo':
                        case 'scrollByPage':
                        case 'scrollToPage':
                        case 'scrollToElement':
                            value = Promise.resolve();
                            break;
                    }
                } else {
                    value = obj[optionOverrides];
                    if (typeof value === 'function') {
                        value = value.apply(null, [].slice.call(args, 1));
                    }
                }
                if (value !== undefined) {
                    returnValue = returnValue || value;
                    return value instanceof Promise;
                }
            });
            if (returnValue !== undefined) {
                return returnValue;
            }
            return this;
        }

        var batchOptions = {
            content: '>*',
            cancel: '',
            getWrapperDimension: getDimension,
            getContentDimension: getOuterDimension,
            handle: 'auto',
            wheel: true,
            inferWheelX: false,
            hScroll: true,
            vScroll: true,
            hGlow: false,
            vGlow: false,
            bounce: true,
            hBounce: true,
            vBounce: true,
            bounceDuration: 200,
            momentum: true,
            lockDirection: true,
            scrollingClass: 'scrolling',
            scrollableXClass: 'scrollable-x',
            scrollableYClass: 'scrollable-y',
            scrollbar: createScrollbar,
            scrollbarClass: '',
            scrollbarInset: 3,
            scrollbarSize: 5,
            scrollbarStyle: {},
            scrollbarTrackStyle: {},
            glow: createGlow,
            glowClass: '',
            glowStyle: {},
            pageItem: '',
            pageItemAlign: 'center',
            pageDirection: 'auto',
            snapToPage: false,
            sticky: '',
            stickyHandle: '',
            stickyToBottom: false,
            stickyClass: 'sticky',
            touchMove: null,
            scrollStart: null,
            scrollMove: null,
            scrollStop: null,
            scrollEnd: null,
            scrollProgressChange: null
        };
        $.extend(batchOptions, optionOverrides);

        // normalize options
        var cssInset = optionOverrides.scrollbarInset !== undefined ? px(optionOverrides.scrollbarInset) : cssvar('scrollbar-inset', '3px');
        var cssSize = optionOverrides.scrollbarSize !== undefined ? px(optionOverrides.scrollbarSize) : cssvar('scrollbar-size', '5px');
        var cssInsetXY = 'calc(' + cssSize + ' + ' + cssInset + ' * 2)';
        var scrollbarStyle = batchOptions.scrollbarStyle;
        var scrollbarTrackStyle = batchOptions.scrollbarTrackStyle;

        $.extend(scrollbarTrackStyle, {
            bottom: cssInset,
            right: cssInset
        });
        $.extend(scrollbarStyle, {
            backgroundColor: coalesce(scrollbarStyle.backgroundColor, cssvar('scrollbar-color', 'black')),
            borderRadius: coalesce(scrollbarStyle.borderRadius, cssvar('scrollbar-radius', 0)),
            opacity: coalesce(scrollbarStyle.opacity, cssvar('scrollbar-opacity', 0.7)),
            bottom: 0,
            right: 0,
            minWidth: cssSize,
            minHeight: cssSize
        });
        batchOptions.hBounce = batchOptions.bounce && batchOptions.hBounce;
        batchOptions.vBounce = batchOptions.bounce && batchOptions.vBounce;

        return this.each(function () {
            var options = $.extend(true, {}, batchOptions);
            var $wrapper = $(this);
            var $content = $();
            var $pageItems = $();
            var $middle = $();
            var $hScrollbar = !!(options.scrollbar && options.hScroll) && $(options.scrollbar($wrapper, 'x', options)).hide();
            var $vScrollbar = !!(options.scrollbar && options.vScroll) && $(options.scrollbar($wrapper, 'y', options)).hide();
            var $hGlow = !!(options.glow && options.hGlow) && $(options.glow($wrapper, 'x', options)).hide();
            var $vGlow = !!(options.glow && options.vGlow) && $(options.glow($wrapper, 'y', options)).hide();
            var $scrollbars = $wrapper.find([$hScrollbar[0], $vScrollbar[0], $hGlow[0], $vGlow[0]]).parent();
            var enabled = true;
            var x = 0;
            var y = 0;
            var leadingX = 0;
            var leadingY = 0;
            var stopX = 0;
            var stopY = 0;
            var pendingX = 0;
            var pendingY = 0;
            var minX;
            var minY;
            var pageDirection;
            var contentSize = zeroSize;
            var wrapperSize = zeroSize;
            var scrollbarSize;
            var lastTouch;
            var stickyConfig = new Map();
            var stickyElements = new Map();
            var stickyRect;
            var refreshTimeout;
            var mutationObserver;
            var resizeObserver;
            var mediaElements;
            var cancelScroll;
            var cancelAnim;
            var updateContentOnRefresh;
            var eventTrigger;
            var eventState;
            var wheelState;
            var keyState;

            if (activated.has(this)) {
                throw new Error('Scrollable already activated');
            }
            activated.set(this, function () {
                return mutationObserver && mutationObserver.takeRecords();
            });

            function getPageIndex(offset) {
                var props = pageDirection === 'x' ? ['left', 'right', 'width'] : ['top', 'bottom', 'height'];
                var count = $pageItems.length;
                var rect = getRect($wrapper[0]);
                rect[props[0]] -= offset || 0;
                rect[props[1]] -= offset || 0;

                var alignFn = function (i, rect) {
                    return (rect[props[0]] * ((count - i) / count) + rect[props[1]] * (i / count));
                };
                var center = (rect[props[0]] + rect[props[1]]) / 2;
                var dist = Infinity;
                var newIndex;
                $pageItems.each(function (i, v) {
                    var r = getRect(v);
                    if ((r[props[2]] | 0) > (rect[props[2]] | 0)) {
                        if ((r[props[0]] < center && r[props[1]] > rect[props[1]]) || (r[props[0]] < 0 && r[props[1]] > center)) {
                            dist = 0;
                            newIndex = i;
                        }
                    }
                    var d = m.abs(alignFn(i, r) - alignFn(i, rect));
                    if (d < dist) {
                        dist = d;
                        newIndex = i;
                    }
                });
                return newIndex;
            }

            function getScrollPadding(target) {
                var style = getComputedStyle($wrapper[0]);
                var getValue = function (prop) {
                    return style[prop] === 'auto' || !style[prop] ? undefined : parseFloat(style[prop]);
                };
                var top = getValue(pScrollPadding[0]);
                var left = getValue(pScrollPadding[3]);
                var right = getValue(pScrollPadding[1]);
                var bottom = getValue(pScrollPadding[2]);
                var stickyPadding = $.extend({}, zeroOffset);
                var targetRect = target && getRect(target);
                stickyElements.forEach(function (state) {
                    if (state.fixed || (targetRect && state.within && rectIntersects(targetRect, state.rect))) {
                        if (state.dirX) {
                            stickyPadding[state.dirX] = m.max(stickyPadding[state.dirX], state.padX);
                        }
                        if (state.dirY) {
                            stickyPadding[state.dirY] = m.max(stickyPadding[state.dirY], state.padY);
                        }
                    }
                });
                return {
                    top: getValue(pBorder[0]) + (top !== undefined ? top : stickyPadding.top + leadingY + (leadingY && getValue(pPadding[0]))),
                    left: getValue(pBorder[3]) + (left !== undefined ? left : stickyPadding.left + leadingX + (leadingX && getValue(pPadding[3]))),
                    right: getValue(pBorder[1]) + (right !== undefined ? right : m.max(stickyPadding.right, $vScrollbar && minY ? $vScrollbar.width() + parseFloat($vScrollbar.parent().css('right')) * 2 : 0)),
                    bottom: getValue(pBorder[2]) + (bottom !== undefined ? bottom : m.max(stickyPadding.bottom, $hScrollbar && minX ? $hScrollbar.height() + parseFloat($hScrollbar.parent().css('bottom')) * 2 : 0))
                };
            }

            function getScrollState(startX, startY, newX, newY, deltaX, deltaY) {
                var pageIndex = options.pageItem ? getPageIndex() : -1;
                var curX = newX === undefined ? x : newX;
                var curY = newY === undefined ? y : newY;
                return {
                    trigger: eventTrigger || 'script',
                    startX: -startX,
                    startY: -startY,
                    offsetX: -curX,
                    offsetY: -curY,
                    deltaX: -deltaX || 0,
                    deltaY: -deltaY || 0,
                    percentX: minX ? (curX / minX) * 100 : 100,
                    percentY: minY ? (curY / minY) * 100 : 100,
                    pageIndex: pageIndex,
                    pageItem: $pageItems[pageIndex] || null
                };
            }

            function getResolvePromise() {
                return $.extend(Promise.resolve(), getScrollState(x, y));
            }

            function fireEvent(type, startX, startY, newX, newY, deltaX, deltaY) {
                var args = getScrollState(startX, startY, newX, newY, deltaX, deltaY);
                args.type = type;
                if (typeof options[type] === 'function') {
                    options[type].call($wrapper[0], args);
                }
                hooks.forEach(function (v) {
                    if (typeof v[type] === 'function') {
                        v[type].call($wrapper[0], args);
                    }
                });
                switch (type) {
                    case 'scrollStart':
                        eventState = {
                            startX: startX,
                            startY: startY,
                            flag: 1
                        };
                        updateStickyPositions(true);
                        break;
                    case 'scrollMove':
                        fireEvent('scrollProgressChange', startX, startY, newX, newY, deltaX, deltaY);
                        break;
                    case 'scrollStop':
                        eventState.flag |= 2;
                        break;
                    case 'scrollEnd':
                        eventState = null;
                        stickyRect = null;
                        updateStickyPositions();
                        break;
                }
            }

            function normalizePosition(newX, newY, forcePageChange) {
                var normalizeInternal = function (newX, newY) {
                    return {
                        x: (newX > 0 ? 0 : newX < minX ? minX : mround(newX)),
                        y: (newY > 0 ? 0 : newY < minY ? minY : mround(newY))
                    };
                };
                var newPos = normalizeInternal(newX, newY);
                if (options.pageItem && options.snapToPage) {
                    var align = options.pageItemAlign;
                    var dir = pageDirection;
                    var props = dir === 'x' ? ['left', 'right', 'width'] : ['top', 'bottom', 'height'];
                    var oldPos = {
                        x: x,
                        y: y
                    };
                    if (newPos[dir] !== oldPos[dir]) {
                        var itemCount = $pageItems.length;
                        var curIndex = getPageIndex();
                        var newIndex = getPageIndex(newPos[dir] - oldPos[dir]);
                        var r0 = getRect($wrapper[0]);
                        var r1;
                        if (forcePageChange && newIndex === curIndex && (newPos[dir] < oldPos[dir] ? curIndex < itemCount - 1 : curIndex > 0)) {
                            r1 = getRect($pageItems[curIndex]);
                            if (r1[props[2]] < r0[props[2]] || (newPos[dir] < oldPos[dir] ? mround(r1[props[1]]) <= r0[props[1]] : m.ceil(r1[props[0]]) >= r0[props[0]])) {
                                newIndex += newPos[dir] < oldPos[dir] ? 1 : -1;
                            }
                        }
                        r1 = getRect($pageItems[newIndex]);

                        var alignProp = props[2];
                        if (r1[props[2]] > r0[props[2]]) {
                            alignProp = (newPos[dir] < oldPos[dir]) ^ (curIndex === newIndex) ? props[0] : props[1];
                        } else if (align === props[0] || align === props[1]) {
                            alignProp = align;
                        }
                        var snapPos;
                        var snapped;
                        switch (alignProp) {
                            case props[0]:
                                snapPos = r1[props[0]];
                                break;
                            case props[1]:
                                snapPos = r1[props[1]] - r0[props[2]];
                                break;
                            default:
                                snapPos = (r1[props[0]] + r1[props[1]] - r0[props[2]]) / 2;
                                break;
                        }
                        snapPos = mround(oldPos[dir] + r0[props[0]] - snapPos);
                        if (newIndex === curIndex) {
                            newPos[dir] = m[newPos[dir] < oldPos[dir] ? 'max' : 'min'](snapPos, newPos[dir]);
                            snapped = newPos[dir] === snapPos;
                        } else {
                            newPos[dir] = snapPos;
                            snapped = true;
                        }
                        newPos = normalizeInternal(newPos.x, newPos.y);
                        newPos.pageChanged = snapped;
                    }
                }
                return newPos;
            }

            function setGlow(pressureX, pressureY) {
                if ($hGlow) {
                    if (pressureX > 0) {
                        $hGlow.css({
                            width: pc(pressureX)
                        }).fadeIn().parent().css({
                            left: 0,
                            right: 'auto'
                        });
                    } else if (pressureX < 0) {
                        $hGlow.css({
                            width: pc(-pressureX)
                        }).fadeIn().parent().css({
                            left: 'auto',
                            right: 0
                        });
                    } else {
                        $hGlow.css({
                            width: 0
                        }).fadeOut();
                    }
                    $hGlow.parent().toggleClass(options.glowClass + '-x-l', pressureX > 0);
                    $hGlow.parent().toggleClass(options.glowClass + '-x-r', pressureX < 0);
                }
                if ($vGlow) {
                    if (pressureY > 0) {
                        $vGlow.css({
                            height: pc(pressureY)
                        }).fadeIn().parent().css({
                            top: 0,
                            bottom: 'auto'
                        });
                    } else if (pressureY < 0) {
                        $vGlow.css({
                            height: pc(-pressureY)
                        }).fadeIn().parent().css({
                            top: 'auto',
                            bottom: 0
                        });
                    } else {
                        $vGlow.css({
                            height: 0
                        }).fadeOut();
                    }
                    $vGlow.parent().toggleClass(options.glowClass + '-y-u', pressureY > 0);
                    $vGlow.parent().toggleClass(options.glowClass + '-y-d', pressureY < 0);
                }
            }

            function removeStickyElement(element) {
                if (stickyParents.get(element) === $wrapper[0]) {
                    stickyParents.delete(element);
                    $(element).removeClass(options.stickyClass).css('transform', '');
                }
                stickyElements.delete(element);
            }

            function setStickyElement(element, config) {
                if (!config.dirX && !config.dirY) {
                    removeStickyElement(element);
                } else {
                    if (typeof config.within === 'string') {
                        config = $.extend({}, config);
                        config.within = getRect.bind(0, $(element).closest(config.within)[0]);
                    }
                    var parent = stickyParents.get(element);
                    if (!parent || parent === $wrapper[0] || $.contains(parent, $wrapper[0])) {
                        stickyParents.set(element, $wrapper[0]);
                    }
                    stickyElements.set(element, config);
                }
            }

            function updateStickyPositions(beforeScrollStart) {
                var r0 = stickyRect, r1;
                stickyElements.forEach(function (state, element) {
                    if (stickyParents.get(element) !== $wrapper[0]) {
                        return;
                    }
                    if (!r0) {
                        var style = getComputedStyle($wrapper[0]);
                        r0 = getRect($wrapper[0]);
                        r1 = getRect($content[0]);
                        r0 = {
                            top: r0.top + parseFloat(style[pBorder[0]]) + leadingY + (leadingY && parseFloat(style[pPadding[0]])),
                            left: r0.left + parseFloat(style[pBorder[3]]) + leadingX + (leadingX && parseFloat(style[pPadding[3]])),
                            right: r0.right - parseFloat(style[pBorder[1]]),
                            bottom: r0.bottom - parseFloat(style[pBorder[2]]),
                            startX: x,
                            startY: y
                        };
                    }
                    var dirX = state.dirX || 0;
                    var dirY = state.dirY || 0;
                    var signX = dirX === 'right' ? -1 : 1;
                    var signY = dirY === 'bottom' ? -1 : 1;
                    if (!stickyRect) {
                        var r2 = getRect(element);
                        var r3 = state.within ? state.within() : r1;
                        var tm = state.fixed ? 0 : new DOMMatrix(element.style.transform);
                        var style = getComputedStyle(element);
                        $.extend(state, {
                            offsetX: dirX && r0[dirX] - r3[dirX],
                            offsetY: dirY && r0[dirY] - r3[dirY],
                            deltaX: dirX && tm && (r2[dirX] - r3[dirX] - tm.e),
                            deltaY: dirY && tm && (r2[dirY] - r3[dirY] - tm.f),
                            maxX: (r3.width - r2.width) * signX,
                            maxY: (r3.height - r2.height) * signY,
                            padX: dirX && (r2[dirX] * signX - r0[dirX] * signX + r2.width + parseFloat(style[pMargin[dirX > 0 ? 3 : 1]])),
                            padY: dirY && (r2[dirY] * signY - r0[dirY] * signY + r2.height + parseFloat(style[pMargin[dirY > 0 ? 0 : 2]])),
                            rect: r3
                        });
                    }
                    var offsetX = dirX && m[signX < 0 ? 'max' : 'min'](state.offsetX - (x - r0.startX) - state.deltaX, state.maxX) | 0;
                    var offsetY = dirY && m[signY < 0 ? 'max' : 'min'](state.offsetY - (y - r0.startY) - state.deltaY, state.maxY) | 0;
                    if (state.fixed || state.within) {
                        offsetX = offsetX * signX < 0 ? 0 : offsetX;
                        offsetY = offsetY * signY < 0 ? 0 : offsetY;
                    }
                    var sticky = !!offsetX || !!offsetY;
                    $(element).toggleClass(options.stickyClass, sticky).css('transform', sticky ? translate(px(offsetX), px(offsetY)) : '');
                });
                if (beforeScrollStart) {
                    stickyRect = r0;
                }
            }

            function toggleScrollbars() {
                if ($hScrollbar) {
                    $hScrollbar.toggle(enabled && minX < 0);
                }
                if ($vScrollbar) {
                    $vScrollbar.toggle(enabled && minY < 0);
                }
            }

            function setPosition(newX, newY) {
                x = mround(newX);
                y = mround(newY);
                pendingX = 0;
                pendingY = 0;

                if (hasTransform) {
                    $content.css('transform', translate(px(x), px(y)));
                } else {
                    $content.css({
                        left: px(x),
                        top: px(y)
                    });
                }
                if ($hScrollbar) {
                    var left = -x / contentSize.width * 100;
                    if (x > 0) {
                        $hScrollbar.css({
                            width: pc(scrollbarSize.x + left),
                            left: 0,
                            right: 'auto'
                        });
                    } else if (x >= minX) {
                        $hScrollbar.css({
                            width: pc(scrollbarSize.x),
                            left: pc(left),
                            right: 'auto'
                        });
                    } else {
                        $hScrollbar.css({
                            width: pc(100 - left),
                            left: 'auto',
                            right: 0
                        });
                    }
                    $hScrollbar.parent().css('right', $vScrollbar && minY ? cssInsetXY : cssInset);
                }
                if ($vScrollbar) {
                    var top = -y / contentSize.height * 100;
                    if (y > 0) {
                        $vScrollbar.css({
                            height: pc(scrollbarSize.y + top),
                            top: 0,
                            bottom: 'auto'
                        });
                    } else if (y >= minY) {
                        $vScrollbar.css({
                            height: pc(scrollbarSize.y),
                            top: pc(top),
                            bottom: 'auto'
                        });
                    } else {
                        $vScrollbar.css({
                            height: pc(100 - top),
                            top: 'auto',
                            bottom: 0
                        });
                    }
                    $vScrollbar.parent().css('bottom', $hScrollbar && minX ? cssInsetXY : cssInset);
                }
                toggleScrollbars();
                updateStickyPositions();
                flushChanges(true);

                $wrapper.toggleClass(options.scrollableXClass, minX < 0);
                $wrapper.toggleClass(options.scrollableYClass, minY < 0);
                $wrapper.toggleClass(options.scrollableXClass + '-l', x < 0);
                $wrapper.toggleClass(options.scrollableXClass + '-r', x > minX);
                $wrapper.toggleClass(options.scrollableYClass + '-u', y < 0);
                $wrapper.toggleClass(options.scrollableYClass + '-d', y > minY);
            }

            function setScrollMove(newX, newY) {
                var prevX = x;
                var prevY = y;
                setPosition(newX, newY);
                if (eventState) {
                    fireEvent('scrollMove', eventState.startX, eventState.startY, newX, newY, x - prevX, y - prevY);
                }
            }

            function setScrollStart(trigger, onCancel) {
                if (cancelAnim) {
                    cancelAnim();
                }
                eventTrigger = trigger;
                $wrapper.addClass(options.scrollingClass);
                fireEvent('scrollStart', x, y);
                cancelScroll = function () {
                    cancelScroll = null;
                    if (cancelAnim) {
                        cancelAnim();
                    }
                    if (onCancel) {
                        onCancel();
                    }
                };
            }

            function setScrollEnd() {
                cancelScroll = null;
                if (eventState) {
                    if (!(eventState.flag & 2)) {
                        fireEvent('scrollStop', eventState.startX, eventState.startY);
                    }
                    fireEvent('scrollEnd', eventState.startX, eventState.startY);
                }
                $wrapper.removeClass(options.scrollingClass);
            }

            function scrollTo(newX, newY, duration, callback) {
                // stop any running animation
                if (cancelAnim) {
                    cancelAnim();
                }
                stopX = newX;
                stopY = newY;

                if (mround(newX) === x && mround(newY) === y) {
                    if (typeof callback === 'function') {
                        callback();
                    }
                    return;
                }

                var fireStart = !eventState;
                var startTime = +new Date();
                var startX = x;
                var startY = y;
                var frameId;
                var resolve;

                var promise = new Promise(function (res) {
                    resolve = res;
                });
                var finish = function () {
                    cancelAnim = null;
                    cancelFrame(frameId);
                    if (fireStart) {
                        setScrollEnd();
                    }
                    if (typeof callback === 'function') {
                        callback();
                    }
                    resolve();
                };
                var animate = function () {
                    var elapsed = (+new Date()) - startTime;
                    if (elapsed >= duration) {
                        setScrollMove(newX, newY);
                        finish();
                        return;
                    }

                    var f = elapsed / duration - 1;
                    var easeOut = m.sqrt(1 - f * f);
                    var stepX = (newX - startX) * easeOut + startX;
                    var stepY = (newY - startY) * easeOut + startY;

                    setScrollMove(stepX, stepY);
                    frameId = nextFrame(animate);
                };
                if (fireStart) {
                    setScrollStart(finish);
                } else {
                    cancelAnim = finish;
                }
                animate();
                return $.extend(promise, getScrollState(startX, startY, newX, newY, newX - startX, newY - startY));
            }

            function scrollToPreNormalized(x, y, duration, callback, forcePageChange) {
                refresh();
                var p = normalizePosition(x, y, forcePageChange);
                return scrollTo(p.x, p.y, +duration || 0, callback);
            }

            function scrollByPage(dx, dy, duration, callback) {
                return scrollToPreNormalized(x - (dx * wrapperSize.width || 0), y - (dy * wrapperSize.height || 0), duration, callback, true);
            }

            function scrollToElement(target, targetOrigin, wrapperOrigin, duration, callback) {
                target = $(target, $content)[0];
                if (target) {
                    refresh();
                    var scrollPadding = getScrollPadding(target);
                    var oriE = parseOrigin(targetOrigin);
                    var oriW = parseOrigin(wrapperOrigin);
                    var posE = getRect(target);
                    var posW = getRect($wrapper[0]);
                    posW = toPlainRect(
                        posW.left + scrollPadding.left,
                        posW.top + scrollPadding.top,
                        posW.right - scrollPadding.right,
                        posW.bottom - scrollPadding.bottom
                    );
                    var newX = posE.left * (1 - oriE.percentX) + posE.right * oriE.percentX + oriE.offsetX - posW.left - posW.width * oriW.percentX - oriW.offsetX - x;
                    var newY = posE.top * (1 - oriE.percentY) + posE.bottom * oriE.percentY + oriE.offsetY - posW.top - posW.height * oriW.percentY - oriW.offsetY - y;
                    return scrollToPreNormalized(-m.round(newX), -m.round(newY), duration || wrapperOrigin, callback || duration);
                }
            }

            function fixNativeScroll(element) {
                var scrollTop = element.scrollTop;
                var scrollLeft = element.scrollLeft;
                if (scrollTop || scrollLeft) {
                    if (enabled && !pendingX && !pendingY) {
                        nextFrame(function () {
                            if (pendingX || pendingY) {
                                scrollToPreNormalized(x - pendingX, y - pendingY, 0);
                            }
                        });
                    }
                    pendingX += scrollLeft;
                    pendingY += scrollTop;
                    element.scrollTop = 0;
                    element.scrollLeft = 0;
                }
            }

            function fixNativeScrollHandler(e) {
                fixNativeScroll(e.currentTarget);
            }

            function refresh(updateContent) {
                // prevent changes missed in other containers
                flushChanges(false);
                cancelFrame(refreshTimeout);
                refreshTimeout = null;
                if ($wrapper.is(':visible')) {
                    if (updateContent || updateContentOnRefresh) {
                        var wrappers = getActivatedWrappers();
                        var content = $(options.content, $wrapper).get().find(function (v) {
                            return $(v).closest(wrappers)[0] === $wrapper[0] && $(v).is(':visible');
                        });
                        if (content !== $content[0]) {
                            if (cancelScroll) {
                                cancelScroll();
                            }
                            if ($content[0]) {
                                $content[0].scrollableOffsetX = x;
                                $content[0].scrollableOffsetY = y;
                            }
                            array.splice.call($content, 0, 1);
                            if (content) {
                                array.push.call($content, content);
                                if ($content.css('position') === 'static') {
                                    $content.css('position', 'relative');
                                }
                                if ($content.css('z-index') === 'auto') {
                                    $content.css('z-index', 0);
                                }
                                x = content.scrollableOffsetX || 0;
                                y = content.scrollableOffsetY || 0;
                                $middle = $content.parentsUntil($wrapper).not($middle).on('scroll', fixNativeScrollHandler).end();
                            }
                        }
                        if (content) {
                            $(options.sticky, content).each(function (i, v) {
                                var handle = $(options.stickyHandle, v)[0];
                                if (handle && !stickyElements.has(handle)) {
                                    setStickyElement(handle, {
                                        dirY: options.stickyToBottom ? 'bottom' : 'top',
                                        within: getRect.bind(0, v)
                                    });
                                };
                            });
                            stickyConfig.forEach(function (config, selector) {
                                $(selector, content).each(function (i, v) {
                                    setStickyElement(v, config);
                                });
                            });
                        }
                        $pageItems = content && options.pageItem ? $(options.pageItem, content) : $();
                        stickyRect = null;
                        updateContentOnRefresh = false;
                    }
                    var oMinX = minX, oMinY = minY;
                    var style = getComputedStyle($wrapper[0]);
                    var r0, r1, trailingX = 0, trailingY = 0;
                    if ($content.is(':visible')) {
                        var $clip = $content.parentsUntil($wrapper).filter(function (i, v) {
                            return $(v).css('overflow') !== 'visible';
                        });
                        r0 = getRect($wrapper[0]);
                        r1 = getRect($content[0]);
                        leadingX = r1.left - r0.left - x - parseFloat(style[pPadding[3]]) - parseFloat(style[pBorder[3]]);
                        leadingY = r1.top - r0.top - y - parseFloat(style[pPadding[0]]) - parseFloat(style[pBorder[0]]);
                        if ($clip[0]) {
                            var r2 = getRect($clip[0]);
                            trailingX = r0.right - r2.right + parseFloat($clip.css(pPadding[1]));
                            trailingY = r0.bottom - r2.bottom + parseFloat($clip.css(pPadding[2]));
                        }
                        trailingX += Math.min(0, parseFloat($content.css(pMargin[1]))) - parseFloat(style[pBorder[1]]);
                        trailingY += Math.min(0, parseFloat($content.css(pMargin[2]))) - parseFloat(style[pBorder[2]]);
                    }
                    contentSize = $.extend({}, zeroSize, options.getContentDimension($content));
                    wrapperSize = $.extend({}, zeroSize, options.getWrapperDimension($wrapper));
                    minX = options.hScroll ? m.min(0, mround(wrapperSize.width - contentSize.width - leadingX - trailingX)) : 0;
                    minY = options.vScroll ? m.min(0, mround(wrapperSize.height - contentSize.height - leadingY - trailingY)) : 0;
                    scrollbarSize = {
                        x: (1 + minX / contentSize.width) * 100 || 0,
                        y: (1 + minY / contentSize.height) * 100 || 0
                    };
                    if (options.pageDirection === 'x' || options.pageDirection === 'y') {
                        pageDirection = options.pageDirection;
                    } else if (minX && minY && $pageItems[1]) {
                        r0 = getRect($pageItems[0]);
                        r1 = getRect($pageItems[1]);
                        var centerX = (r1.left + r1.right) / 2;
                        pageDirection = centerX > r0.right || centerX < r0.left ? 'x' : 'y';
                    } else {
                        pageDirection = minY ? 'y' : 'x';
                    }
                    $wrapper.css('touch-action', (['none', 'pan-x', 'pan-y', 'auto'])[!minY * 2 + !minX]);

                    $scrollbars.each(function (i, v) {
                        if (!v.isConnected) {
                            $wrapper.append(v);
                        }
                    });
                    if (!eventState && (x < minX || y < minY)) {
                        if (cancelScroll) {
                            cancelScroll();
                        }
                        var startX = x;
                        var startY = y;
                        var newPos = normalizePosition(x, y);
                        fireEvent('scrollStart', startX, startY);
                        stopX = x;
                        stopY = y;
                        setScrollMove(newPos.x, newPos.y);
                        fireEvent('scrollEnd', startX, startY);
                    } else if (oMinX !== minX || oMinY !== minY) {
                        setPosition(x, y);
                        fireEvent('scrollProgressChange', x, y);
                    } else {
                        updateStickyPositions();
                        // prevent infinite loop
                        flushChanges(true);
                    }
                }
            }

            function refreshNext(updateContent) {
                updateContentOnRefresh = updateContentOnRefresh || updateContent === true;
                refreshTimeout = refreshTimeout || nextFrame(refresh);
            }

            function startScrollPerFrame(callback) {
                var lastTime = Date.now();
                var timeout = nextFrame(step);

                function next(curTime) {
                    lastTime = curTime || Date.now();
                    timeout = timeout && nextFrame(step);
                }

                function step() {
                    var curTime = Date.now();
                    callback(function (dx, dy, overshoot) {
                        if (!minX) {
                            dx = 0;
                        } else if (x > 0 || x < minX) {
                            dx = dx / m.sqrt(x > 0 ? x : minX - x);
                        }
                        if (!minY) {
                            dy = 0;
                        } else if (y > 0 || y < minY) {
                            dy = dy / m.sqrt(y > 0 ? y : minY - y);
                        }
                        var factor = (curTime - lastTime) * 2;
                        var newX = x - dx * factor;
                        var newY = y - dy * factor;
                        if (!overshoot || (options.snapToPage && options.pageItem)) {
                            var newPos = normalizePosition(newX, newY, true);
                            newX = newPos.x;
                            newY = newPos.y;
                            if (newPos.pageChanged) {
                                timeout = 0;
                                scrollTo(newX, newY, options.bounceDuration, next);
                                return true;
                            }
                        }
                        if (m.abs(newX - x) >= 0.5 || m.abs(newY - y) >= 0.5) {
                            setScrollMove(newX, newY);
                            return true;
                        }
                    }, curTime);
                    next(curTime);
                }

                return function () {
                    cancelFrame(timeout);
                    timeout = 0;
                };
            }

            function scrollWithMomentum(startX, startY, speedX, speedY, handleEnd) {
                var momentumX = x === startX ? zeroMomentum : calculateMomentum(speedX, m.max(0, x > startX ? -x : x - minX), options.bounce && wrapperSize.width);
                var momentumY = y === startY ? zeroMomentum : calculateMomentum(speedY, m.max(0, y > startY ? -y : y - minY), options.bounce && wrapperSize.height);
                var newX = x - momentumX.dist;
                var newY = y - momentumY.dist;
                if (options.pageItem && options.snapToPage) {
                    var p = normalizePosition(newX, newY, true);
                    newX = p.x;
                    newY = p.y;
                }
                scrollTo(newX, newY, m.max(momentumX.time, momentumY.time), function () {
                    var newPos = normalizePosition(x, y);
                    scrollTo(newPos.x, newPos.y, options.bounceDuration, handleEnd);
                });
            }

            function startScrollByPointer(e) {
                var touches = e.originalEvent.touches;
                var hasTouch = touches && (touches[0].touchType || true);
                var handle = options.handle;
                var EV_MOVE = hasTouch ? 'touchmove' : 'mousemove';
                var EV_END = hasTouch ? 'touchend' : 'mouseup';
                var EV_CANCEL = hasTouch ? 'touchcancel' : 'mouseup';

                clearTimeout(wheelLock);

                if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey || e.isDefaultPrevented()) {
                    return;
                }
                // only start scrolling for left click and one-finger touch
                if ((!hasTouch && e.which !== 1) || (hasTouch && touches.length !== 1) || $(e.target).is(options.cancel) || $(options.cancel, $wrapper).has(e.target).length) {
                    if (e.which === 2) {
                        e.preventDefault();
                    }
                    return;
                }
                if ($(e.target).is(':text')) {
                    return;
                }
                refresh();

                var point = getEventPosition(e);
                var startTime = +new Date();
                var startX = x;
                var startY = y;
                var pressureX = 0;
                var pressureY = 0;
                var lastPoint = point;
                var firstPoint = point;
                var eventTarget = e.target;
                var bindedHandler = {};
                var snappedToPage = false;
                var canScrollX = options.hScroll && minX < 0;
                var canScrollY = options.vScroll && minY < 0;
                var scrollbarMode;
                var modeX;
                var modeY;
                var factor = 1;
                var isDirY;
                var stopScroll;

                if (handle === 'auto') {
                    handle = hasTouch ? 'content' : 'scrollbar';
                }
                if (hasTouch && touches.length === 1) {
                    lastTouch = point;
                } else if (!hasTouch && lastTouch && point.x === lastTouch.x && point.y === lastTouch.y) {
                    return;
                }
                if (handle === 'scrollbar' || handle === 'both') {
                    modeX = !modeY && $hScrollbar && minX < 0 && getHit($hScrollbar, 5, point, false);
                    modeY = !modeX && $vScrollbar && minY < 0 && getHit($vScrollbar, 5, point, true);
                    if (modeX === 2) {
                        isDirY = false;
                        factor = -100 / scrollbarSize.x * (1 - leadingX / wrapperSize.width);
                    } else if (modeY == 2) {
                        isDirY = true;
                        factor = -100 / scrollbarSize.y * (1 - leadingY / wrapperSize.height);
                    }
                    scrollbarMode = modeX || modeY;
                }
                if (!hasTouch && handle === 'scrollbar' && !scrollbarMode) {
                    return;
                }
                if (!hasTouch) {
                    e.preventDefault();
                }
                if (scrollbarMode) {
                    $current = $current || $wrapper;
                }

                function handleStart() {
                    if (!hasTouch) {
                        $blockLayer.appendTo(document.body);
                    }
                    setScrollStart(scrollbarMode ? 'scrollbar' : 'gesture', handleStop);
                }

                function handleEnd() {
                    if (stopScroll) {
                        stopScroll();
                    }
                    if (eventState) {
                        setScrollEnd();
                    }
                    $wrapper.removeClass(options.scrollingClass);
                }

                function handleMove(e) {
                    lastTouch = null;
                    if ($current && $current !== $wrapper || snappedToPage) {
                        return;
                    }
                    var point = getEventPosition(e);
                    var deltaX = point.x - lastPoint.x;
                    var deltaY = point.y - lastPoint.y;
                    var touchDeltaX = deltaX;
                    var touchDeltaY = deltaY;
                    var newX = startX + (point.x - firstPoint.x) * factor;
                    var newY = startY + (point.y - firstPoint.y) * factor;
                    var distX = m.abs(point.x - firstPoint.x);
                    var distY = m.abs(point.y - firstPoint.y);
                    var thisDirY = distX / distY < 1;
                    var hBounce = options.hBounce && !scrollbarMode;
                    var vBounce = options.vBounce && !scrollbarMode;

                    if ((!deltaX && !deltaY) || (!eventState && hasTouch === 'stylus' && distX < 10 && distY < 10)) {
                        return;
                    }
                    e.preventDefault();
                    lastPoint = point;

                    if (scrollbarMode % 2) {
                        return;
                    }
                    if (isDirY === undefined) {
                        if (!scrollbarMode) {
                            // exit if the gesture does not suggest a scroll
                            if ((!hasTouch && distX < 6 && distY < 6) || (!canScrollY && thisDirY) || (!canScrollX && !thisDirY)) {
                                return;
                            }
                            // check if user is scrolling inner content
                            var scrollInner = canScrollInnerElement(e.target, $wrapper[0]);
                            if (scrollInner && scrollInner.x && scrollInner.y) {
                                handleStop(e);
                                return;
                            }
                            // check if user is scrolling outer content when content of this container is underflow
                            if (((thisDirY && !minY) || (!thisDirY && !minX)) && (getParentWrapper($wrapper[0]) || canScrollInnerElement($wrapper[0], document.body, deltaX, deltaY))) {
                                handleStop(e);
                                return;
                            }
                            isDirY = 0;
                            if (scrollInner) {
                                isDirY = !scrollInner.y;
                            } else if (options.lockDirection) {
                                isDirY = distX >= distY + 6 ? false : distY >= distX + 6 ? true : isDirY;
                            }
                        } else {
                            isDirY = thisDirY;
                        }
                    }
                    $current = $current || $wrapper;
                    if (!eventState) {
                        handleStart();
                    }

                    // lock direction
                    if (!canScrollY || (isDirY !== 0 && !isDirY)) {
                        newY = y;
                        deltaY = 0;
                        if (canScrollY) {
                            touchDeltaY = 0;
                        }
                    }
                    if (!canScrollX || (isDirY !== 0 && isDirY)) {
                        newX = x;
                        deltaX = 0;
                        if (canScrollX) {
                            touchDeltaX = 0;
                        }
                    }

                    // slow down if outside of the boundaries
                    if (newX > 0 || newX < minX) {
                        newX = hBounce ? x + (deltaX / 2) : newX > 0 ? 0 : minX;
                        if (!hBounce) {
                            pressureX = m.max(0, 100 - m.abs(pressureX)) * ((pressureX || deltaX) / m.abs(pressureX || deltaX)) / 2 + pressureX;
                        }
                    } else if (newX !== x) {
                        if (!hBounce) {
                            pressureX = pressureX / 4;
                        }
                    }
                    if (newY > 0 || newY < minY) {
                        newY = vBounce ? y + (deltaY / 2) : newY > 0 ? 0 : minY;
                        if (!vBounce) {
                            pressureY = m.max(0, 100 - m.abs(pressureY)) * ((pressureY || deltaY) / m.abs(pressureY || deltaY)) / 2 + pressureY;
                        }
                    } else if (newY !== y) {
                        if (!vBounce) {
                            pressureY = pressureY / 4;
                        }
                    }

                    if (options.pageItem && options.snapToPage) {
                        var p = normalizePosition(newX, newY, true);
                        newX = p.x;
                        newY = p.y;
                        if (p.pageChanged) {
                            scrollTo(newX, newY, options.bounceDuration, handleEnd);
                            snappedToPage = true;
                            return;
                        }
                    }

                    fireEvent('touchMove', startX, startY, newX, newY, touchDeltaX, touchDeltaY);
                    if (newX !== x || newY !== y) {
                        setScrollMove(newX, newY);
                    }
                    setGlow(pressureX, pressureY);
                }

                function handleStop(e) {
                    if ($current === $wrapper) {
                        $current = null;
                    }
                    $(document).off(bindedHandler);

                    if (eventTarget.releaseCapture) {
                        eventTarget.releaseCapture();
                    }

                    if (eventState) {
                        if (!hasTouch) {
                            // Firefox will fire mouseup and click event on the mousedown target
                            // whenever the mousedown default behavior is canceled
                            if (e && e.target === eventTarget && window.addEventListener) {
                                window.addEventListener('click', function cancelClick(e) {
                                    e.stopImmediatePropagation();
                                    e.preventDefault();
                                    window.removeEventListener('click', cancelClick, true);
                                }, true);
                            }
                            $blockLayer.detach();
                        }
                        fireEvent('scrollStop', startX, startY);
                        if ($hGlow) {
                            $hGlow.fadeOut();
                        }
                        if ($vGlow) {
                            $vGlow.fadeOut();
                        }
                        if (snappedToPage || scrollbarMode) {
                            handleEnd();
                            return;
                        }

                        var duration = (+new Date()) - startTime;
                        var factor = !!options.momentum && duration < 300;
                        scrollWithMomentum(eventState.startX, eventState.startY, factor * (startX - x) / duration, factor * (startY - y) / duration, handleEnd);
                    } else {
                        handleEnd();
                    }
                }

                // stop any running animation
                if (cancelAnim) {
                    cancelAnim();
                }

                bindedHandler[EV_MOVE] = handleMove;
                bindedHandler[EV_END] = handleStop;
                bindedHandler[EV_CANCEL] = handleStop;
                $(document).on(bindedHandler);
                cancelScroll = handleStop;

                // trick to let IE fire mousemove event when pointer moves outside the window
                // and to prevent IE from selecting or dragging elements (e.preventDefault() does not work!)
                if (eventTarget.setCapture) {
                    eventTarget.setCapture();
                }

                $wrapper.addClass(options.scrollingClass);

                if (scrollbarMode % 2) {
                    stopScroll = startScrollPerFrame(function (scrollBy) {
                        var hit = getHit(modeX ? $hScrollbar : $vScrollbar, 5, lastPoint, modeY);
                        if (hit === scrollbarMode) {
                            scrollBy(modeX, modeY);
                        }
                    });
                    handleStart();
                }
            }

            function startScrollByAuxClick(e) {
                var ev = e.originalEvent;
                var canScrollX = options.hScroll && minX;
                var canScrollY = options.vScroll && minY;
                var defaultCursor = 'all-scroll';
                var stopScroll;
                var speedX;
                var speedY;

                if ((!canScrollX && !canScrollY) || e.which !== 2) {
                    return;
                }

                function handleStop() {
                    if (stopScroll) {
                        stopScroll();
                        setScrollEnd();
                    }
                    $(document).off(bindedHandler);
                    $blockLayer.detach().css('cursor', 'default');
                }

                function handleScroll(e) {
                    var deltaX = e.clientX - ev.clientX;
                    var deltaY = e.clientY - ev.clientY;
                    speedX = canScrollX && m.abs(deltaX) >= 20 ? deltaX / 200 : 0;
                    speedY = canScrollY && m.abs(deltaY) >= 20 ? deltaY / 200 : 0;
                    if (speedX || speedY) {
                        if (!stopScroll) {
                            stopScroll = startScrollPerFrame(function (scrollBy) {
                                scrollBy(speedX, speedY);
                            });
                            setScrollStart('auxclick', handleStop);
                        }
                        $blockLayer.css('cursor', (!speedY ? '' : speedY < 0 ? 'n' : 's') + (!speedX ? '' : speedX < 0 ? 'w' : 'e') + '-resize');
                    } else {
                        $blockLayer.css('cursor', defaultCursor);
                    }
                }

                // stop any running animation
                if (cancelAnim) {
                    cancelAnim();
                }
                e.stopPropagation();

                var bindedHandler = {
                    mousemove: handleScroll,
                    mousedown: handleStop
                };
                $(document).on(bindedHandler);
                $blockLayer.appendTo(document.body).css('cursor', defaultCursor);
                cancelScroll = handleStop;
            }

            function startScrollByWheel(e) {
                var ev = e.originalEvent;
                var wheelDeltaX = 0;
                var wheelDeltaY = 0;
                var canScrollX = options.hScroll && minX < 0;
                var canScrollY = options.vScroll && minY < 0;

                if (!options.wheel || e.ctrlKey || e.altKey || e.shiftKey || e.metaKey || e.isDefaultPrevented() || (!canScrollX && !canScrollY)) {
                    return;
                }
                if (ev.deltaX !== undefined) {
                    wheelDeltaX = ev.deltaX;
                    wheelDeltaY = ev.deltaY;
                } else if (ev.wheelDeltaX !== undefined) {
                    wheelDeltaX = -ev.wheelDeltaX;
                    wheelDeltaY = -ev.wheelDeltaY;
                } else if (ev.wheelDelta !== undefined) {
                    wheelDeltaY = -ev.wheelDelta;
                } else if (ev.detail !== undefined) {
                    wheelDeltaY = ev.detail;
                }
                if (!wheelDeltaX && !wheelDeltaY) {
                    return;
                }
                if ($current && $current !== $wrapper && ($wrapper.find($current)[0] || $current.find($wrapper)[0])) {
                    return;
                }
                if (!canScrollY && !wheelDeltaX && options.inferWheelX) {
                    wheelDeltaX = wheelDeltaY;
                }
                var isDirY = m.abs(wheelDeltaY) > m.abs(wheelDeltaX);
                var scrollInner = canScrollInnerElement(e.target, $wrapper[0]);
                if (scrollInner && (isDirY ? scrollInner.y : scrollInner.x)) {
                    return;
                }
                if ((!canScrollX && !isDirY) || (!canScrollY && isDirY)) {
                    return;
                }
                wheelDeltaX *= canScrollX;
                wheelDeltaY *= canScrollY;
                refresh();

                var newPos = normalizePosition(x - wheelDeltaX, y - wheelDeltaY, true);
                var newX = newPos.x;
                var newY = newPos.y;
                if (newX !== x || newY !== y || ($current !== $wrapper && $wrapper.css('overscroll-behavior') !== 'auto')) {
                    $current = $wrapper;
                }
                if ($current === $wrapper) {
                    e.stopPropagation();
                    e.preventDefault();
                    clearTimeout(wheelLock);
                    wheelLock = setTimeout(function () {
                        $current = null;
                    }, 250);
                }
                if (newX === x && newY === y) {
                    return;
                }
                if (!wheelState || (wheelState.ending && (wheelDeltaX / 0 !== wheelState.dx / 0) && (wheelDeltaY / 0 !== wheelState.dy / 0))) {
                    var handleEnd = function () {
                        wheelState = null;
                        stopScroll();
                        setScrollEnd();
                    };
                    var stopScroll = startScrollPerFrame(function (scrollBy, timestamp) {
                        if (timestamp - wheelState.timestamp > 100 || timestamp - wheelState.ending > 300) {
                            var momemtum = !!(wheelState.momentum && options.momentum);
                            scrollWithMomentum(eventState.startX, eventState.startY, wheelState.dx * momemtum, wheelState.dy * momemtum, handleEnd);
                            stopScroll();
                            wheelState = null;
                        } else {
                            var scrolled = scrollBy(wheelState.dx, wheelState.dy, wheelState.momentum && options.bounce);
                            if (!scrolled && (x > 0 || x < minX || y > 0 || y < minY) && !wheelState.ending) {
                                wheelState.ending = timestamp;
                            }
                        }
                    });
                    setScrollStart('wheel', handleEnd);
                    wheelState = {
                        startTime: Date.now()
                    };
                }
                wheelState.timestamp = Date.now();
                wheelState.dx = wheelDeltaX / 100;
                wheelState.dy = wheelDeltaY / 100;
                if ((wheelDeltaX && m.abs(wheelDeltaX) < 50) || (wheelDeltaY && m.abs(wheelDeltaY) < 50)) {
                    wheelState.momentum = true;
                }
            }

            function startScrollByKey(e) {
                if (e.isDefaultPrevented()) {
                    return;
                }
                var ev = e.originalEvent;
                var key = e.keyCode;
                var dx = 0;
                var dy = 0;
                switch (key) {
                    case 32: // space
                        if ($(document.activeElement).is('select,button,input,textarea')) {
                            return;
                        }
                    case 33: // pageUp
                    case 34: // pageDown
                        dx = 0;
                        dy = wrapperSize.height * (key === 33 ? -0.8 : 0.8);
                        break;
                    case 37: // leftArrow
                    case 38: // upArrow
                    case 39: // rightArrow
                    case 40: // downArrow
                        if ($(document.activeElement).is(':text')) {
                            return;
                        }
                        dx = key === 37 ? -50 : key === 39 ? 50 : 0;
                        dy = key === 38 ? -50 : key === 40 ? 50 : 0;
                        break;
                    default:
                        return;
                }
                refresh();
                var newPos = normalizePosition(x - dx, y - dy, true);
                if (newPos.x === x && newPos.y === y) {
                    return;
                }
                e.preventDefault();

                if (!ev || !ev.repeat) {
                    scrollTo(newPos.x, newPos.y, 50);
                    return;
                }
                if (!keyState) {
                    var handleEnd = function () {
                        keyState = null;
                        stopScroll();
                        setScrollEnd();
                    };
                    var stopScroll = startScrollPerFrame(function (scrollBy, timestamp) {
                        if (timestamp - keyState.timestamp > 100) {
                            handleEnd();
                        } else {
                            scrollBy(dx / 200, dy / 200);
                        }
                    });
                    setScrollStart('keydown', handleEnd);
                    keyState = {};
                }
                keyState.timestamp = Date.now();
            }

            // setup event handlers
            var handlers = {
                scroll: fixNativeScrollHandler,
                transitionend: refreshNext,
                animationend: refreshNext,
                touchstart: startScrollByPointer,
                mousedown: startScrollByPointer,
                auxclick: startScrollByAuxClick,
                keydown: startScrollByKey
            };
            handlers[EV_WHEEL] = startScrollByWheel;
            $wrapper.on(handlers);

            // setup initial style
            if ($hScrollbar && options.handle === 'content') {
                $hScrollbar.css('pointer-events', 'none');
            }
            if ($vScrollbar && options.handle === 'content') {
                $vScrollbar.css('pointer-events', 'none');
            }
            if ($wrapper.css('overflow') !== 'hidden' && $wrapper.css('overflow') !== 'visible') {
                $wrapper.css('overflow', 'hidden');
            }

            if (window.MutationObserver) {
                mutationObserver = new MutationObserver(function () {
                    if (!muteMutations && enabled) {
                        stickyElements.forEach(function (v, i) {
                            if (!i.isConnected) {
                                removeStickyElement(i);
                            }
                        });
                        if (resizeObserver) {
                            mediaElements.forEach(function (v) {
                                if (!v.isConnected) {
                                    mediaElements.delete(v);
                                    resizeObserver.unobserve(v);
                                }
                            });
                            if ($content[0]) {
                                // use querySelectorAll to avoid infinite mutation loop due to sizzle engine
                                $.each($content[0].querySelectorAll('img, video'), function (i, v) {
                                    if (!mediaElements.has(v)) {
                                        mediaElements.add(v);
                                        resizeObserver.observe(v);
                                    }
                                });
                            }
                        }
                        refreshNext(true);
                    }
                });
                mutationObserver.observe($wrapper[0], {
                    subtree: true,
                    childList: true,
                    attributes: true,
                    characterData: true
                });
            }
            if (window.ResizeObserver) {
                mediaElements = new Set();
                resizeObserver = new ResizeObserver(function () {
                    refresh();
                });
                resizeObserver.observe($wrapper[0]);
            }

            // plugin interface
            $wrapper.data(DATA_ID, {
                get scrollTarget() {
                    return $content[0] || null;
                },
                get scrollX() {
                    return -x;
                },
                get scrollY() {
                    return -y;
                },
                get scrollPercentX() {
                    return minX ? (x / minX) * 100 : 100;
                },
                get scrollPercentY() {
                    return minY ? (y / minY) * 100 : 100;
                },
                get scrollMaxX() {
                    return -minX;
                },
                get scrollMaxY() {
                    return -minY;
                },
                get enabled() {
                    return enabled;
                },
                destroy: function () {
                    setPosition(0, 0);
                    activated.delete($wrapper[0]);
                    $wrapper.off(handlers);
                    $middle.off('scroll', fixNativeScrollHandler);
                    if ($hScrollbar) {
                        $hScrollbar.remove();
                    }
                    if ($vScrollbar) {
                        $vScrollbar.remove();
                    }
                    // release memory from MutationObserver callback
                    refresh = function () { };
                    options = {};
                    enabled = false;
                    $wrapper.data(DATA_ID, null);
                    array.splice.call($wrapper, 0, 1);
                    array.splice.call($content, 0, 1);
                    stickyElements.forEach(function (v, i) {
                        removeStickyElement(i);
                    });
                    if (mutationObserver) {
                        mutationObserver.disconnect();
                    }
                    if (resizeObserver) {
                        resizeObserver.disconnect();
                    }
                },
                enable: function () {
                    if (!enabled) {
                        enabled = true;
                        $wrapper.on(handlers);
                        refresh();
                        toggleScrollbars();
                    }
                },
                disable: function () {
                    if (enabled) {
                        enabled = false;
                        $wrapper.off(handlers);
                        toggleScrollbars();
                    }
                },
                setOptions: function (values) {
                    $.extend(options, values);
                    refresh(true);
                },
                setStickyPosition: function (element, dir, within, fixed) {
                    if (typeof within === 'boolean') {
                        fixed = within;
                        within = null;
                    }
                    var config = {
                        dirX: /\b(left|right)\b/.test(dir) && RegExp.$1,
                        dirY: /\b(top|bottom)\b/.test(dir) && RegExp.$1,
                        within,
                        fixed
                    };
                    if (typeof element === 'string') {
                        stickyConfig.set(element, config);
                    } else {
                        setStickyElement(element, config);
                    }
                    refreshNext(true);
                },
                refresh: function () {
                    refresh(true);
                },
                scrollPadding: function (target) {
                    return getScrollPadding(target);
                },
                stop: function () {
                    if (cancelScroll) {
                        cancelScroll();
                    }
                    stopX = x;
                    stopY = y;
                },
                scrollLeft: function () {
                    return -stopX;
                },
                scrollTop: function () {
                    return -stopY;
                },
                scrollBy: function (dx, dy, duration, callback) {
                    return scrollToPreNormalized(x - (dx || 0), y - (dy || 0), duration, callback) || getResolvePromise();
                },
                scrollTo: function (x, y, duration, callback) {
                    return scrollToPreNormalized(-x, -y, duration, callback) || getResolvePromise();
                },
                scrollByPage: function (dx, dy, duration, callback) {
                    return scrollByPage(dx, dy, duration, callback) || getResolvePromise();
                },
                scrollToPage: function (x, y, duration, callback) {
                    return scrollToPreNormalized(-x * wrapperSize.width || 0, -y * wrapperSize.height, duration, callback) || getResolvePromise();
                },
                scrollToElement: function (target, targetOrigin, wrapperOrigin, duration, callback) {
                    return scrollToElement(target, targetOrigin, wrapperOrigin, duration, callback) || getResolvePromise();
                }
            });

            refresh(true);
        });
    };

    $.scrollable = function (element, options) {
        if (typeof options === 'object') {
            $(element).scrollable(options);
        }
        return $.data(element, DATA_ID);
    };
    $.scrollable.hook = function (hook) {
        hooks.push(hook);
    };

    var resizeTimeout;
    $(window).on(EV_RESIZE, function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            $(getActivatedWrappers()).scrollable('refresh');
        }, isAndroid ? 200 : 0);
    });

    $(window).on('keydown', function (e) {
        if (!e.isDefaultPrevented() && activated.size) {
            switch (e.keyCode) {
                case 32: // space
                case 33: // pageUp
                case 34: // pageDown
                case 37: // leftArrow
                case 38: // upArrow
                case 39: // rightArrow
                case 40: // downArrow
                    break;
                default:
                    return;
            }
            var activeElement = getAnchorElement();
            if (activeElement) {
                $(activeElement).parents().each(function (i, v) {
                    if (activated.has(v)) {
                        $(v).triggerHandler(e);
                        return !e.isDefaultPrevented();
                    }
                });
                return;
            } else if (!isPageScrollable()) {
                var elements = getActivatedWrappers().filter(function (v) {
                    var instances = $.data(v, DATA_ID);
                    return instances.enabled && (instances.scrollMaxX || instances.scrollMaxY);
                });
                // guess the main content area
                var max = 0;
                elements = elements.filter(function (v) {
                    if (elements.indexOf(getParentWrapper(v)) >= 0) {
                        return false;
                    }
                    var r = getRect(v);
                    var a = r.width * r.height;
                    return a > max ? (max = a) : 0;
                });
                $(elements).last().triggerHandler(e);
            }
        }
    });

    try {
        if (window.top !== window.self) {
            $(window.top).on('mouseenter', function () {
                $(document).trigger('mouseup');
            });
        }
    } catch (e) { }

})();
