/*jshint regexp:true,browser:true,jquery:true,debug:true,-W083 */

/*!
 * jQuery Scrollable v1.4.0
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 misonou
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('jquery-scrollable', ['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('jquery'));
    } else {
        factory(jQuery);
    }
}(this, /** @type {($: JQueryStatic) => void} */ function ($) {
    'use strict';

    var zeroMomentum = {
            dist: 0,
            time: 0
        },
        zeroOrigin = {
            percentX: 0,
            percentY: 0,
            offsetX: 0,
            offsetY: 0
        },
        originKeyword = {
            center: 0.5,
            right: 1,
            bottom: 1
        },
        mround = function (r) {
            return r >> 0;
        },
        array = Array.prototype,
        m = Math,

        vendor = /webkit/i.test(navigator.appVersion) ? 'webkit' : /firefox/i.test(navigator.userAgent) ? 'Moz' : /trident/i.test(navigator.userAgent) ? 'ms' : window.opera ? 'O' : '',

        // browser capabilities
        isAndroid = /android/gi.test(navigator.appVersion),
        isIDevice = /iphone|ipad/gi.test(navigator.appVersion),
        isPlaybook = /playbook/gi.test(navigator.appVersion),
        isTouchPad = /hp-tablet/gi.test(navigator.appVersion),

        root = document.documentElement,
        hasTouch = window.ontouchstart !== undefined && !isTouchPad,
        hasTransform = root.style[vendor + 'Transform'] !== undefined,
        hasTransform3d = window.WebKitCSSMatrix && (new window.WebKitCSSMatrix()).m11 !== undefined,

        // value helpers
        trnOpen = 'translate' + (hasTransform3d ? '3d(' : '('),
        trnClose = hasTransform3d ? ',0)' : ')',
        translate = function (x, y) {
            return trnOpen + x + ',' + y + trnClose;
        },
        pc = function (v) {
            return (v || 0).toFixed(5) + '%';
        },
        px = function (v) {
            return (v || 0) + 'px';
        },

        // events
        EV_RESIZE = 'orientationchange resize',
        EV_START = hasTouch ? 'touchstart' : 'mousedown',
        EV_MOVE = hasTouch ? 'touchmove' : 'mousemove',
        EV_END = hasTouch ? 'touchend' : 'mouseup',
        EV_CANCEL = hasTouch ? 'touchcancel' : 'mouseup',
        EV_WHEEL = 'onwheel' in window ? 'wheel' : vendor === 'Moz' ? 'DOMMouseScroll' : 'mousewheel',

        nextFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
            return setTimeout(callback, 0);
        },

        cancelFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || clearTimeout,

        // blocking layer to prevent click event after scrolling
        $blockLayer = $('<div style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:9999;background:white;opacity:0;filter:alpha(opacity=0);"></div>'),
        $originDiv = $('<div style="position:fixed;top:0;left:0;">')[0],
        $activated = $(),
        $current,
        DATA_ID = 'xScrollable',
        DATA_ID_STICKY = 'xScrollableSticky';

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
        var $track = $('<div style="position:absolute;font-size:0;z-index:1;"><div style="position:absolute;"></div></div>').appendTo($elm),
            $scrollbar = $track.children().eq(0);

        $track.css(dir === 'x' ? 'left' : 'top', px(options.scrollbarInset));
        $track.css(options.scrollbarTrackStyle);
        $scrollbar.css(options.scrollbarStyle);
        if (options.scrollbarClass) {
            $track.addClass(options.scrollbarClass + ' ' + options.scrollbarClass + '-' + dir);
        }
        return $scrollbar;
    }

    function createGlow($elm, dir, options) {
        var $track = $('<div style="position:absolute;pointer-events:none;font-size:0;z-index:1;"><div style="position:absolute;"></div></div>').appendTo($elm),
            $scrollbar = $track.children().eq(0);

        $track.css(dir === 'x' ? 'height' : 'width', '100%');
        $track.css(options.glowStyle);
        $scrollbar.css(dir === 'x' ? 'height' : 'width', '100%');
        if (options.glowClass) {
            $track.addClass(options.glowClass + ' ' + options.glowClass + '-' + dir);
        }
        return $scrollbar;
    }

    function getEventPosition(e) {
        var point = hasTouch ? e.originalEvent.touches[0] : e;
        return {
            x: point.pageX,
            y: point.pageY
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

    function getDimension($elm) {
        if ($elm[0]) {
            if (window.getComputedStyle) {
                var style = window.getComputedStyle($elm[0]);
                var rect = getRect($elm[0]);
                return {
                    width: (rect.right - rect.left) - (parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth)),
                    height: (rect.bottom - rect.top) - (parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth))
                };
            } else {
                return {
                    width: $elm.width(),
                    height: $elm.height()
                };
            }
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

    function getHit($elm, margin, point) {
        var pos = $elm.offset(),
            top = pos.top - margin,
            left = pos.left - margin,
            bottom = pos.top + $elm.outerHeight() + margin,
            right = pos.left + $elm.outerWidth() + margin;
        return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
    }

    function calculateMomentum(dist, time, maxDist, overshoot) {
        var deceleration = 0.0006,
            speed = m.abs(dist) / time,
            newDist = (speed * speed) / (2 * deceleration);

        // Proportinally reduce speed if we are outside of the boundaries
        if (newDist > maxDist) {
            maxDist += overshoot / (6 / (newDist / speed * deceleration));
            speed = speed * maxDist / newDist;
            newDist = maxDist;
        }
        if (newDist <= 0) {
            return zeroMomentum;
        }
        return {
            dist: newDist * (dist < 0 ? -1 : 1),
            time: m.max(10, mround(speed / deceleration))
        };
    }

    function canScrollInnerElement(cur, parent, deltaX, deltaY) {
        for (; cur !== parent; cur = cur.parentNode) {
            var style = getComputedStyle(cur);
            if (deltaY && cur.scrollHeight > cur.offsetHeight && (style.overflowY === 'auto' || style.overflowY === 'scroll')) {
                if ((deltaY > 0 && cur.scrollTop > 0) || (deltaY < 0 && cur.scrollTop + cur.offsetHeight < cur.scrollHeight)) {
                    return true;
                }
            }
            if (deltaX && cur.scrollWidth > cur.offsetWidth && (style.overflowX === 'auto' || style.overflowX === 'scroll')) {
                if ((deltaX > 0 && cur.scrollLeft > 0) || (deltaX < 0 && cur.scrollLeft + cur.offsetWidth < cur.scrollWidth)) {
                    return true;
                }
            }
        }
    }

    $.fn.scrollable = function (optionOverrides) {
        if (typeof optionOverrides === 'string') {
            var args = arguments;
            var returnValue;
            this.each(function () {
                var value = $(this).data(DATA_ID)[optionOverrides].apply(null, [].slice.call(args, 1));
                if (value !== undefined) {
                    returnValue = value;
                    return false;
                }
            });
            if (returnValue !== undefined) {
                return returnValue;
            }
            return this;
        }

        var batchOptions = {
            content: '>:visible:eq(0)',
            cancel: '',
            getWrapperDimension: getDimension,
            getContentDimension: getOuterDimension,
            handle: 'auto',
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
            scrollbarStyle: {
                backgroundColor: 'black',
                opacity: 0.7
            },
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
            scrollEnd: null
        };
        $.extend(batchOptions, optionOverrides);

        // normalize options
        $.extend(batchOptions.scrollbarTrackStyle, {
            bottom: px(batchOptions.scrollbarInset),
            right: px(batchOptions.scrollbarInset)
        });
        $.extend(batchOptions.scrollbarStyle, {
            bottom: 0,
            right: 0,
            minWidth: px(batchOptions.scrollbarSize),
            minHeight: px(batchOptions.scrollbarSize)
        });
        batchOptions.hBounce = batchOptions.bounce && batchOptions.hBounce;
        batchOptions.vBounce = batchOptions.bounce && batchOptions.vBounce;
        if (batchOptions.handle === 'auto') {
            batchOptions.handle = hasTouch ? 'content' : 'scrollbar';
        }

        // add selected elements to the collection
        $activated = $activated.add(this);

        return this.each(function () {
            var options = $.extend(true, {}, batchOptions),
                $wrapper = $(this),
                $content = $(),
                $sticky = $(),
                $pageItems = $(),
                $hScrollbar = options.scrollbar && options.hScroll && $(options.scrollbar($wrapper, 'x', options)),
                $vScrollbar = options.scrollbar && options.vScroll && $(options.scrollbar($wrapper, 'y', options)),
                $hGlow = options.glow && options.hGlow && $(options.glow($wrapper, 'x', options)).hide(),
                $vGlow = options.glow && options.vGlow && $(options.glow($wrapper, 'y', options)).hide(),
                enabled = true,
                x = 0,
                y = 0,
                leadingX = 0,
                leadingY = 0,
                stopX,
                stopY,
                minX,
                minY,
                pageDirection,
                contentSize,
                wrapperSize,
                scrollbarSize,
                cancelScroll,
                cancelAnim;

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

            function fireEvent(type, startX, startY, newX, newY, deltaX, deltaY) {
                if (typeof options[type] === 'function') {
                    var args = {
                        type: type,
                        startX: -startX,
                        startY: -startY,
                        offsetX: newX === undefined ? -x : -newX,
                        offsetY: newY === undefined ? -y : -newY,
                        deltaX: -deltaX || 0,
                        deltaY: -deltaY || 0,
                        percentX: ((newX === undefined ? x : newX) / minX) * 100 || 0,
                        percentY: ((newY === undefined ? y : newY) / minY) * 100 || 0,
                        pageIndex: -1,
                        pageItem: null
                    };
                    if (options.pageItem) {
                        args.pageIndex = getPageIndex();
                        args.pageItem = $pageItems[args.pageIndex];
                    }
                    options[type].call($wrapper[0], args);
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
                        switch(alignProp) {
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

            function setPosition(newX, newY) {
                x = mround(newX);
                y = mround(newY);

                if (hasTransform) {
                    $content.css(vendor + 'Transform', translate(px(x), px(y)));
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
                }

                $wrapper.toggleClass(options.scrollableXClass + '-l', x < 0);
                $wrapper.toggleClass(options.scrollableXClass + '-r', x > minX);
                $wrapper.toggleClass(options.scrollableYClass + '-u', y < 0);
                $wrapper.toggleClass(options.scrollableYClass + '-d', y > minY);

                var r0 = getRect($wrapper[0]);
                var leadingYPad = leadingY + parseFloat($wrapper.css('padding-top'));
                $sticky.each(function (i, v) {
                    var target = $(v).data(DATA_ID_STICKY);
                    if (document.body.contains(target) && document.body.contains(v)) {
                        var r1 = getRect(target);
                        var r2 = getRect(v);

                        $(v).css('font-size', $(target).css('font-size'));
                        if (options.stickyToBottom && (r1.top > r0.bottom - r2.height)) {
                            $(v).css({
                                position: 'absolute',
                                visibility: 'visible',
                                top: 'auto',
                                bottom: 0
                            });
                        } else if (r1.top < r0.top + leadingYPad && r1.bottom > r0.top + leadingYPad) {
                            $(v).css({
                                position: 'absolute',
                                visibility: 'visible',
                                top: leadingYPad - Math.max(0, r0.top + leadingYPad + r2.height - r1.bottom),
                                bottom: 'auto'
                            });
                        } else {
                            $(v).css({
                                visibility: 'hidden'
                            });
                        }
                    }
                });
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

                var startTime = +new Date(),
                    startX = x,
                    startY = y;

                function animate() {
                    var elapsed = new Date() - startTime;

                    if (elapsed >= duration) {
                        cancelAnim = null;
                        setPosition(newX, newY);
                        fireEvent('scrollEnd', startX, startY, newX, newY);
                        if (typeof callback === 'function') {
                            callback();
                        }
                        return;
                    }

                    var f = elapsed / duration - 1,
                        easeOut = m.sqrt(1 - f * f),
                        stepX = (newX - startX) * easeOut + startX,
                        stepY = (newY - startY) * easeOut + startY;

                    setPosition(stepX, stepY);
                    fireEvent('scrollMove', startX, startY, stepX, stepY, stepX - x, stepY - y);
                    var id = nextFrame(animate);
                    cancelAnim = function () {
                        cancelFrame(id);
                        cancelAnim = null;
                        fireEvent('scrollEnd', startX, startY, x, y);
                        if (typeof callback === 'function') {
                            callback();
                        }
                    };
                }
                fireEvent('scrollStart', startX, startY);
                animate();
            }

            function createStickyClone(v) {
                var $clone = $(v.cloneNode(false)).append($(options.stickyHandle, v).clone()).addClass(options.stickyClass).data(DATA_ID_STICKY, v);
                $clone.click(function () {
                    $wrapper.scrollable('scrollToElement', v, 'left top', 200);
                });
                return $clone[0];
            }

            function refresh(updateContent) {
                if ($wrapper.is(':visible')) {
                    if (updateContent) {
                        var content = $(options.content, $wrapper)[0];
                        if (content) {
                            if (content !== $content[0]) {
                                if (cancelScroll) {
                                    cancelScroll();
                                }
                                if ($content[0]) {
                                    $content[0].scrollableOffsetX = x;
                                    $content[0].scrollableOffsetY = y;
                                }
                                array.splice.call($content, 0, 1, content);
                                if ($content.css('position') === 'static') {
                                    $content.css('position', 'relative');
                                }
                                if ($content.css('z-index') === 'auto') {
                                    $content.css('z-index', 0);
                                }
                                x = content.scrollableOffsetX || 0;
                                y = content.scrollableOffsetY || 0;
                            }
                            var $curSticky = $($sticky);
                            $sticky = $(options.sticky, content).map(function (i, v) {
                                var data = $(v).data();
                                var clone = data.stickyNote || (data.stickyNote = createStickyClone(v));
                                return clone;
                            });
                            $curSticky.not($sticky).remove();
                            $sticky.appendTo($wrapper);
                            $pageItems = options.pageItem ? $(options.pageItem, content) : $();
                        }
                    }
                    var r0, r1, trailingX = 0, trailingY = 0;
                    if ($content[0]) {
                        r0 = getRect($wrapper[0]);
                        r1 = getRect($content[0]);
                        leadingX = r1.left - r0.left - x;
                        leadingY = r1.top - r0.top - y;
                        var $clip = $content.parentsUntil($wrapper).filter(function (i, v) {
                            return $(v).css('overflow') !== 'visible';
                        });
                        trailingX = parseFloat($clip.css('padding-right'));
                        trailingY = parseFloat($clip.css('padding-bottom'));
                    }
                    contentSize = $.extend({
                        width: 0,
                        height: 0
                    }, options.getContentDimension($content));
                    wrapperSize = $.extend({
                        width: 0,
                        height: 0
                    }, options.getWrapperDimension($wrapper));
                    scrollbarSize = {
                        x: (wrapperSize.width - leadingX - trailingX) / contentSize.width * 100 || 0,
                        y: (wrapperSize.height - leadingY - trailingY) / contentSize.height * 100 || 0
                    };
                    minX = options.hScroll ? m.min(0, mround(wrapperSize.width - contentSize.width - leadingX - trailingX + parseFloat($wrapper.css('padding-left')))) : 0;
                    minY = options.vScroll ? m.min(0, mround(wrapperSize.height - contentSize.height - leadingY - trailingY + parseFloat($wrapper.css('padding-top')))) : 0;
                    if (options.pageDirection === 'x' || options.pageDirection === 'y' ) {
                        pageDirection = options.pageDirection;
                    } else if (minX && minY && $pageItems[1]) {
                        r0 = getRect($pageItems[0]);
                        r1 = getRect($pageItems[1]);
                        var centerX = (r1.left + r1.right) / 2;
                        pageDirection = centerX > r0.right || centerX < r0.left ? 'x' : 'y';
                    } else {
                        pageDirection = minY ? 'y' : 'x';
                    }
                    if ($hScrollbar) {
                        $hScrollbar.toggle(enabled && minX < 0);
                    }
                    if ($vScrollbar) {
                        $vScrollbar.toggle(enabled && minY < 0);
                    }
                    $wrapper.toggleClass(options.scrollableXClass, minX < 0);
                    $wrapper.toggleClass(options.scrollableYClass, minY < 0);
                    $wrapper.toggleClass(options.scrollableXClass + '-l', x < 0);
                    $wrapper.toggleClass(options.scrollableXClass + '-r', x > minX);
                    $wrapper.toggleClass(options.scrollableYClass + '-u', y < 0);
                    $wrapper.toggleClass(options.scrollableYClass + '-d', y > minY);

                    if (($current && $current !== $wrapper) || x < minX || y < minY || updateContent) {
                        if (cancelScroll) {
                            cancelScroll();
                        }
                        var newPos = normalizePosition(x, y);
                        setPosition(newPos.x, newPos.y);
                    }
                }
            }

            var handlers = {};
            handlers[EV_START] = function (e) {
                // only start scrolling for left click and one-finger touch
                if ((!hasTouch && e.which !== 1) || (hasTouch && e.originalEvent.touches.length !== 1) || $(e.target).is(options.cancel) || $(options.cancel, $wrapper).has(e.target).length) {
                    if (e.which === 2) {
                        e.preventDefault();
                    }
                    return;
                }
                if ($(e.target).is(':text')) {
                    return;
                }
                refresh();

                var point = getEventPosition(e),
                    startTime = +new Date(),
                    startX = x,
                    startY = y,
                    pressureX = 0,
                    pressureY = 0,
                    lastPointX = point.x,
                    lastPointY = point.y,
                    firstPointX = lastPointX,
                    firstPointY = lastPointY,
                    eventTarget = e.target,
                    bindedHandler = {},
                    contentScrolled = false,
                    snappedToPage = false,
                    scrollbarMode,
                    factor = 1,
                    isDirY;

                if (options.handle === 'scrollbar' || options.handle === 'both') {
                    if ($hScrollbar && minX < 0 && getHit($hScrollbar, 10, point)) {
                        scrollbarMode = true;
                        isDirY = false;
                        factor = -100 / scrollbarSize.x * (1 - leadingX / wrapperSize.width);
                    } else if ($vScrollbar && minY < 0 && getHit($vScrollbar, 10, point)) {
                        scrollbarMode = true;
                        isDirY = true;
                        factor = -100 / scrollbarSize.y * (1 - leadingY / wrapperSize.height);
                    }
                }
                if (options.handle === 'scrollbar' && !scrollbarMode) {
                    return;
                }
                if (!hasTouch) {
                    e.preventDefault();
                }
                if (scrollbarMode) {
                    $current = $current || $wrapper;
                }

                function bounceBack(callback) {
                    var newPos = normalizePosition(x, y);
                    scrollTo(newPos.x, newPos.y, options.bounceDuration, callback);
                }

                function handleEnd() {
                    if (contentScrolled) {
                        fireEvent('scrollEnd', startX, startY);
                    }
                    $wrapper.removeClass(options.scrollingClass);
                }

                function handleMove(e) {
                    if ($current && $current !== $wrapper || snappedToPage) {
                        return;
                    }
                    var point = getEventPosition(e),
                        deltaX = point.x - lastPointX,
                        deltaY = point.y - lastPointY,
                        touchDeltaX = deltaX,
                        touchDeltaY = deltaY,
                        newX = startX + (point.x - firstPointX) * factor,
                        newY = startY + (point.y - firstPointY) * factor,
                        distX = m.abs(point.x - firstPointX),
                        distY = m.abs(point.y - firstPointY),
                        thisDirY = distX / distY < 1,
                        hBounce = options.hBounce && !scrollbarMode,
                        vBounce = options.vBounce && !scrollbarMode;

                    e.preventDefault();
                    if (!deltaX && !deltaY) {
                        return;
                    }
                    lastPointX = point.x;
                    lastPointY = point.y;

                    if (!scrollbarMode && isDirY === undefined) {
                        // exit if the gesture does not suggest a scroll
                        if ((!hasTouch && distX < 6 && distY < 6) || (!options.vScroll && thisDirY) || (!options.hScroll && !thisDirY)) {
                            return;
                        }
                        // check if user is scrolling inner content
                        if (canScrollInnerElement(e.target, $wrapper[0], deltaX, deltaY)) {
                            handleStop(e);
                            return;
                        }
                        // check if user is scrolling outer content when content of this container is underflow
                        if (((thisDirY && !minY) || (!thisDirY && !minX)) && (canScrollInnerElement($wrapper[0], document.body, deltaX, deltaY) || $wrapper.parents().filter(function (i, v) { return $(v).data(DATA_ID); })[0])) {
                            handleStop(e);
                            return;
                        }
                    }
                    if (isDirY === undefined) {
                        isDirY = thisDirY;
                    }
                    $current = $current || $wrapper;

                    if (!contentScrolled) {
                        contentScrolled = true;
                        if (!hasTouch) {
                            $blockLayer.appendTo($wrapper);
                        }
                        fireEvent('scrollStart', startX, startY);
                    }

                    // lock direction
                    if (!options.vScroll || (!scrollbarMode && options.lockDirection && distX >= distY + 6) || (scrollbarMode && !isDirY)) {
                        newY = y;
                        deltaY = 0;
                        if (options.vScroll) {
                            touchDeltaY = 0;
                        }
                    }
                    if (!options.hScroll || (!scrollbarMode && options.lockDirection && distY >= distX + 6) || (scrollbarMode && isDirY)) {
                        newX = x;
                        deltaX = 0;
                        if (options.hScroll) {
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
                        fireEvent('scrollMove', startX, startY, newX, newY, deltaX, deltaY);
                        setPosition(newX, newY);
                    }
                    setGlow(pressureX, pressureY);
                }

                function handleStop(e) {
                    if ($current === $wrapper) {
                        $current = null;
                    }
                    $(document).unbind(bindedHandler);

                    if (eventTarget.releaseCapture) {
                        eventTarget.releaseCapture();
                    }

                    if (contentScrolled) {
                        if (!hasTouch) {
                            // Firefox will fire mouseup and click event on the mousedown target
                            // whenever the mousedown default behavior is canceled
                            if (e.target === eventTarget && window.addEventListener) {
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
                        if (snappedToPage) {
                            handleEnd();
                            return;
                        }

                        var duration = (+new Date()) - startTime,
                            momentumX = zeroMomentum,
                            momentumY = zeroMomentum;

                        if (options.momentum && duration < 300 && !scrollbarMode) {
                            momentumX = calculateMomentum(x - startX, duration, x > startX ? -x : x - minX, options.bounce && wrapperSize.width);
                            momentumY = calculateMomentum(y - startY, duration, y > startY ? -y : y - minY, options.bounce && wrapperSize.height);
                        }
                        var newX = x + momentumX.dist,
                            newY = y + momentumY.dist;
                        if (options.pageItem && options.snapToPage) {
                            var p = normalizePosition(newX, newY, true);
                            newX = p.x;
                            newY = p.y;
                        }
                        scrollTo(newX, newY, m.max(momentumX.time, momentumY.time), function () {
                            bounceBack(handleEnd);
                        });
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
                $(document).bind(bindedHandler);
                cancelScroll = function () {
                    cancelScroll = null;
                    if (cancelAnim) {
                        cancelAnim();
                    }
                    handleStop({});
                };

                // trick to let IE fire mousemove event when pointer moves outside the window
                // and to prevent IE from selecting or dragging elements (e.preventDefault() does not work!)
                if (eventTarget.setCapture) {
                    eventTarget.setCapture();
                }

                $wrapper.addClass(options.scrollingClass);
            };
            var wheelState;
            handlers[EV_WHEEL] = function (e) {
                var ev = e.originalEvent,
                    wheelDeltaX = 0,
                    wheelDeltaY = 0;

                if (e.isDefaultPrevented()) {
                    return;
                }
                if (ev.deltaX !== undefined) {
                    wheelDeltaX = -ev.deltaX;
                    wheelDeltaY = -ev.deltaY;
                } else if (ev.wheelDeltaX !== undefined) {
                    wheelDeltaX = ev.wheelDeltaX;
                    wheelDeltaY = ev.wheelDeltaY;
                } else if (ev.wheelDelta !== undefined) {
                    wheelDeltaY = ev.wheelDelta;
                } else if (ev.detail !== undefined) {
                    wheelDeltaY = -ev.detail;
                }
                if (!wheelDeltaX && !wheelDeltaY) {
                    return;
                }
                if (canScrollInnerElement(e.target, $wrapper[0], wheelDeltaX, wheelDeltaY)) {
                    return;
                }
                if (vendor === 'Moz') {
                    wheelDeltaX *= 50;
                    wheelDeltaY *= 50;
                }
                if ((!options.vScroll || !minY) && !wheelDeltaX) {
                    wheelDeltaX = wheelDeltaY;
                }
                wheelDeltaX *= options.hScroll;
                wheelDeltaY *= options.vScroll;
                refresh();

                var timestamp = e.timeStamp;
                var startX = x;
                var startY = y;
                if (!wheelState || timestamp - wheelState.timestamp > 100) {
                    wheelState = {
                        startX: startX,
                        startY: startY
                    };
                    cancelScroll = function () {
                        clearTimeout(wheelState.timeout);
                        wheelState.cancelled = true;
                        cancelScroll = null;
                        if (cancelAnim) {
                            cancelAnim();
                        }
                        fireEvent('scrollStop', startX, startY);
                        fireEvent('scrollEnd', startX, startY);
                    };
                } else {
                  startX = wheelState.startX;
                  startY = wheelState.startY;
                }
                wheelState.timestamp = timestamp;
                if (wheelState.cancelled) {
                    return;
                }
                var newPos = normalizePosition(x + wheelDeltaX, y + wheelDeltaY, true);
                var newX = newPos.x;
                var newY = newPos.y;
                if (newX !== x || newY !== y) {
                    var handleEnd = function () {
                        $wrapper.removeClass(options.scrollingClass);
                        fireEvent('scrollStop', startX, startY);
                        fireEvent('scrollEnd', startX, startY);
                        wheelState = null;
                        cancelScroll = null;
                    };
                    $wrapper.addClass(options.scrollingClass);
                    if (newPos.pageChanged) {
                        scrollTo(newX, newY, options.bounceDuration, handleEnd);
                    } else {
                        clearTimeout(wheelState.timeout);
                        wheelState.timeout = setTimeout(handleEnd, 200);
                        fireEvent('scrollMove', startX, startY, newX, newY, wheelDeltaX, wheelDeltaY);
                        setPosition(newX, newY);
                        if ((minX < 0 || minY < 0) && e.cancelable) {
                            e.preventDefault();
                        }
                    }
                    e.stopPropagation();
                }
            };
            handlers.focusin = function (e) {
                var scrollTop = $wrapper[0].scrollTop,
                    scrollLeft = $wrapper[0].scrollLeft;
                if (scrollTop || scrollLeft) {
                    $wrapper[0].scrollTop = 0;
                    $wrapper[0].scrollLeft = 0;
                    scrollTo(x - scrollLeft, y - scrollTop, 0);
                }
            };
            $wrapper.bind(handlers);

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
            if (hasTouch) {
                $wrapper.css('touch-action', 'none');
            }

            function scrollToPreNormalized(x, y, duration, callback) {
                refresh();
                var p = normalizePosition(-x || 0, -y || 0);
                scrollTo(p.x, p.y, +duration || 0, callback);
            }

            function preventPullToRefresh(container) {
                var prevent = false;
                container.addEventListener('touchstart', function (e) {
                    prevent = e.touches.length === 1 && (window.pageYOffset || document.body.scrollTop || root.scrollTop) === 0;
                });
                container.addEventListener('touchmove', function (e) {
                    if (prevent) {
                        prevent = false;
                        e.preventDefault();
                    }
                });
            }
            preventPullToRefresh($wrapper[0]);

            // plugin interface
            $wrapper.data(DATA_ID, {
                destroy: function () {
                    setPosition(0, 0);
                    $activated.splice($.inArray($wrapper[0], $activated), 1);
                    $wrapper.unbind(handlers);
                    if ($hScrollbar) {
                        $hScrollbar.remove();
                    }
                    if ($vScrollbar) {
                        $vScrollbar.remove();
                    }
                    $wrapper.data(DATA_ID, null);
                },
                enable: function () {
                    if (!enabled) {
                        $wrapper.bind(handlers);
                        enabled = true;
                        refresh();
                    }
                },
                disable: function () {
                    if (enabled) {
                        $wrapper.unbind(handlers);
                        if ($hScrollbar) {
                            $hScrollbar.hide();
                        }
                        if ($vScrollbar) {
                            $vScrollbar.hide();
                        }
                        enabled = false;
                    }
                },
                setOptions: function (values) {
                    $.extend(options, values);
                    refresh(true);
                },
                refresh: function () {
                    refresh(true);
                },
                scrollPadding: function () {
                    return {
                        top: leadingY,
                        left: leadingX,
                        right: $hScrollbar ? options.scrollbarSize + options.scrollbarInset * 2 : 0,
                        bottom: $vScrollbar ? options.scrollbarSize + options.scrollbarInset * 2 : 0
                    };
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
                    scrollToPreNormalized((dx || 0) - x, (dy || 0) - y, duration, callback);
                },
                scrollTo: function (x, y, duration, callback) {
                    scrollToPreNormalized(x, y, duration, callback);
                },
                scrollToPage: function (x, y, duration, callback) {
                    scrollToPreNormalized(x * wrapperSize.width || 0, y * wrapperSize.height, duration, callback);
                },
                scrollToElement: function (target, targetOrigin, wrapperOrigin, duration, callback) {
                    target = $(target, $content)[0];
                    if (target) {
                        refresh();
                        var oriE = parseOrigin(targetOrigin);
                        var oriW = parseOrigin(wrapperOrigin);
                        var posE = getRect(target);
                        var posW = getRect($wrapper[0]);
                        var newX = posE.left * (1 - oriE.percentX) + posE.right * oriE.percentX + oriE.offsetX - posW.left - wrapperSize.width * oriW.percentX - oriW.offsetX - x - leadingX;
                        var newY = posE.top * (1 - oriE.percentY) + posE.bottom * oriE.percentY + oriE.offsetY - posW.top - wrapperSize.height * oriW.percentY - oriW.offsetY - y - leadingY;
                        $sticky.each(function (i, v) {
                            if ($.contains($(v).data(DATA_ID_STICKY), target)) {
                                newY -= getRect(v).height;
                            }
                        });
                        scrollToPreNormalized(newX, newY, duration || wrapperOrigin, callback || duration);
                    }
                }
            });

            refresh(true);
        });
    };

    var resizeTimeout;
    $(window).bind(EV_RESIZE, function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            $activated = $activated.filter(function () {
                return !!$(this).data(DATA_ID);
            });
            $activated.scrollable('refresh');
        }, isAndroid ? 200 : 0);
    });

    try {
        if (window.top !== window.self) {
            $(window.top).mouseenter(function () {
                $(document).trigger(EV_CANCEL);
            });
        }
    } catch (e) {}

}));
