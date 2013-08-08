/* 
 This file contains the main instructions for the AGFK exploration, learning, and editing views
 */

/**
 * Main function
 */
(function(AGFK, Backbone, d3, undefined){
    "use strict";
  
    AGFK.utils.scaleWindowSize("header", "main");
    AGFK.appRouter = new AGFK.AppRouter();
    Backbone.history.start();

    // add dynamic properties to button explore/learn, TODO this is hacky, for now
    // conside replacing this with a global view that has both learn and explore
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

})(window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {}, window.Backbone, window.d3);
