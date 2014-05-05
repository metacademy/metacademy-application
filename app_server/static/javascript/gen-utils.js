// Create simple event liseners and utility functions for headers -- this may eventually be tied in with an MVC framework but it's pretty simple and universal at the moment
// requires: jQuery

/*global define*/
if (typeof window.define === "undefined"){
  var GenUtil = genFun(window.$);
  GenUtil.prep();
  window.GenUtils = GenUtil;
}
else{
  define(["jquery", "sidr"], function($){
    return genFun($);
  } );
}

function genFun($){
  "use strict";

  var Autocomplete = function (userOpts, obtainGETData, inputCallback, selectCallback) {
    // user can override with userOpts
    var defaultOptions = {
      acUrl: "/autocomplete",
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
        data = [],
        inputEl = options.containerEl.getElementsByTagName("input")[0];

    // ajax helper
    var nextACText,
        acWait = false,
        acCache = {};
    var _acAjax = function (intext, acURL, acGETData, acCallback) {
      if (acCache.hasOwnProperty(intext)) {
        acWait = false;
        nextACText = null;
        acCallback(acCache[intext], intext);
        return;
      }
      $.getJSON(acURL, acGETData, function (rdata) {
        acCache[intext] = rdata;
        acCallback(rdata, intext);
      })
        .always(function (res) {
          if (nextACText) {
            var nextText = nextACText;
            nextACText = null;
            _acAjax(nextText);
          } else {
            acWait = false;
          }
        });
    };

    var setData = function (inData) {
      data = inData;
      insert(inData);
    };

    var handlers = {
      'enter': function(e) {
          var val = e.target.firstChild && e.target.firstChild.nodeValue;
          val = val || inputEl.value;
          if (val) {
            selectCallback(val, e);
          }
      },
      'up': function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (+e.target.parentNode.value === 1) {
          options.containerEl.querySelector('INPUT').focus();
        } else if (+e.target.parentNode.value > 1) {
          e.target.parentNode.previousElementSibling.firstElementChild.focus();
        }
      },
      'down': function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (e.target.tagName === 'INPUT') {
          options.containerEl.querySelector('A').focus();
        } else if (+e.target.parentNode.value < options.numResults) {
          e.target.parentNode.nextElementSibling.firstElementChild.focus();
        }
      },
      'input': function(e) {
        var val = e.target.value.trim().replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        if (val) {
          // only send one autocomplete ajax request at a time
          if (!acWait) {
            acWait = true;
            _acAjax(val, options.acUrl, obtainGETData(val), setData);
          } else {
            nextACText = val;
          }
        } else {
          insert();
        }
        return inputCallback ? inputCallback(val, e, this) : val;
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
        // TODO generalize to not include tags
        liEl.innerHTML = '<a class="'+ options.classes.aClass + '" href="#">a</a>';
        liEl.className = options.classes.hiddenClass;
        liEl.value = +options.numResults-i;
        wrapEl.appendChild(liEl);
      }
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
          var nodeEl = resultNodes[i].firstChild;
          nodeEl.textContent = d[i].title;
          for (var key in d[i]) {
            if (d[i].hasOwnProperty(key)) {
              nodeEl.setAttribute("data-" + key, d[i][key]);
            }
          }
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
    options.containerEl.addEventListener('keydown', eventScreener);
    if (options.searchButtonEl) {
      options.searchButtonEl.addEventListener('click', handlers.button);
    }
    options.containerEl.addEventListener('click', handlers.containerClick);
    options.containerEl.addEventListener('blur', blurHandler, true);


    // ******************
    // Public Functions
    // ******************
    this.setData = setData;
    return this;
  };


  var prep = function(){
      // prep the autocomplete
      var obtainGETData = function (val) {
        return {ac: val};
      };
      var acOpts = {
        containerEl: document.querySelector('.db-search-wrap')
      };

  var handleAutocomplete = function (title, evt) {
    var $tar = $(evt.target);
    if ($tar.data("tag")) {
      window.location.href = "/graphs/concepts/" + $tar.data("tag");
    } else if (1) {
      // TODO add direct roadmap
      window.location.href = "/search?q=" + window.encodeURIComponent(title);
    }
  };
  var autoComplete = new Autocomplete(acOpts, obtainGETData, null, handleAutocomplete);

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
    };

  return {
    prep: prep,
    Autocomplete: Autocomplete
  };
}
