/**
 * This file contains the router and must be loaded after the models, collections, and views
 * FIXME this router has become tortuous -CJR
 */

// TODO normalize create/edit vocabulary

/*global define */
define(["backbone", "underscore", "jquery", "agfk/views/explore-graph-view", "base/views/concept-list-view", "agfk/views/concept-details-view","agfk/views/edit-tools-view", "agfk/models/explore-graph-model", "agfk/models/user-data-model", "base/utils/errors", "agfk/views/error-view", "gc/views/editor-graph-view", "gc/views/concept-editor-view", "colorbox"],
  function(Backbone, _, $, ExploreView, ConceptListView, ConceptDetailsView, AppToolsView, ExploreGraphModel, UserData, ErrorHandler, ErrorMessageView, EditorGraphView, ConceptEditorView){
  "use strict";

  /**
   * Central router to control URL state
   */
  return (function(){

    // define private methods and variables
    var pvt = {};

    // constants
    pvt.consts = {
      createName: "create", // /graphs/create <- url defines this value
      qViewMode: "mode",
      qFocusConcept: "focus",
      pExploreMode: "explore",
      pLearnMode: "learn",
      pEditMode: "edit",
      colorboxWidth: "80%",
      colorboxHeight: "75%",
      pCreateMode: "create",
      leftPanelId: "leftpanel,",
      rightPanelId: "rightpanel",
      lViewId: "learn-view-wrapper", // id for main learn view div
      createViewId: "gc-wrap",
      listWrapId: "concept-list-wrapper",
      expViewId: "explore-graph-view-wrapper", // id for main explore view div
      editViewId: "concept-editor-wrap",
      noContentErrorKey: "nocontent", // must also change in error-view.js
      ajaxErrorKey: "ajax", // must also change in error-view.js
      unsupportedBrowserKey: "unsupportedbrowser" // must also change in error-view.js
    };


    // return public object
    return Backbone.Router.extend({
      routes: function () {
          return {
            ":params": "routeParams",
            "": "routeParams"
          };
      },

      initialize: function(){
        var thisRoute = this;
        // url parameters
        thisRoute.prevUrlParams = {};

        // id of previous node in explore/learn view
        thisRoute.prevNodeId = undefined;

        // current view mode
        thisRoute.viewMode = -1;

        // previous parameter url
        thisRoute.prevPurl = -1;

        // keeps track of Explore to Learn and Learn to Explore clicks

        // first learning view transition
        thisRoute.firstLTrans = true;

        // default graph model
        thisRoute.GraphModel = ExploreGraphModel;

        // default mode
        thisRoute.defaultMode = pvt.consts.pLearnMode;

        thisRoute.postinitialize();
      },

      // override in subclass
      postinitialize: function(){},

      /**
       * Show the input view in the input selector and maintain a reference for correct clean up
       */
      showView: function (inView, doRender, selector, removeOldView, useColorBox) {
        var thisRoute = this;
        removeOldView = removeOldView === undefined ? true : removeOldView;

        // helper function for async rendering views
        // TODO move to private
        function swapViews(){
          if (thisRoute.currentView && removeOldView) {
            thisRoute.currentView.$el.parent().hide();
          }

          // FIXME this if/else structure is hiddeous -CJR (I wrote it)
          if (doRender){
            if (typeof selector === "string"){
              if (useColorBox){
                $.colorbox({inline: true,
                  href: inView.$el,
                  transition: "elastic",
                  width: pvt.consts.colorboxWidth,
                  height: pvt.consts.colorboxHeight,
                  onClosed: function(){
                    thisRoute.navigate(""); // TODO this may not always be true
                  }});
              } else {
                $(selector).html(inView.$el).show();
              }
            } else{
              window.document.body.appendChild(inView.el);
            }
          } else{
            if (useColorBox) {
              $.colorbox({inline: true, href: inView.$el, transition: "elastic", width: pvt.consts.colorboxWidth, height: pvt.consts.colorboxHeight});
            } else {
              inView.$el.parent().show();
            }
          }

          if (removeOldView){
            thisRoute.currentView = inView;
          }
        }

        if (doRender){
          inView.render();
        }

        inView.isViewRendered() ? swapViews() : inView.$el.on("viewRendered", function(){
          inView.$el.off("viewRendered");
          swapViews();
        });

        return inView;
      },

      /**
       * Parse the URL parameters
       */
      routeParams: function(params){
        var thisRoute = this,
            nodeName = window.location.href.split('/').pop().split('#').shift(),
            paramsObj = thisRoute.getParamsFromStr(params || ""),
            consts = pvt.consts;
        // default mode to learn view
        paramsObj[consts.qViewMode] = paramsObj[consts.qViewMode] || thisRoute.defaultMode;
        thisRoute.nodeRoute(nodeName, paramsObj);
      },

      /**
       * Change the URL parameters based on the paramObj input
       * paramObj: object of parameters to be set in URL
       * note: unprovided parameters remain unchanged
       */
      changeUrlParams: function(paramsObj){
        this.paramsToUrl($.extend({},  this.prevUrlParams, paramsObj));
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
        if (purl === this.prevPurl){
          this.routeParams(purl);
        } else {
          this.navigate(purl, {trigger: true, replace: false});
          this.prevPurl = purl;
        }
      },

      // /**
      //  * Change transfer-click state (boolean to indicate when explore (learn) view was directly accessed from a specific concept in the learn (explore) view
      //  */
      // setELTransition: function(state){
      //   this.elTransition = state;
      // },

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
            consts = pvt.consts,
            isCreating = nodeId === consts.createName,
            qViewMode = consts.qViewMode,
            qFocusConcept = consts.qFocusConcept,
            pExploreMode = consts.pExploreMode,
            pLearnMode = consts.pLearnMode,
            pEditMode = consts.pEditMode,
            pCreateMode = consts.pCreateMode,
            keyNodeChanged = !isCreating && nodeId !== thisRoute.prevNodeId,
            doRender;

        nodeId = isCreating ? undefined : nodeId;

        // set view-mode
        thisRoute.viewMode = paramsObj[qViewMode];
        var viewMode = thisRoute.viewMode;

        // init main app model
        if (!thisRoute.graphModel) {
          thisRoute.graphModel = new thisRoute.GraphModel(isCreating ? {} : {roots: [nodeId]});
        }

        if (!thisRoute.userModel) {
          var userModel = new UserData(window.agfkGlobals.userInitData, {parse: true});
          var aux = window.agfkGlobals.auxModel;
          isCreating || aux.setDepRoot(nodeId);
          aux.setUserModel(userModel);
          thisRoute.userModel = userModel;
        }

        // default rendering determined by edit mode
        doRender = isCreating;

        // check if/how we need to acquire more data from the server FIXME
        if(!thisRoute.graphModel.isPopulated()){
          thisRoute.graphModel.fetch({
            success: postNodePop,
            error: function(emodel, eresp, eoptions){
              thisRoute.showErrorMessageView(pvt.consts.ajaxErrorKey);
              ErrorHandler.reportAjaxError(eresp, eoptions, "ajax");
            }
          });
        }
        else{
          postNodePop();
        }

        // helper function to route change parameters appropriately
        // necessary because of AJAX calls to obtain new data
        function postNodePop() {
          try{
            !isCreating && ErrorHandler.assert(thisRoute.graphModel.get("nodes").length > 0,
                                               "Fetch did not populate graph nodes for fetch: " + nodeId);
          }
          catch(err){
            console.error(err.message);
            thisRoute.showErrorMessageView(pvt.consts.noContentErrorKey, nodeId);
            return;
          }

          // set the document title as the key concept
          if (!isCreating){
            document.title = thisRoute.graphModel.getNode(thisRoute.graphModel.get("roots")[0]).get("title") + " - Metacademy";
          } else {
            document.title = "Graph Creation - Metacademy";
          }

          // add the concept list view if it is not already present
          if (thisRoute.viewMode !== pCreateMode && !thisRoute.conceptListView && thisRoute.viewMode !== pEditMode) {
            thisRoute.conceptListView = new ConceptListView({model: thisRoute.graphModel, appRouter: thisRoute});
            $("#main").prepend(thisRoute.conceptListView.render().$el);
          }

          if (paramsObj[qFocusConcept] === undefined){
            paramsObj[qFocusConcept] = thisRoute.graphModel.getTopoSort().pop();
          }


          switch (viewMode){
          case pExploreMode:
            if (paramsObj[qFocusConcept] === undefined){
              paramsObj[qFocusConcept] = thisRoute.graphModel.getTopoSort().pop();
            }
            doRender = doRender || (thisRoute.viewMode === pExploreMode && typeof thisRoute.expView === "undefined");
            if (doRender){ // UPDATE
              thisRoute.expView = new ExploreView({model: thisRoute.graphModel, appRouter: thisRoute});
            }
            thisRoute.showView(thisRoute.expView, doRender, "#" + consts.expViewId);
            // center the graph display: flicker animation
            var fnode = thisRoute.graphModel.getNode( paramsObj[qFocusConcept]);
            thisRoute.expView.centerForNode(fnode);
            thisRoute.expView.setFocusNode(fnode);

            break;
          case pEditMode:
            doRender = true;
            thisRoute.editView = new ConceptEditorView({model: thisRoute.graphModel.getNode(paramsObj[qFocusConcept])});
            thisRoute.showView(thisRoute.editView, doRender, "#" + consts.editViewId, false, true);
            break;

          case pCreateMode:
            doRender = true;
            thisRoute.createView = thisRoute.createView
                                     || new EditorGraphView({model: thisRoute.graphModel, appRouter: thisRoute});
            thisRoute.showView(thisRoute.createView, doRender, "#" + consts.createViewId);
            break;

          case pLearnMode:
            if (paramsObj[qFocusConcept] === undefined){
              paramsObj[qFocusConcept] = thisRoute.graphModel.getTopoSort().pop();
            }
            if (!thisRoute.learnView || paramsObj[qFocusConcept] !== thisRoute.learnView.model.id ){
              // close the old learn view
              thisRoute.learnView && thisRoute.learnView.close();
              doRender = true;
              thisRoute.learnView = new ConceptDetailsView({model: thisRoute.graphModel.getNode(paramsObj[qFocusConcept]),
                                                            appRouter: thisRoute});
            }
            thisRoute.showView(thisRoute.learnView, doRender, "#" + consts.lViewId);

            break;

          default:
            console.error("Default mode reached in router -- this should not occur");
          }

          var paramQLearnConcept = paramsObj[qFocusConcept];
          if (!paramQLearnConcept){
            paramsObj[qFocusConcept] = nodeId;
            paramQLearnConcept = nodeId;
          }
          if (thisRoute.conceptListView) {
            thisRoute.conceptListView.changeSelectedTitle(paramsObj[qFocusConcept]);
            thisRoute.conceptListView.changeActiveELButtonFromName(viewMode);
          }

          if (viewMode === pCreateMode){
            thisRoute.appToolsView = thisRoute.appToolsView || new AppToolsView({model: thisRoute.graphModel, appRouter: thisRoute});
            thisRoute.appToolsView.render();
            thisRoute.appToolsView.$el.show();
            //thisRoute.appToolsView.setMode(thisRoute.viewMode);
          }

          // thisRoute.setELTransition(false); // reset the router state TODO is this still doing anything?
          thisRoute.prevUrlParams = $.extend({}, paramsObj);
          thisRoute.prevNodeId = nodeId;
        }
      },

      /**
       * Get key/value parameter object from string with key1=val1&key2=val2 format
       */
      getParamsFromStr: function(inStr){
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
      },

      getConstsClone: function(){
        return _.clone(pvt.consts);
      }
    });
  })();
});
