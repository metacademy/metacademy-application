/* 
This file contains the main instructions for the AGFK exploration, learning, and editing views
Constructors are prefixed with a 'C' to avoid naming collisions ('C' for 'Constructor')
*/

/* set constants */
window.DEFAULT_DEPTH = 2; // default dependency depth for keynode
window.DEFAULT_IS_BT = true; // display graph bottom to top by default?

/*****************************/
/* --------- MAIN ---------- */
/*****************************/
window.app = new CAppRouter();
Backbone.history.start();
scaleWindowSize("header", "main", "rightpanel", "leftpanel");
setRightPanelWidth(0);
