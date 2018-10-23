/*jshint regexp:true,browser:true,jquery:true,debug:true,-W083 */

/*!
 * jQuery Scrollable v1.3.0
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

(function ($, window, m, array) {
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

        vendor = /webkit/i.test(navigator.appVersion) ? 'webkit' : /firefox/i.test(navigator.userAgent) ? 'Moz' : /trident/i.test(navigator.userAgent) ? 'ms' : window.opera ? 'O' : '',

        // browser capabilities
        isAndroid = /android/gi.test(navigator.appVersion),
        isIDevice = /iphone|ipad/gi.test(navigator.appVersion),
        isPlaybook = /playbook/gi.test(navigator.appVersion),
        isTouchPad = /hp-tablet/gi.test(navigator.appVersion),

        hasTouch = window.ontouchstart !== undefined && !isTouchPad,
        hasTransform = document.documentElement.style[vendor + 'Transform'] !== undefined,
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
        EV_WHEEL = vendor === 'Moz' ? 'DOMMouseScroll' : 'mousewheel',

        nextFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
            return setTimeout(callback, 0);
        },

        cancelFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.webkitCancelRequestAnimationFrame || window.mozCancelRequestAnimationFrame || window.oCancelRequestAnimationFrame || window.msCancelRequestAnimationFrame || clearTimeout,

        // blocking layer to prevent click event after scrolling
        $blockLayer = $('<div style="position:absolute;top:0;left:0;right:0;bottom:0;z-index:9999;background:white;opacity:0;filter:alpha(opacity=0);"></div>'),
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

    function getDimension($elm) {
        if ($elm[0]) {
            if (window.getComputedStyle) {
                var style = window.getComputedStyle($elm[0]);
                var rect = $elm[0].getBoundingClientRect();
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
            var rect = $elm[0].getBoundingClientRect();
            var rectContent = {};
            if (document.createRange) {
                var range = document.createRange();
                range.selectNodeContents($elm[0]);
                rectContent = range.getBoundingClientRect();
            }
            return {
                width: m.max((rectContent.right - m.max(rect.left, rectContent.left)) || 0, rect.right - rect.left),
                height: m.max((rectContent.bottom - m.max(rect.top, rectContent.top)) || 0, rect.bottom - rect.top)
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

        var options = {
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
        $.extend(options, optionOverrides);

        // normalize options
        $.extend(options.scrollbarTrackStyle, {
            bottom: px(options.scrollbarInset),
            right: px(options.scrollbarInset)
        });
        $.extend(options.scrollbarStyle, {
            bottom: 0,
            right: 0,
            minWidth: px(options.scrollbarSize),
            minHeight: px(options.scrollbarSize)
        });
        options.hBounce = options.bounce && options.hBounce;
        options.vBounce = options.bounce && options.vBounce;
        if (options.handle === 'auto') {
            options.handle = hasTouch ? 'content' : 'scrollbar';
        }

        // add selected elements to the collection
        $activated = $activated.add(this);

        return this.each(function () {
            var $wrapper = $(this),
                $content = $(),
                $sticky = $(),
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
                contentSize,
                wrapperSize,
                scrollbarSize,
                animFrameId;

            function fireEvent(type, startX, startY, newX, newY, deltaX, deltaY) {
                if (typeof options[type] === 'function') {
                    options[type].call($wrapper[0], {
                        type: type,
                        startX: -startX,
                        startY: -startY,
                        offsetX: newX === undefined ? -x : -newX,
                        offsetY: newY === undefined ? -y : -newY,
                        deltaX: -deltaX || 0,
                        deltaY: -deltaY || 0,
                        percentX: ((newX === undefined ? x : newX) / minX) * 100 || 0,
                        percentY: ((newY === undefined ? y : newY) / minY) * 100 || 0
                    });
                }
            }

            function normalizePosition(x, y) {
                return {
                    x: (x > 0 ? 0 : x < minX ? minX : mround(x)),
                    y: (y > 0 ? 0 : y < minY ? minY : mround(y))
                };
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

                $wrapper.toggleClass(options.scrollableXClass + '-l', minX < 0 && x < 0);
                $wrapper.toggleClass(options.scrollableXClass + '-r', minX < 0 && x > minX);
                $wrapper.toggleClass(options.scrollableYClass + '-u', minY < 0 && y < 0);
                $wrapper.toggleClass(options.scrollableYClass + '-d', minY < 0 && y > minY);

                var r0 = $wrapper[0].getBoundingClientRect();
                $sticky.each(function (i, v) {
                    var target = $(v).data(DATA_ID_STICKY);
                    if (document.body.contains(target) && document.body.contains(v)) {
                        var r1 = target.getBoundingClientRect();
                        var r2 = v.getBoundingClientRect();

                        $(v).css('font-size', $(target).css('font-size'));
                        if (options.stickyToBottom && (r1.top > r0.bottom - r2.height)) {
                            $(v).css({
                                position: 'absolute',
                                visibility: 'visible',
                                top: 'auto',
                                bottom: 0
                            });
                        } else if (r1.top < r0.top + leadingY && r1.bottom > r0.top + leadingY) {
                            $(v).css({
                                position: 'absolute',
                                visibility: 'visible',
                                top: leadingY - Math.max(0, r0.top + leadingY + r2.height - r1.bottom),
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
                cancelFrame(animFrameId);
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
                    animFrameId = nextFrame(animate);
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
                        if (content !== $content[0]) {
                            array.splice.call($content, 0, 1, content);
                            if ($content.css('position') === 'static') {
                                $content.css('position', 'relative');
                            }
                            if ($content.css('z-index') === 'auto') {
                                $content.css('z-index', 0);
                            }
                            x = 0;
                            y = 0;
                        }
                        if (content) {
                            var $curSticky = $($sticky);
                            $sticky = $(options.sticky, content).map(function (i, v) {
                                var data = $(v).data();
                                var clone = data.stickyNote || (data.stickyNote = createStickyClone(v));
                                return clone;
                            });
                            $curSticky.not($sticky).remove();
                            $sticky.appendTo($wrapper);
                        }
                    }
                    if ($content[0]) {
                        var r0 = $wrapper[0].getBoundingClientRect();
                        var r1 = $content[0].getBoundingClientRect();
                        leadingX = r1.left - r0.left - x - parseFloat($wrapper.css('padding-left'));
                        leadingY = r1.top - r0.top - y - parseFloat($wrapper.css('padding-top'));
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
                        x: (wrapperSize.width - leadingX) / contentSize.width * 100 || 0,
                        y: (wrapperSize.height - leadingY) / contentSize.height * 100 || 0
                    };
                    minX = m.min(0, mround(wrapperSize.width - leadingX - contentSize.width));
                    minY = m.min(0, mround(wrapperSize.height - leadingY - contentSize.height));
                    if ($hScrollbar) {
                        $hScrollbar.toggle(minX < 0);
                    }
                    if ($vScrollbar) {
                        $vScrollbar.toggle(minY < 0);
                    }
                    $wrapper.toggleClass(options.scrollableXClass, minX < 0);
                    $wrapper.toggleClass(options.scrollableYClass, minY < 0);

                    if ($current !== $wrapper) {
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
                $current = $current || $wrapper;

                function bounceBack(callback) {
                    var newPos = normalizePosition(x, y);
                    scrollTo(newPos.x, newPos.y, options.bounceDuration, callback);
                }

                function handleMove(e) {
                    if ($current !== $wrapper) {
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
                        hBounce = options.hBounce && !scrollbarMode,
                        vBounce = options.vBounce && !scrollbarMode;

                    e.preventDefault();
                    if (!deltaX && !deltaY) {
                        return;
                    }
                    lastPointX = point.x;
                    lastPointY = point.y;

                    // exit if the gesture does not suggest a scroll
                    if (!scrollbarMode && isDirY === undefined) {
                        var thisDirY = distX / distY < 1;
                        if ((!hasTouch && distX < 6 && distY < 6) || (!options.vScroll && thisDirY) || (!options.hScroll && !thisDirY)) {
                            return;
                        }
                    }

                    if (!contentScrolled) {
                        if (isDirY === undefined) {
                            isDirY = distX / distY < 1;
                        }
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

                        var duration = (+new Date()) - startTime,
                            momentumX = zeroMomentum,
                            momentumY = zeroMomentum;

                        if (options.momentum && duration < 300 && !scrollbarMode) {
                            momentumX = calculateMomentum(x - startX, duration, x > startX ? -x : x - minX, options.bounce && wrapperSize.width);
                            momentumY = calculateMomentum(y - startY, duration, y > startY ? -y : y - minY, options.bounce && wrapperSize.height);
                        }
                        scrollTo(x + momentumX.dist, y + momentumY.dist, m.max(momentumX.time, momentumY.time), function () {
                            bounceBack(function () {
                                fireEvent('scrollEnd', startX, startY);
                                $wrapper.removeClass(options.scrollingClass);
                            });
                        });
                    } else {
                        bounceBack();
                        $wrapper.removeClass(options.scrollingClass);
                    }
                }

                // stop any running animation
                cancelFrame(animFrameId);

                bindedHandler[EV_MOVE] = handleMove;
                bindedHandler[EV_END] = handleStop;
                bindedHandler[EV_CANCEL] = handleStop;
                $(document).bind(bindedHandler);

                // trick to let IE fire mousemove event when pointer moves outside the window
                // and to prevent IE from selecting or dragging elements (e.preventDefault() does not work!)
                if (eventTarget.setCapture) {
                    eventTarget.setCapture();
                }

                $wrapper.addClass(options.scrollingClass);
            };
            handlers[EV_WHEEL] = function (e) {
                var ev = e.originalEvent,
                    wheelDeltaX,
                    wheelDeltaY;

                if (ev.wheelDeltaX !== undefined) {
                    wheelDeltaX = ev.wheelDeltaX / 1.2;
                    wheelDeltaY = ev.wheelDeltaY / 1.2;
                    if ((!options.vScroll || !minY) && !wheelDeltaX) {
                        wheelDeltaX = wheelDeltaY;
                    }
                } else if (ev.wheelDelta !== undefined) {
                    wheelDeltaX = wheelDeltaY = ev.wheelDelta / 1.2;
                } else if (ev.detail !== undefined) {
                    wheelDeltaX = wheelDeltaY = -ev.detail * 30;
                } else {
                    return;
                }

                var newPos = normalizePosition(x + (wheelDeltaX * options.hScroll), y + (wheelDeltaY * options.vScroll));
                if (newPos.x !== x || newPos.y !== y) {
                    scrollTo(newPos.x, newPos.y, 200);
                }
                if (minX < 0 || minY < 0) {
                    e.preventDefault();
                }
                e.stopPropagation();
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

            function scrollToPreNormalized(x, y, duration, callback) {
                refresh();
                var p = normalizePosition(-x || 0, -y || 0);
                scrollTo(p.x, p.y, +duration || 0, callback);
            }

            function preventPullToRefresh(container) {
                var prevent = false;
                container.addEventListener('touchstart', function (e) {
                    prevent = e.touches.length === 1 && (window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop) === 0;
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
                    cancelFrame(animFrameId);
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
                        var posE = target.getBoundingClientRect();
                        var posW = $wrapper[0].getBoundingClientRect();
                        var newX = posE.left * (1 - oriE.percentX) + posE.right * oriE.percentX + oriE.offsetX - posW.left - wrapperSize.width * oriW.percentX - oriW.offsetX - x - leadingX;
                        var newY = posE.top * (1 - oriE.percentY) + posE.bottom * oriE.percentY + oriE.offsetY - posW.top - wrapperSize.height * oriW.percentY - oriW.offsetY - y - leadingY;
                        $sticky.each(function (i, v) {
                            if ($.contains($(v).data(DATA_ID_STICKY), target)) {
                                newY += $(v).outerHeight();
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

}(jQuery, window, Math, []));
