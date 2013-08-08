/**
 * This file contains the router and must be loaded after the models, collections, and views
 */
(function(AGFK, Backbone, $, undefined){
  "use strict";
  
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
      lViewId: "learn-view-wrapper", // id for main learn view div
      eViewId: "explore-view-wrapper", // id for main explore view div
      loadViewId: "load-view-wrapper"
    };

    pvt.prevUrlParams = {}; // url parameters

    pvt.prevNodeId = undefined;

    pvt.viewMode = -1; // current view mode

    /**
     * Clean up active views
     */
    pvt.cleanUpViews = function(){
      var thisRoute = this;
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
      var params = {};
      if (inStr.length === 0){
        return params;
      }
      var splitTxt = $.trim(inStr).split("&"),
          slen = splitTxt.length,
          qpSplit;
      while(slen--){
        qpSplit = splitTxt[slen].split("=");
        if (qpSplit.length === 2){
          params[qpSplit[0]] = qpSplit[1];
        }
        else{
          window.console.warn("Parameter key/value is not length 2 and not included "
                       + "in routing (separate key/value using an '=' sign), input: " + splitTxt[slen]);
        } 
      }
      return params;
    };

    // return public object
    return Backbone.Router.extend({
      routes: {
        ":params": "routeParams",
	"": "routeParams"
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
      routeParams: function( params){
        var routeConsts = pvt.routeConsts,
	    nodeName = window.location.href.split('/').pop().split('#').shift(), // TODO replace this hack when rewriting the router
            paramsObj = pvt.getParamsFromStr(params || "");
        this.nodeRoute(nodeName, paramsObj);
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
       * Main router for a given node TODO currently only works for one dependency
       */
      nodeRoute: function(nodeId, paramsObj) {
        var thisRoute = this,
            routeConsts = pvt.routeConsts,
            qviewMode = routeConsts.qviewMode,
            qnodeName = routeConsts.qnodeName,
            pexploreMode = routeConsts.pexploreMode,
            plearnMode = routeConsts.plearnMode,
            keyNodeChanged = nodeId !== pvt.prevNodeId, 
            doRender = true,
	    loadViewRender = false;

	// show loading view while new view is processed TODO don't show loading view if view state did not change
	
	if (typeof thisRoute.loadingView === "undefined"){
	  thisRoute.loadingView =new AGFK.LoadingView();
	  loadViewRender = true;
	}
	thisRoute.showView("#" + routeConsts.loadViewId, thisRoute.loadingView, loadViewRender);
	
        // check if/how we need to acquire more data from the server
        // TODO make this more general/extendable
        if(!keyNodeChanged){
          postNodePop();
        }
        else{
          // clean up the old views
          pvt.cleanUpViews.call(thisRoute);
         
	  // fetch the new data 
          // TODO replace this technique for user data once we have the server/offline storage fleshed out
          thisRoute.appData = new AGFK.AppData({ userData: thisRoute.appData ?  thisRoute.appData.get("userData") : new AGFK.UserData()});
	  thisRoute.appData.setGraphData({depRoot: nodeId});
          thisRoute.appData.fetch({success: postNodePop});
        }

        // helper function to route change parameters appropriately
        // -- necessary because of possible AJAX calls to obtain new data
        function postNodePop() {
          // set the document title to be the searched node
          document.title = thisRoute.appData.get("graphData").get("aux").getTitleFromId(nodeId) + " - Metacademy";

	  AGFK.errorHandler.assert(thisRoute.appData.get("graphData").get("nodes").length > 0, "Fetch did not populate graph nodes");
	  
          // set default to explore mode
          paramsObj[qviewMode] = paramsObj[qviewMode] || routeConsts.pexploreMode;
          pvt.viewMode = paramsObj[qviewMode];
          
          switch (paramsObj[qviewMode]){
	  case plearnMode:
            if (keyNodeChanged || typeof thisRoute.lview === "undefined"){
              thisRoute.lview = new AGFK.LearnView({model: thisRoute.appData.get("graphData")});
              doRender = true;
            }
            else{
              doRender = false;
            }
            thisRoute.showView("#" + routeConsts.lViewId, thisRoute.lview, doRender);
            break;
          default:
            if (keyNodeChanged || typeof thisRoute.eview === "undefined"){
              thisRoute.eview = new AGFK.ExploreView({model: thisRoute.appData.get("graphData")});
              doRender = true;
            }
            else{
              doRender = false;
            }
            thisRoute.showView("#" + routeConsts.eViewId, thisRoute.eview, doRender);
          }
          pvt.prevUrlParams = $.extend({}, paramsObj);
	  pvt.prevNodeId = nodeId;
        }
      }
    });
  })();
})(window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {}, window.Backbone, window.jQuery);
