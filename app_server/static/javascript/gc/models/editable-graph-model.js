
/*global define */

define(["jquery", "backbone", "underscore", "dagre", "gc/collections/editable-edge-collection", "gc/collections/editable-node-collection", "agfk/models/explore-graph-model"], function($, Backbone, _, dagre, EditableEdgeCollection, EditableNodeCollection, ExploreGraphModel){

  return ExploreGraphModel.extend({

    defaults:function(){
      var exDef = {
        nodes: new EditableNodeCollection(),
        edges: new EditableEdgeCollection(),
        graphDiscussion: ""
      };
      return _.extend({}, ExploreGraphModel.prototype.defaults(), exDef);
    },

    // FIXME should this always return true since we don't populate the graph?
    isPopulated: function(){
      return true;
    }
  });
});
