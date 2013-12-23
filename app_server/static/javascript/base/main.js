/**
 * Main function, set to data-main with require.js
 */

/*global requirejs */

// configure require.js
requirejs.config({
  baseUrl: window.STATIC_PATH + "javascript",
  paths: {
    jquery:"lib/jquery-1.10.2",
    underscore: "lib/underscore",
    backbone: "lib/backbone-min",
    d3: "lib/d3",
    "dagre": "lib/dagre",
    "btouch": "lib/backbone.touch",
    "colorbox": "lib/jquery.colorbox-min",
    "sidr": "lib/jquery.sidr.min",
    "filesaver": "lib/FileSaver",
    "completely": "lib/complete.ly.1.0.1"
  },
  shim: {
    completely: {
      exports: "completely"
    },
    d3: {
      exports: "d3"
    },
    colorbox: {
      deps: ["jquery"]
    },
    filesaver: {
      exports: "Blob"
    },
    dagre: {
      exports: "dagre"
    },
    underscore: {
      exports: "_"
    },
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    "btouch": {
      deps: ["jquery", "underscore", "backbone"]
    },
    "sidr": ["jquery"]
  },
  waitSeconds: 15
});

/**
 * Handle uncaught require js errors -- this function is a last resort
 * TODO: anyway to reduce code repetition with other js files, considering the other js files won't be loaded?
 * perhaps define a global namespace of css classes and ids?
 */
if (window.PRODUCTION){
  requirejs.onError = function(err){
    var errorId = "error-message";
    if (document.getElementById(errorId) === null){
      var div = document.createElement("div");
      div.id = errorId;
      div.className = "app-error-wrapper"; // must also change in error-view.js
      div.textContent = "Sorry, it looks like we encountered a problem trying to " +
        "initialize the application. Refreshing your browser may solve the problem.";
      document.body.appendChild(div);
    }
    throw new Error(err.message);
  };
}

// agfk app & gen-utils
requirejs(["backbone", "base/utils/utils", "agfk/routers/router", "gc/routers/router", "gen-utils","agfk/models/aux-model", "jquery", "btouch", "sidr", "colorbox"], function(Backbone, Utils, AppRouter, GCRouter, GenPageUtils, AuxModel, $){
  "use strict";

  // handle noscript content
  $("body").css("overflow", "hidden");

  // initialize global auxData
  window.agfkGlobals.auxModel = new AuxModel(window.agfkGlobals.auxData, {parse: true});

  // shim for CSRF token integration with backbone and django
  var oldSync = Backbone.sync;
  Backbone.sync = function(method, model, options){
    options.beforeSend = function(xhr){
      if (model.get("useCsrf")){
        xhr.setRequestHeader('X-CSRFToken', window.CSRF_TOKEN);
      }
    };
    return oldSync(method, model, options);
  };

  GenPageUtils.prep();

  // automatically resize window when viewport changes
  Utils.scaleWindowSize("header", "main");

  $("body").on("mousedown", ".external-link", function(evt){
    if(window._paq){
      window._paq.push(['trackLink', evt.currentTarget.href, "link"]);
    }
  });
  $(window).on("hashchange", function() {
    if(window._paq){
      window._paq.push(['trackPageView', window.location.hash]);
    }
  });
  // track clicking between learning and explore view
  $("body").on("click", ".toggle-lc-button", function(evt){
    if(window._paq){
      window._paq.push(['trackPageView', evt.currentTarget.id]);
    }
  });

  var appRouter;
  // start the appropriate router
  // FIXME hardcoded hack
  if (window.location.pathname.split("/").pop() === "create"){
    appRouter = new GCRouter();
  } else {
    appRouter = new AppRouter();  }
  Backbone.history.start();

});
