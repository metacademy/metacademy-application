window.define(["jquery", "backbone", "underscore", "agfk/routers/router", "gc/views/editor-graph-view", "gc/models/editable-graph-model", "gc/views/concept-editor-view", "agfk/views/explore-graph-view", "agfk/models/explore-graph-model"], function($, Backbone, _, AGFKRouter, EditableGraphView, EditableGraphModel, ConceptEditorView, ExploreGraphView, ExploreGraphModel){

  var pvt = {};
  pvt.consts = AGFKRouter.prototype.getConstsClone();

  return AGFKRouter.extend({
    // routes: function() {
    //   var eroutes = {"": "showGCEditor"
    //                 };
    //   // "preview": "previewGraph",
    //   //            "edit=:nodeid": "openEditorView"

    //   return _.extend(AGFKRouter.prototype.routes(), eroutes);
    // },
  /**
   * @Override
   */
  postinitialize: function() {
    var thisRoute = this;
    thisRoute.defaultMode = pvt.consts.pCreateMode;
    thisRoute.GraphModel = EditableGraphModel;
  }
    // routeParams: function (params) {
    //   var thisRoute = this,
    //       paramsObj = thisRoute.getParamsFromStr(params || ""),
    //       consts = pvt.consts;
    //   paramsObj[consts.qViewMode] = paramsObj[consts.qViewMode] || consts.pCreateMode;
    //   thisRoute.nodeRoute(null, paramsObj);
    // }
  });
});


//     // function to handle non-ge-view switching
//     showView: function(view){
//       var thisRoute = this;

//       // remove/hide old views safely
//       thisRoute.removeOtherView();
//       if (thisRoute.geView){
//         thisRoute.geView.$el.hide();
//       }

//       // set/show given view
//       thisRoute.currentView = view;
//       thisRoute.currentView.render();
//       var $wrapEl = $("#concept-editor-wrap");
//       $wrapEl.append(thisRoute.currentView.el);
//       $wrapEl.show();
//       thisRoute.currentView.$el.show();
//     },

//     removeOtherView: function(){
//       var thisRoute = this;
//       if (thisRoute.currentView){
//         thisRoute.currentView.$el.parent().hide();
//         thisRoute.currentView.remove(); // must implement remove function TODO do we want to always remove the view?
//       }
//       thisRoute.currentView = null;
//     },

//     showGCEditor: function(){
//       // set editor param
//     },
//       var thisRoute = this;

//       thisRoute.removeOtherView();
//       if (!thisRoute.geModel) {
//         thisRoute.geModel = new EditableGraphModel();
// //        thisRoute.geModel.addServerDepGraphToGraph("adaptive_rejection_sampling");
//       }
//       thisRoute.geView = this.geView || new EditableGraphView({model: thisRoute.geModel});
//       thisRoute.geView.render();
//       thisRoute.geView.$el.show();
//     },

//     previewGraph: function () {
//       var thisRoute = this;
//       if (thisRoute.geModel) {
//         thisRoute.gePreviewView = new ExploreGraphView({model: thisRoute.geModel});
//         thisRoute.showView(thisRoute.gePreviewView);
//       }
//       // thisRoute.removeOtherView();
//       //thisRoute.gePreviewModel = new ExploreGraphModel();
//       // thisRoute.gePreviewModel.addDataFromEditorModel(thisRoute.geModel);

//       // and pass the graph to it ?
//     },

//     openEditorView: function(concept_id){
//       var thisRoute = this;
//       thisRoute.geModel = thisRoute.geModel || new EditableGraphModel();
//       var model = thisRoute.geModel.getNode(concept_id);
//       if (model){
//         var editorView = new ConceptEditorView({model: model});
//         thisRoute.showView(editorView);
//       }
//     }

//   });
//});
