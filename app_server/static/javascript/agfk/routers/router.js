/**
 * This file contains the router and must be loaded after the models, collections, and views
 */
window.define(["backbone", "jquery", "agfk/views/explore-view", "agfk/views/learning-view", "agfk/views/apptools-view", "agfk/views/loading-view", "agfk/models/app-model", "agfk/utils/errors", "agfk/views/error-view"],
  function(Backbone, $, ExploreView, LearnView, AppToolsView, LoadingView, AppData, ErrorHandler, ErrorMessageView){
  "use strict";
  
  /**
   * Central router to control URL state
   */
  return (function(){

    // define private methods and variables
    var pvt = {};

    // constants
    pvt.routeConsts = {
      qViewMode: "mode",
      qLearnScrollConcept: "lfocus",
      pExploreMode: "explore",
      pLearnMode: "learn",
      leftPanelId: "leftpanel,",
      rightPanelId: "rightpanel",
      lViewId: "learn-view-wrapper", // id for main learn view div
      eViewId: "explore-view-wrapper", // id for main explore view div
      loadViewId: "load-view-wrapper",
      noContentErrorKey: "nocontent", // must also change in error-view.js
      ajaxErrorKey: "ajax", // must also change in error-view.js
      unsupportedBrowserKey: "unsupportedbrowser" // must also change in error-view.js
    };

    pvt.prevUrlParams = {}; // url parameters

    pvt.prevNodeId = undefined;

    pvt.viewMode = -1; // current view mode

    /**
     * Asynchronously load Viz.js
     * Note: must call with "this = router instance"
     */
    pvt.loadViz = function(){
      var thisRoute = this;
      // Viz.js requires types arrays; no available for IE < 10
      if (Int32Array === undefined){
        // we're dealing with IE < 10 or an early mobile browser
        if (pvt.viewMode === pvt.routeConsts.pExploreMode){
          // only show the error for the explore mode
          // learn mode should work with IE 9 and popups will notify IE < 9
          thisRoute.showErrorMessageView(pvt.routeConsts.unsupportedBrowserKey); 
        }
      } else{

        if(typeof Viz === "undefined" && window.vizPromise === undefined){
          window.vizPromise = $.ajax({
            url: window.STATIC_PATH + "javascript/lib/viz.js",
            dataType: "script",
            cache: true,
            async: true,
            type: "GET",
            error: function(jxhr, opts, errorThrown){
              window.vizPromise = undefined;
              thisRoute.showErrorMessageView(pvt.routeConsts.ajaxErrorKey);
              ErrorHandler.reportAjaxError(jxhr, opts, errorThrown);
            }
          });
        }
      }
    };

    /**
     * Clean up active views
     */
    pvt.cleanUpViews = function(){
      var thisRoute = this;
      if (thisRoute.eview instanceof ExploreView){
        thisRoute.eview.close();
        thisRoute.eview = undefined;
      }
      if (thisRoute.lview instanceof LearnView){
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
      showView: function (view, doRender, selector, removeOldView) {
        var thisRoute = this;
        removeOldView = removeOldView === undefined ? true : removeOldView;

        // helper function for async rendering views
        function swapViews(){
          if (thisRoute.currentView && removeOldView) {
            thisRoute.currentView.$el.parent().hide();
          }

          if (doRender){
            if (typeof selector === "string"){
              $(selector).html(view.$el).show();
            } else{
              window.document.body.appendChild(view.el);
            }
          } else{
            view.$el.parent().show();
          }

          if (removeOldView){
            thisRoute.currentView = view;
          }
        }

        if (doRender){
          view = view.render();
        }

        // TODO don't use window object -- breaks with multiple async views
        view.isRendered() ? swapViews() : view.$el.on("viewRendered", function(){
          view.$el.off("viewRendered");
          swapViews();
        });

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
       * Show the error message view
       * key: the key for the given error message
       * extra: extra information for the error message
       */
      showErrorMessageView: function(key, extra){
        var thisRoute = this;
        // remove the app tools if there is no current view
        this.showView(new ErrorMessageView({errorType: key, extra: extra}), true, false, false);
      },

      /**
       * Main router for a given node TODO currently only works for one dependency
       */
      nodeRoute: function(nodeId, paramsObj) {
        var thisRoute = this,
            routeConsts = pvt.routeConsts,
            qViewMode = routeConsts.qViewMode,
            qLearnScrollConcept = routeConsts.qLearnScrollConcept,
            pExploreMode = routeConsts.pExploreMode,
            pLearnMode = routeConsts.pLearnMode,
            keyNodeChanged = nodeId !== pvt.prevNodeId, 
            loadViewRender = false,
            doRender;
        
        // set view-mode (defaults to learn view)
        paramsObj[qViewMode] = paramsObj[qViewMode] || pLearnMode;
        pvt.viewMode = paramsObj[qViewMode];

        // init main app model
        // TODO replace this technique for user data once we have the server/offline storage fleshed out
        thisRoute.appData = thisRoute.appData || new AppData();
        thisRoute.appData.setGraphData({depRoot: nodeId});
        
        // show app tools
        thisRoute.appToolsView = thisRoute.appToolsView || new AppToolsView({model: thisRoute.appData.get("graphData"), appRouter: thisRoute});
        thisRoute.appToolsView.changeActiveELButtonFromName(pvt.viewMode);

        // should we re-render the view?
        doRender = keyNodeChanged
          || (pvt.viewMode === pLearnMode && typeof thisRoute.lview === "undefined")
          || (pvt.viewMode === pExploreMode && typeof thisRoute.eview === "undefined");

        if (typeof thisRoute.loadingView === "undefined"){
          thisRoute.loadingView = new LoadingView();
          loadViewRender = true;
        }
        // show loading view if new view is rendered
        if (doRender){
          thisRoute.showView(thisRoute.loadingView, loadViewRender, "#" + routeConsts.loadViewId);
        }

        var loadViz = typeof window.Viz === "undefined" && window.vizPromise === undefined,
            preLoadViz = paramsObj[qViewMode] === pExploreMode; // async start loading Viz before the view, else load after the view

        if (loadViz && preLoadViz){
          pvt.loadViz.call(thisRoute);
        }
        
        // check if/how we need to acquire more data from the server
        if(thisRoute.appData.get("graphData").get("nodes").length === 0){
          thisRoute.appData.fetch({
            success: postNodePop,
            error: function(emodel, eresp, eoptions){
              thisRoute.showErrorMessageView(pvt.routeConsts.ajaxErrorKey);
              ErrorHandler.reportAjaxError(eresp, eoptions, "ajax");
            }
          });
        }
        else{
          window.setTimeout(postNodePop, 10); // 10 ms delay for UI to update with loading view
        }

        // helper function to route change parameters appropriately
        // necessary because of AJAX calls to obtain new data
        function postNodePop() {
          try{
            ErrorHandler.assert(thisRoute.appData.get("graphData").get("nodes").length > 0,
            "Fetch did not populate graph nodes for fetch: " + nodeId);
          }
          catch(err){ 
            thisRoute.showErrorMessageView(pvt.routeConsts.noContentErrorKey, nodeId);
            return;
          }

          // set the document title to be the searched node
          document.title = thisRoute.appData.get("graphData").get("aux").getTitleFromId(nodeId)
            + " - Metacademy";
         
          switch (paramsObj[qViewMode]){
            case pExploreMode:
              if (doRender){
                thisRoute.eview = new ExploreView({model: thisRoute.appData.get("graphData"), appRouter: thisRoute});
              }
              thisRoute.showView(thisRoute.eview, doRender, "#" + routeConsts.eViewId);
          
              break;
            default:
              if (doRender){
                thisRoute.lview = new LearnView({model: thisRoute.appData.get("graphData"), appRouter: thisRoute});
              }
              thisRoute.showView(thisRoute.lview, doRender, "#" + routeConsts.lViewId);
              // only scroll to intended node on when lview is rerendered,
              // so that the user's scroll state is maintained when jumping between learn and explore view
              var paramQLearnScrollConcept = paramsObj[qLearnScrollConcept];
              if (paramQLearnScrollConcept && paramQLearnScrollConcept !== pvt.prevUrlParams[qLearnScrollConcept]){ 
                thisRoute.lview.scrollExpandToConcept(paramQLearnScrollConcept);
              }
          }
          pvt.prevUrlParams = $.extend({}, paramsObj);
          pvt.prevNodeId = nodeId;
          if (loadViz && !preLoadViz && window.vizPromise === undefined){
            pvt.loadViz.call(thisRoute);
          }
        }
      }
    });
  })();

});
