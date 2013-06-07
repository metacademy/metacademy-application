/* 
This file contains the main instructions for the AGFK exploration, learning, and editing views
Constructors are prefixed with a 'C' to avoid naming collisions ('C' for 'Constructor')
*/

/*****************************/
/* --------- MAIN ---------- */
/*****************************/
// add dynamic properties to button explore/learn, a bit of a hack, for now
var elnavs = d3.selectAll(".el-nav-button");
elnavs.on("click", function(){
	elnavs.classed("active", false);
	d3.select(this).classed("active", true);
});
AGFK = typeof AGFK == "object" ? AGFK : {}; // namespace
AGFK.app = new AGFK.AppRouter();
Backbone.history.start();
CUtils.scaleWindowSize("header", "main", "rightpanel", "leftpanel");
CUtils.setRightPanelWidth(0);
