/* 
This file contains the main instructions for the AGFK exploration, learning, and editing views
Constructors are prefixed with a 'C' to avoid naming collisions ('C' for 'Constructor')
*/

/*****************************/
/* --------- MAIN ---------- */
/*****************************/
window.app = new CAppRouter();
Backbone.history.start();
scaleWindowSize("header", "main", "rightpanel", "leftpanel");
setRightPanelWidth(0);
