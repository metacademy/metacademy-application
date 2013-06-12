/**
 * This file contains the router and must be loaded after the models, collections, and views
 */
(function(AGFK, Backbone, $, undefined){
    /**
     * Central router to control URL state
     */
    AGFK.AppRouter = (function(){

        // define private methods and variables
        var pvt = {};

        // constants
        pvt.routeConsts = {
            qnodeName: "node", // key name for node in the query parameters
            qviewMode: "mode",
            pexploreMode: "explore",
            plearnMode: "learn",
            leftPanelId: "leftpanel,",
            rightPanelId: "rightpanel",
            lviewId: "learn-view-wrapper", // id for main learn view div
            eviewId: "explore-view-wrapper" // id for main explore view div
        };

        pvt.prevUrlParams = {}; // url parameters

        pvt.viewMode = -1; // current view mode

        /**
         * Clean up active views
         */
        pvt.cleanUpViews = function(){
            thisRoute = this;
            if (thisRoute.eview instanceof AGFK.ExploreView){
                thisRoute.eview.close();
                thisRoute.eview = undefined;
                }
            if (thisRoute.lview instanceof AGFK.LearnView){
                thisRoute.lview.close();
                thisRoute.lview = undefined;
                }
        };
        
        /**
         * Get key/value parameter object from string with key1=val1&key2=val2 format
         */
        pvt.getParamsFromStr = function(inStr){
            var params = {},
                splitTxt = inStr.split("&"),
                slen = splitTxt.length,
                qpSplit;
            while(slen--){
                qpSplit = splitTxt[slen].split("=");
                if (qpSplit.length === 2){
                    params[qpSplit[0]] = qpSplit[1];
                }
                else{
                    console.warn("Parameter key/value is not length 2 and not included "
                                 + "in routing (separate key/value using an '=' sign), input: " + splitTxt[slen]);
                } 
            }
            return params;
        };

        // return public object
        return Backbone.Router.extend({
            routes: {
                ":params": "routeParams"
            },

            /**
             * initialize the custom backbone router 
             */
            initialize: function() {
                var app_router = new Backbone.Router();
                // Extend the View class to include a navigation method goTo TODO consider another method for doing this?
                Backbone.View.goTo = function (loc) {
                    app_router.navigate(loc, true);
                };
            },

            /**
             * Show the input view in the input selector and maintain a reference for correct clean up
             */
            showView: function (selector, view, doRender) {
                doRender = doRender || false;
                if (this.currentView) {
                    this.currentView.$el.parent().hide();
                    //this.currentView.close();
                }
                if (doRender){
                    $(selector).html(view.render().el).show();
                }
                else{
                    view.$el.parent().show();
                }
                this.currentView = view;
                return view;
            },

            /**
             * Parse the URL parameters
             */
            routeParams: function(params){
                var routeConsts = pvt.routeConsts,
                    paramsObj = pvt.getParamsFromStr(params),
                    qnodeName = routeConsts.qnodeName;

                if (paramsObj.hasOwnProperty(qnodeName)){
                    this.nodeRoute(paramsObj[qnodeName], paramsObj);
                }
                else{
                    // TODO redirect to error page
                    throw new Error("Must supply 'node' key-value pair in URL");
                }
            },

            /**
             * Change the URL parameters based on the paramObj input
             * paramObj: object of parameters to be set in URL
             * note: unprovided parameters remain unchanged
             */
            changeUrlParams: function(paramsObj){
                this.paramsToUrl($.extend({},  pvt.prevUrlParams, paramsObj));
            },

            /**
             * Change the current URL to the input in paramsObj
             */
            paramsToUrl: function(paramsObj){
                var parr = [],
                    purl,
                    param;
                for (param in paramsObj){
                    if (paramsObj.hasOwnProperty(param)){
                        parr.push(encodeURIComponent(param) + "=" + encodeURIComponent(paramsObj[param]));
                    }
                }
                parr.sort();
                purl = parr.join("&");
                this.navigate(purl, true);
            },

            /**
             * Main router for a given node
             */
            nodeRoute: function(nodeId, paramsObj) {
                var thisRoute = this,
                    routeConsts = pvt.routeConsts,
                    qviewMode = routeConsts.qviewMode,
                    qnodeName = routeConsts.qnodeName,
                    pexploreMode = routeConsts.pexploreMode,
                    plearnMode = routeConsts.plearnMode,
                    keyNodeChanged = nodeId !== pvt.prevUrlParams[qnodeName],
                    doRender = true;

                // need to load just the given node and deps...
                console.log("nodeRoute for: " + nodeId); 

                // check if/how we need to acquire more data from the server
                // TODO make this more general/extendable
                if(!keyNodeChanged){
                    postNodePop();
                }
                else{
                    // clean up the old views
                        pvt.cleanUpViews.call(thisRoute);
                    // fetch the new data
                    thisRoute.cnodesContn = new AGFK.CSData({keyNode: nodeId, userData: thisRoute.cnodesContn ?  thisRoute.cnodesContn.get("userData") : new AGFK.UserData()}); // this is hacky TODO reconsider the model structure
                    thisRoute.cnodesContn.fetch({success: postNodePop});
                }

                // helper function to route change parameters appropriately
                // -- necessary because of possible AJAX calls to obtain new data
                function postNodePop() {
                    // set default to explore mode
                    paramsObj[qviewMode] = paramsObj[qviewMode] || routeConsts.pexploreMode;
                    pvt.viewMode = paramsObj[qviewMode];
                    
                    switch (paramsObj[qviewMode]){
                    case plearnMode:
                            if (keyNodeChanged || typeof thisRoute.lview === "undefined"){
                                thisRoute.lview = new AGFK.LearnView({model: thisRoute.cnodesContn});
                                doRender = true;
                            }
                            else{
                                doRender = false;
                            }
                        thisRoute.showView("#" + routeConsts.lviewId, thisRoute.lview, doRender);
                        break;
                    default:
                            if (keyNodeChanged || typeof thisRoute.eview === "undefined"){
                                thisRoute.eview = new AGFK.ExploreView({model: thisRoute.cnodesContn});
                                doRender = true;
                            }
                            else{
                                doRender = false;
                            }
                        thisRoute.showView("#" + routeConsts.eviewId, thisRoute.eview, doRender);
                    }
                    pvt.prevUrlParams = $.extend({}, paramsObj);
                }
            }
            
        });
    })();
})(window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {}, window.Backbone, window.jQuery);
