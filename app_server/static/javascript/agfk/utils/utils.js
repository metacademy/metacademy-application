/*
This file contains general purpose utility functions 
*/

define(["jquery"], function($){
  "use strict";
  
  var utils = {};
  /**
   * Simple function that guesses a node title from a given tag
   * (currently replaces underscores with spaces)
   * TODO: this function may be unnecessary
   */
  utils.getTitleGuessFromTag = function(tag){
    return tag.replace(/_/g," "); 
  };

  
  /**
   * Get spatial information about input dom element that contains an svg ellipse
   */
  utils.getSpatialNodeInfo = function(inNode) {
    var ellp = inNode.getElementsByTagName("ellipse")[0];
    return {
      cx: Number(ellp.getAttribute("cx")),
      cy: Number(ellp.getAttribute("cy")),
      ry: Number(ellp.getAttribute("ry")),
      rx: Number(ellp.getAttribute("rx"))
    };
  };

  /**
   * Simulate html/mouse events
   * modified code from http://stackoverflow.com/questions/6157929/how-to-simulate-mouse-click-using-javascript
   */
  utils.simulate = (function(){
    var pvt = {};
    pvt.eventMatchers = {
      'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
      'MouseEvents': /^(?:click|dblclick|mouse(?:down|up|over|move|out))$/
    };
    pvt.defaultOptions = {
      pointerX: 0,
      pointerY: 0,
      button: 0,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      bubbles: true,
      cancelable: true,
      relatedTarget: null
    };

    return function(element, eventName) {
      var options = extend(pvt.defaultOptions, arguments[2] || {});
      var oEvent, eventType = null;

      for (var name in pvt.eventMatchers) {
        if (pvt.eventMatchers[name].test(eventName)) {
          eventType = name;
          break;
        }
      }

      if (!eventType)
        throw new SyntaxError('Only HTMLEvents and MouseEvents interfaces are supported');

      if (document.createEvent) {
        oEvent = document.createEvent(eventType);
        if (eventType == 'HTMLEvents') {
          oEvent.initEvent(eventName, options.bubbles, options.cancelable);
        } else {
          oEvent.initMouseEvent(eventName, options.bubbles, options.cancelable, document.defaultView,
                                options.button, options.pointerX, options.pointerY, options.pointerX, options.pointerY,
                                options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, options.relatedTarget);
        }
        element.dispatchEvent(oEvent);
      } else {
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
    };
  })();
  
  /**
   * Check if input is a url
   */
  utils.isUrl = function(inStr) {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    return regexp.test(inStr);
  };

  /**
   * Controls window/svg/div sizes in two panel display when resizing the window
   * NB: has jQuery dependency for x-browser support
   */
  utils.scaleWindowSize = function(header_id, main_id) {
    var windowSize = {
      height: 0,
      mainHeight: 0,
      headerHeight: 0,
      setDimensions: function() {
        windowSize.height = $(window).height();
        windowSize.headerHeight = $('#' + header_id).height();
        windowSize.mainHeight = windowSize.height - windowSize.headerHeight;
        windowSize.updateSizes();
      },
      updateSizes: function() {
        $('#' + main_id).css('height', windowSize.mainHeight + 'px');
      },
      init: function() {
        if ($('#' + main_id).length) {
          windowSize.setDimensions();
          $(window).resize(function() {
            windowSize.setDimensions();
          });
        }
      }
    };
    windowSize.init();
  };

  utils.formatTimeEstimate = function(timeEstimate) {
    if (!timeEstimate) {
      return "";
    }
    if (timeEstimate > 5) {
      return Math.round(timeEstimate) + " hours";  // round to nearest hour
    } else if (timeEstimate > 1) {
      return (Math.round(timeEstimate * 10) / 10) + " hours";   // round to nearest 0.1 hours
    } else {
      return (Math.round(timeEstimate * 12) * 5) + " minutes";    // round to nearest 5 minutes
    }
  }

  // return require.js object
  return utils;
});
