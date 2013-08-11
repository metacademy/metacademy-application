/**
 * Main function, set to data-main with require.js
 */

// configure require.js
requirejs.config({
  baseUrl: window.STATIC_PATH + "javascript",
  paths: {
    jquery: "lib/jquery-latest",
    underscore: "lib/underscore-min",
    backbone: "lib/backbone-min",
    d3: "lib/d3-v3-min"
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



requirejs(["backbone", "agfk/utils/utils", "agfk/routers/router"], function(Backbone, Utils, AppRouter){
  "use strict";
  
  // automatically resize window when viewport changes
  Utils.scaleWindowSize("header", "main");

  var appRouter = new AppRouter();
  Backbone.history.start();
});
