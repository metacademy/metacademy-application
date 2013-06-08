/* 
 This file contains the main instructions for the AGFK exploration, learning, and editing views
 Constructors are prefixed with a 'C' to avoid naming collisions ('C' for 'Constructor')
 */

/**
 * Main function
 */
(function(AGFK, Backbone, d3, undefined){
    // add dynamic properties to button explore/learn, a bit of a hack, for now
    var elnavs = d3.selectAll(".el-nav-button");
    elnavs.on("click", function(){
	elnavs.classed("active", false);
	d3.select(this).classed("active", true);
    });

    AGFK.app = new AGFK.AppRouter();
    Backbone.history.start();
    AGFK.utils.scaleWindowSize("header", "main", "rightpanel", "leftpanel");
    AGFK.utils.setRightPanelWidth(0);
})(window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {}, window.Backbone, window.d3);
