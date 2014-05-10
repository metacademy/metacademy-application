/**
 * This file contains the router and must be loaded after the models, collections, and views
 * FIXME this router has become tortuous -CJR
 */

// TODO normalize create/edit vocabulary

/*global define */
define(["backbone", "underscore", "jquery", "agfk/views/explore-graph-view", "agfk/views/agfk-concept-list-view", "agfk/views/concept-details-view","agfk/views/edit-tools-view", "agfk/models/explore-graph-model", "agfk/models/user-data-model", "utils/errors", "agfk/views/error-view", "gc/views/editor-graph-view", "gc/views/concept-editor-view", "colorbox"],
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
             qViewMode: "mode",
             qFocusConcept: "focus",
             pExploreMode: "explore",
             pLearnMode: "learn",
             pEditMode: "edit",
             pCreateMode: "create",
             leftPanelId: "leftpanel,",
             rightPanelId: "rightpanel",
             lViewId: "learn-view-wrapper", // id for main learn view div
             createViewId: "gc-wrap",
             listWrapId: "concept-list-wrapper",
             expViewId: "graph-view-wrapper", // id for main explore view div
             editViewId: "concept-editor-wrap",
             noContentErrorKey: "nocontent", // must also change in error-view.js
             ajaxErrorKey: "ajax", // must also change in error-view.js
             unsupportedBrowserKey: "unsupportedbrowser" // must also change in error-view.js
           };

           pvt.colorboxOptions = {inline: true,
                                  transition: "elastic",
                                  width: "80%",
                                  height: "95%",
                                  closeButton: false,
                                  opacity: 0.6
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
               var thisRoute = this,
                   prevPath = thisRoute.prevPath || "";
               removeOldView = removeOldView === undefined ? true : removeOldView;

               if (useColorBox) {
                 pvt.colorboxOptions.href = inView.$el;
                 pvt.colorboxOptions.onClosed = function () {
                   thisRoute.navigate(prevPath);
                   thisRoute.prevPath = prevPath; // incase event is not fired
                 };
               }

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
                       $.colorbox(pvt.colorboxOptions);
                     } else {
                       $(selector).html(inView.$el).show();
                     }
                   } else{
                     window.document.body.appendChild(inView.el);
                   }
                 } else{
                   if (useColorBox) {
                     $.colorbox(pvt.colorboxOptions);
                   } else {
                     inView.$el.parent().show();
                   }
                 }

                 if (removeOldView){
                   thisRoute.currentView = inView;
                 }
                 thisRoute.prevPath = window.location.hash.substr(1);
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
                   targetId = window.agfkGlobals.targetId,
                   paramsObj = thisRoute.getParamsFromStr(params || ""),
                   consts = pvt.consts;
               // default mode to learn view
               paramsObj[consts.qViewMode] = paramsObj[consts.qViewMode] || thisRoute.defaultMode;
               paramsObj[consts.qFocusConcept] = paramsObj[consts.qFocusConcept] || targetId;
               thisRoute.nodeRoute(targetId, paramsObj);
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
             nodeRoute: function(targetNodeId, paramsObj) {
               var thisRoute = this,
                   consts = pvt.consts,
                   isCreating = window.agfkGlobals.isCreating,
                   qViewMode = consts.qViewMode,
                   qFocusConcept = consts.qFocusConcept,
                   pExploreMode = consts.pExploreMode,
                   pLearnMode = consts.pLearnMode,
                   pEditMode = consts.pEditMode,
                   pCreateMode = consts.pCreateMode,
                   keyNodeChanged,
                   doRender,
                   fNodeTag,
                   fnode;

               keyNodeChanged = !isCreating && targetNodeId !== thisRoute.prevNodeId;
               targetNodeId = isCreating ? undefined : targetNodeId;

               // set view-mode
               thisRoute.viewMode = paramsObj[qViewMode];
               var viewMode = thisRoute.viewMode;

               if (!thisRoute.userModel) {
                 var userModel = new UserData(window.agfkGlobals.userInitData, {parse: true});
                 var aux = window.agfkGlobals.auxModel;
                 aux.setUserModel(userModel);
                 thisRoute.userModel = userModel;
               }

               // init main app model
               if (!thisRoute.graphModel) {
                 thisRoute.graphModel = new thisRoute.GraphModel(_.extend(window.agfkGlobals.graphInitData, {leafs: isCreating ? null : [targetNodeId]}), {parse: true});
               }

               var graphModel = thisRoute.graphModel;

               if (graphModel.getNodes().length) {
                 // determine focus id or tag
                 if (!paramsObj[qFocusConcept]) {
                   var tsort = thisRoute.graphModel.getTopoSort();
                   paramsObj[qFocusConcept] = tsort[tsort.length - 1];
                   targetNodeId = paramsObj[qFocusConcept];
                 }
                 // get ids/tags labeled correctly since user can pass in either
                 fNodeTag = paramsObj[qFocusConcept];
                 fnode = graphModel.getNode(fNodeTag);
                 if (fnode) {
                   fNodeTag = fnode.get("tag");
                 } else {
                   fnode = graphModel.getNodeByTag(fNodeTag);
                   paramsObj[qFocusConcept] = fnode.id;
                 }
               }

               // shorthand
               var fNodeId = paramsObj[qFocusConcept];

               // set the leafs
               graphModel.set("leafs", [targetNodeId]);

               // default rendering determined by edit mode
               try{
                 !isCreating &&
                   ErrorHandler.assert(graphModel.get("nodes").length > 0,
                   "Fetch did not populate graph nodes for fetch: " + targetNodeId);
               }
               catch(err){
                 console.error(err.message);
                 thisRoute.showErrorMessageView(pvt.consts.noContentErrorKey, targetNodeId);
                 return;
               }

               // set the document title as the key concept
               if (!isCreating){
                 document.title = fnode.get("title") + " - Metacademy";
               } else {
                 document.title = "Graph Creation - Metacademy";
               }

               // add the concept list view if it is not already present and if not disallowed by a global var
               if (thisRoute.viewMode !== pCreateMode && !thisRoute.conceptListView && thisRoute.viewMode !== pEditMode) {
                 thisRoute.conceptListView = new ConceptListView({model: graphModel, appRouter: thisRoute});
                 $("#main").prepend(thisRoute.conceptListView.render().$el);
               }

               // always render if creating
               doRender = isCreating;

               switch (viewMode){
               case pExploreMode:
                 doRender = doRender || (thisRoute.viewMode === pExploreMode && typeof thisRoute.expView === "undefined");
                 if (doRender){ // UPDATE
                   thisRoute.expView = new ExploreView({model: graphModel, appRouter: thisRoute, includeShortestOutlink: true });
                 }
                 thisRoute.showView(thisRoute.expView, doRender, "#" + consts.expViewId);

                 if (doRender || viewMode !== thisRoute.prevUrlParams[qViewMode]) {
                   // center the graph display: flicker animation
                   thisRoute.expView.centerForNode(fnode);
                   thisRoute.expView.setFocusNode(fnode);
                 }
                 break;

               case pEditMode:
                 doRender = true;
                 thisRoute.editView = new ConceptEditorView({model: fnode});
                 thisRoute.showView(thisRoute.editView, doRender, "#" + consts.editViewId, false, true);
                 break;

               case pCreateMode:
                 doRender = true;
                 thisRoute.createView = thisRoute.createView
                   || new EditorGraphView({model: graphModel, appRouter: thisRoute});
                 if (graphModel.get("nodes").length) {
                   thisRoute.createView.optimizeGraphPlacement();
                 }
                 thisRoute.showView(thisRoute.createView, doRender, "#" + consts.createViewId);
                 fnode && thisRoute.createView.centerForNode(fnode);
                 break;

               case pLearnMode:
                 if (!thisRoute.learnView || thisRoute.prevUrlParams[qFocusConcept] !== fNodeId){
                   // close the old learn view
                   thisRoute.learnView && thisRoute.learnView.close();
                   doRender = true;
                   thisRoute.learnView = new ConceptDetailsView({model: graphModel.getNode(fNodeId) || graphModel.getNodeByTag(fNodeId),
                                                                 appRouter: thisRoute});
                 }
                 thisRoute.showView(thisRoute.learnView, doRender, "#" + consts.lViewId);
                 break;

               default:
                 console.error("Default mode reached in router -- this should not occur");
               }

               if (thisRoute.conceptListView) {
                 thisRoute.conceptListView.changeSelectedTitle(fNodeId);
                 thisRoute.conceptListView.changeActiveELButtonFromName(viewMode);
               }

               if (viewMode === pCreateMode){
                 thisRoute.appToolsView = thisRoute.appToolsView || new AppToolsView({model: thisRoute.graphModel, appRouter: thisRoute});
                 thisRoute.appToolsView.render();
                 thisRoute.appToolsView.$el.show();
               }

               thisRoute.prevUrlParams = $.extend({}, paramsObj);
               thisRoute.prevNodeId = targetNodeId;
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
