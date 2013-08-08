/* 
 This file contains the main instructions for the AGFK exploration, learning, and editing views
 as well as javascript functionality that (currently) does not fit into the MVP formalism
 */



/**
 * Main function
 */
(function(AGFK, Backbone, d3, undefined){
  "use strict";

  /*
   * add dynamic properties to button explore/learn, TODO this is hacky, for now
   */
  function addLearnExploreButtonLogic(){
    var elnavs = d3.selectAll(".el-nav-button"),
	activeClass = "active", // TODO move this somewhere else
	prevMode = document.URL.match("(learn|explore)") || ["explore"];
    prevMode = prevMode[0];
    d3.select("#" + prevMode + "-button").classed(activeClass, true);
    elnavs.on("click", function(){
      var clkMode = this.id.split("-")[0];
      if (clkMode === prevMode) {return;}
      elnavs.classed(activeClass, false);
      d3.select(this).classed(activeClass, true);
      AGFK.appRouter.changeUrlParams({mode: clkMode});
      prevMode = clkMode;
    });
  }

  addLearnExploreButtonLogic();
  
  AGFK.utils.scaleWindowSize("header", "main");
  AGFK.appRouter = new AGFK.AppRouter();
  Backbone.history.start();
  
})(window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {}, window.Backbone, window.d3);
