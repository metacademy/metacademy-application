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

/* agfk specific helper functions */
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


function scaleWindowSize(header_id, main_id, rightpanel_id, leftpanel_id) {
// object to control window resizing in two panel display
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