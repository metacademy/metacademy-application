// TODO remove code repetition with agfk javascript


// configure require.js
requirejs.config({
  baseUrl: window.STATIC_PATH + "javascript",
  paths: {
    jquery:"lib/jquery-2.0.3.min",
    underscore: "lib/underscore-min",
    backbone: "lib/backbone-min",
    d3: "lib/d3",
    "btouch": "lib/backbone.touch",
    "sidr": "lib/jquery.sidr.min",
    "dagre": "lib/dagre",
    "filesaver": "lib/FileSaver"    
  },
  shim: {
    filesaver: {
      exports: "Blob"
    },
    dagre: {
      exports: "dagre"
    },
    d3: {
      exports: "d3"
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
require(["backbone","agfk/utils/utils", "gen-utils", "agfk/models/aux-model", "gc/routers/router", "jquery", "btouch", "sidr"], function(Backbone, Utils, GenPageUtils, AuxModel, Router, $){
  "use strict";

  // initialize global auxData ( TODO is this necessary? maybe...could probably use all titles for autocompletion...)
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

  $(window).on("hashchange", function() {
    if(window._paq){
      window._paq.push(['trackPageView', window.location.hash]);
    }
  });

  // start the graph creator app
  var appRouter = new Router();
  Backbone.history.start();

});
