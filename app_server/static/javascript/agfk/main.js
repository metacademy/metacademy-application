/* 
 This file contains the main instructions for the AGFK exploration, learning, and editing views
 as well as javascript functionality that (currently) does not fit into the MVP formalism
 */


/**
 * Main function
 */
(function(AGFK, Backbone, d3, undefined){
  "use strict";
  
  AGFK.utils.scaleWindowSize("header", "main"); // automatically resize when window is resized
  AGFK.appRouter = new AGFK.AppRouter();
  Backbone.history.start();
  
})(window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {}, window.Backbone, window.d3);
