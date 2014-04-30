// Create simple event liseners and utility functions for headers -- this may eventually be tied in with an MVC framework but it's pretty simple and universal at the moment
// requires: jQuery

/*global define*/
if (typeof window.define === "undefined"){
  var genutil = genFun($);
  genutil.prep();
}
else{
  define(["jquery", "sidr"], function($){
    return genFun($);
  } );
}

function genFun($){
  "use strict";
  return {
    prep: function(){
      /**
       * Parse the text in the search box after enter is pressed
       */
      $('.searchbox').bind('keyup', function(event){
        if (event.which === 13 || event.keyCode === 13){
          var cval = event.currentTarget.value;
          if (cval.length > 0){
            window.location.href = "/search?q=" + window.encodeURI(event.currentTarget.value);
          }
        }
      });

      // IE placehold hack from http://www.hagenburger.net/BLOG/HTML5-Input-Placeholder-Fix-With-jQuery.html
      $('[placeholder]').focus(function() {
        var input = $(this);
        if (input.val() == input.attr('placeholder')) {
          input.val('');
          input.removeClass('placeholder');
        }
      }).blur(function() {
        var input = $(this);
        if (input.val() == '' || input.val() == input.attr('placeholder')) {
          input.addClass('placeholder');
          input.val(input.attr('placeholder'));
        }
      }).blur();

      $('[placeholder]').parents('form').submit(function() {
        $(this).find('[placeholder]').each(function() {
          var input = $(this);
          if (input.val() == input.attr('placeholder')) {
            input.val('');
          }
        });
      });

      $("#main").on("mousedown", function(evt){
        $.sidr('close', 'sidr-main');
      });
      $("#main").on("touchstart", function(evt){
        $.sidr('close', 'sidr-main');
      });

      /* sidr menu */
      $('#responsive-menu-button').sidr({
        name: 'sidr-main',
        source: '#header',
        side: "right"
      });
    },

    Autocomplete: function (userOpts, selectCallback, clickCallBack) {

      var defaultOptions = {
        numResults: 5,
        containerEl: document.querySelector('.search-container'),
        searchButtonEl: document.querySelector('.search-button'),
        classes: {
          liClass: 'ac-li',
          aClass: 'ac-li-a',
          hiddenClass: 'ac-hidden',
          ulClass: "ac-list"
        }
      };

      var options = $.extend(defaultOptions, userOpts);
      this.options = options;

      var doc = document,
          resultNodes = options.containerEl.getElementsByTagName('LI'),
          //cache = {},
          data = [],
          inputEl = options.containerEl.getElementsByTagName("input")[0],
          handlers = {
            // TODO need to generalize these handlers
            'enter': function(e) {
              if (e.target.tagName === 'A') {
                var val = e.target.firstChild.nodeValue;
                inputEl.value = "";
                insert();
                selectCallback(val, e);
              }
            },
            'up': function(e) {
              e.preventDefault();
              if (+e.target.parentNode.value === 1) {
                options.containerEl.querySelector('INPUT').focus();
              } else if (+e.target.parentNode.value > 1) {
                e.target.parentNode.previousElementSibling.firstElementChild.focus();
              }
            },
            'down': function(e) {
              e.preventDefault();
              if (e.target.tagName === 'INPUT') {
                options.containerEl.querySelector('A').focus();
              } else if (+e.target.parentNode.value < options.numResults) {
                e.target.parentNode.nextElementSibling.firstElementChild.focus();
              }
            },
            'input': function(e) {
              // FIXME
              // var val = e.target.value.trim().replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
              // return val ? insert(cacheFn(val, check)) : insert();
            },
            'button': function(e) {
              var val = options.containerEl.querySelector('INPUT').value;
            },
            containerClick: function (e) {
                // TODO DRY with enter press
                if (e.target.tagName === 'A') {
                  e.preventDefault();
                  var val = e.target.firstChild.nodeValue;
                  inputEl.value = "";
                  insert();
                  selectCallback(val, e);
                }
            }
          };

      // ******************
      // Internal FUNCTIONS
      // ******************

      // from http://css-tricks.com/snippets/javascript/addclass-function/
      var addClass = function(_element, _classes) {
        var classList, item, _i, _len;
        classList = _element.classList;
        for (_i = 0, _len = _classes.length; _i < _len; _i++) {
          item = _classes[_i];
          classList.add(item);
        }
        return _element;
      };

      var setEls = function () {
        var wrapEl = options.containerEl.querySelector('UL');

        // Colo addition
        if (!wrapEl) {
          wrapEl = document.createElement("UL");
          options.containerEl.appendChild(wrapEl);
        }
        addClass(wrapEl, [options.classes.ulClass]);
        wrapEl.style.display = "none";

        // FIXME HACK
        window.setTimeout(function () {
          var inputWidth = inputEl.getBoundingClientRect().width;
          wrapEl.style.width = inputWidth + "px";
        }, 500);

        var i = options.numResults;
        while (i--) {
          var liEl = doc.createElement('LI');
          liEl.innerHTML = '<a class="'+ options.classes.aClass + '" href="#">a</a>';
          liEl.className = options.classes.hiddenClass;
          liEl.value = +options.numResults-i;
          wrapEl.appendChild(liEl);
        }
      };

      var cacheFn = function (q, fn) {
      // TODO rework the cache
        return fn(q); // cache[q] ? cache[q] : cache[q] = fn(q), cache[q];
      };

      var check = function (q) {
        var rxFn = function(s) {
          return '\\b(' + s + ')(.*)';
        },
            rx = new RegExp(q.replace(/(\S+)/g, rxFn).replace(/\s+/g, ''), 'gi'),
            arr = [],
            i = data.length;

        while (i--) {
          if (rx.test(data[i].title)) {
            arr.push({
              'title': data[i].title,
              'tag': data[i].tag
            });
          }
        }
        return arr;
      };

      var insert = function (d) {
        var i = options.numResults,
            ict = 0;
        while (i--) {
          if (d && d.length > i) {
            resultNodes[i].className = options.classes.liClass;
            resultNodes[i].firstChild.firstChild.nodeValue = d[i].title;
            // resultNodes[i].firstChild.href = "#" + encodeURIComponent(d[i].tag);
          } else {
            ict += 1;
            resultNodes[i].className = options.classes.hiddenClass;
          }
        }

        if (ict === options.numResults) {
          resultNodes[0].parentElement.style.display = "none";
        } else {
          resultNodes[0].parentElement.style.display = "block";
        }
      };

      var eventScreener = function (e) {
        var k = e.keyCode,
            meth = k === 13 ? 'enter' : k === 38 ? 'up' : k === 40 ? 'down' : e.type === 'input' ? 'input' : null;
        return meth ? handlers[meth](e) : null;
      };

      var blurHandler = function (e) {
        window.setTimeout(function() {
          return doc.activeElement.tagName === 'INPUT' || doc.activeElement.tagName === 'A' ? null : insert();
        }, 100);
      };

      // ******************
      // Setup the autocomplete
      // ******************

      setEls();
      options.containerEl.addEventListener('input', eventScreener);
      options.containerEl.addEventListener('keyup', eventScreener);
      if (options.searchButtonEl) {
        options.searchButtonEl.addEventListener('click', handlers.button);
      }
      options.containerEl.addEventListener('click', handlers.containerClick);
      options.containerEl.addEventListener('blur', blurHandler, true);


      // ******************
      // Public Functions
      // ******************
      this.setData = function (inData) {
        data = inData;
        insert(inData);
      };
      return this;
    }
  };
}
