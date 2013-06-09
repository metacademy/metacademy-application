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
            rightPanelId: "rightpanel"
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
                ":params": "parseParams"
            },

            /**
             * initialize the custom backbone router 
             */
            initialize: function() {
                var app_router = new Backbone.Router();
                // Extend the View class to include a navigation method goTo TODO consider another method for doing this?PPP
                Backbone.View.goTo = function (loc) {
                    app_router.navigate(loc, true);
                };
            },

            /**
             * Show the input view in the input selector and maintain a reference for correct clean up
             */
            showView: function (selector, view) {
                if (this.currentView) {
                    this.currentView.close();
                }
                $(selector).html(view.render().el);
                this.currentView = view;
                return view;
            },

            /**
             * Parse the URL parameters
             */
            parseParams: function(params){
                var routeConsts = pvt.routeConsts,
                paramsObj = pvt.getParamsFromStr(params),
                qnodeName = routeConsts.qnodeName;

                if (paramsObj.hasOwnProperty(qnodeName)){
                    this.nodeRoute(paramsObj[qnodeName], paramsObj);
                }
                else{
                    // TODO redirect to error page
                    console.error("Must supply 'node' key value pair in URL -- defaulting to full graph view (this behavior will change in the future)");
                }
            },

            fullGraphRoute: function (first_node) {
                this.nodeRoute("");
            },

            nodeRoute: function(nodeId, paramsObj) {
                var thisRoute = this,
                routeConsts = pvt.routeConsts,
                qviewMode = routeConsts.qviewMode,
                pexploreMode = routeConsts.pexploreMode,
                plearnMode = routeConsts.plearnMode;
                // need to load just the given node and deps...
                console.log('in list');
                console.log(nodeId);
                this.cnodesContn = new AGFK.NodeCollectionContainer({keyNode: nodeId});
                this.cnodesContn.fetch({success:function () {
                    //  (collection was populated
                    console.log('successful fetch: collection was populated');
                    paramsObj[qviewMode] = paramsObj[qviewMode] || routeConsts.pexploreMode; // set default to explore mode
                    switch (paramsObj[qviewMode]){
                        case plearnMode:
                                thisRoute.kmView = new AGFK.LearnView({model: thisRoute.cnodesContn});
                        break;
                        default:
                            thisRoute.kmView = new AGFK.KmapView({model: thisRoute.cnodesContn});
                    }
                    thisRoute.showView("#leftpanel", thisRoute.kmView);
                }});

            }
        });
    })();
})(window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {}, window.Backbone, window.jQuery);
