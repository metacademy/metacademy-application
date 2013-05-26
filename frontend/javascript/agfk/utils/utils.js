/**
* This file contains general purpose utility functions
*/


/**
* Get spatial information about input dom element that contains an svg ellipse
*/
function getSpatialNodeInfo(inNode){
    var ellp = inNode.getElementsByTagName("ellipse")[0];
    return {
        cx: Number(ellp.getAttribute("cx")),
        cy: Number(ellp.getAttribute("cy")),
        ry: Number(ellp.getAttribute("ry")),
        rx: Number(ellp.getAttribute("rx"))
    };
}

/**
* Simulate html/mouse events programatically
* taken from http://stackoverflow.com/questions/6157929/how-to-simulate-mouse-click-using-javascript
*/
var eventMatchers = {
    'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
    'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
};
var defaultOptions = {
    pointerX: 0,
    pointerY: 0,
    button: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true
};
function simulate(element, eventName)
{
    var options = extend(defaultOptions, arguments[2] || {});
    var oEvent, eventType = null;

    for (var name in eventMatchers)
    {
        if (eventMatchers[name].test(eventName)) { eventType = name; break; }
    }

    if (!eventType)
        throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

    if (document.createEvent)
    {
        oEvent = document.createEvent(eventType);
        if (eventType == 'HTMLEvents')
        {
            oEvent.initEvent(eventName, options.bubbles, options.cancelable);
        }
        else
        {
            oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
            options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
            options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, element);
        }
        element.dispatchEvent(oEvent);
    }
    else
    {
        options.clientX = options.pointerX;
        options.clientY = options.pointerY;
        var evt = document.createEventObject();
        oEvent = extend(evt, options);
        element.fireEvent('on' + eventName, oEvent);
    }
    return element;

    function extend(destination, source) {
    for (var property in source)
      destination[property] = source[property];
    return destination;
    }
}





/**
* Wrap a long string to avoid elongated graph nodes. Translated/modified from server techniqu
*/
function wrapNodeText(s, width){
    if (!s) {return '';}

    var parts = s.split(" ");
    var result = [];
    var resArr = [];
    var total = 0;
    for (var i = 0; i < parts.length; i++){
        if (total + parts[i].length + 1 > width && total !== 0){
            resArr.push(result.join(" "));
            result = [];
            total = 0;
        }
        result.push(parts[i]);
        total += parts[i].length + 1;
    }
    resArr.push(result.join(" "));
    return resArr.join("\\n");
}


/* IE compatability functions */
if (!Array.indexOf) {
    Array.prototype.indexOf = function (obj) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == obj) {
                return i;
            }
        }
        return -1;
    };
}

if (typeof Object.getPrototypeOf !== "function")
    Object.getPrototypeOf = "".__proto__ === String.prototype
        ? function (object) {
            return object.__proto__;
        }
        : function (object) {
            // May break if the constructor has been tampered with
            return object.constructor.prototype;
        };

/* General helper functions */
function isUrl(s) {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regexp.test(s);
}

/**
* agfk specific helper functions 
*/
function setRightPanelWidth(rp_width, rp_lmarg, rp_rmarg) {
    /*
     Changes display size of the right margin
     See corresponding CSS entries for description of values
     TODO remove hard coded CSS names
     */
    rp_width = rp_width || 0;
    rp_lmarg = rp_lmarg || 0;
    rp_rmarg = rp_rmarg || 0;
    var rper_width = rp_width + "%";

    $(".colcontainer").css("right", rper_width);
    $("#leftpanel").css("left", rper_width)
        .css("width", (100 - rp_width) + "%");
    $("#rightpanel").css("width", (rp_width - rp_lmarg - rp_rmarg) + "%")
        .css("left", (rp_width + rp_lmarg) + "%");
}

/**
* Controls window/svg/div sizes in two panel display when resizing the window
* NB: has jQuery dependency
*/
function scaleWindowSize(header_id, main_id, rightpanel_id, leftpanel_id) {
    var windowSize = {
        height:0,
        mainHeight:0,
        rightPanelHeight:0,
        headerHeight:0,
        setDimensions:function () {
            windowSize.height = $(window).height();
            windowSize.headerHeight = $('#' + header_id).height();
            windowSize.mainHeight = windowSize.height - windowSize.headerHeight;
            windowSize.rightPanelHeight = windowSize.mainHeight;
            windowSize.leftPanelHeight = windowSize.mainHeight;
            windowSize.updateSizes();
        },
        updateSizes:function () {
            $('#' + main_id).css('height', windowSize.mainHeight + 'px');
            $('#' + rightpanel_id).css('height', (windowSize.rightPanelHeight) + 'px');
            $('#' + leftpanel_id).css('height', (windowSize.leftPanelHeight) + 'px');
        },
        init:function () {
            if ($('#' + main_id).length) {
                windowSize.setDimensions();
                $(window).resize(function () {
                    windowSize.setDimensions();
                });
            }
        }
    };
    windowSize.init();
}