/**
 * Main function, set to data-main with require.js
 */

// configure require.js
window.requirejs.config({
  baseUrl: window.STATIC_PATH + "javascript",
  paths: {
    jquery: "lib/jquery-latest",
    underscore: "lib/underscore-min",
    backbone: "lib/backbone-min",
    d3: "lib/d3-v3"
  },
  shim: {
    d3: {
      exports: "d3"
    },
    underscore: {
      exports: "_"
    },
    backbone: {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    }
  },
  waitSeconds: 15
});
  
// agfk app & gen-utils
window.requirejs(["backbone", "agfk/utils/utils", "agfk/routers/router", "gen-utils"], function(Backbone, Utils, AppRouter, GenPageUtils){
  "use strict";

  GenPageUtils.prep();
  
  // automatically resize window when viewport changes
  Utils.scaleWindowSize("header", "main");

  var appRouter = new AppRouter();
  Backbone.history.start();
});
