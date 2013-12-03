window.define(["jquery", "backbone", "underscore", "agfk/routers/router", "gc/views/editor-graph-view", "gc/models/editable-graph-model", "gc/views/concept-editor-view", "agfk/views/explore-graph-view", "agfk/models/explore-graph-model"], function($, Backbone, _, AGFKRouter, EditableGraphView, EditableGraphModel, ConceptEditorView, ExploreGraphView, ExploreGraphModel){

  var pvt = {};
  pvt.consts = AGFKRouter.prototype.getConstsClone();

  return AGFKRouter.extend({
  /**
   * @Override
   */
  postinitialize: function() {
    var thisRoute = this;
    thisRoute.defaultMode = pvt.consts.pCreateMode;
    thisRoute.GraphModel = EditableGraphModel;
  }
  });
});
