
/*global define */

define(["jquery", "backbone", "underscore", "dagre", "gc/collections/editable-edge-collection", "gc/collections/editable-node-collection", "agfk/models/explore-graph-model"], function($, Backbone, _, dagre, EditableEdgeCollection, EditableNodeCollection, ExploreGraphModel){

  return ExploreGraphModel.extend({

    defaults:function(){
      var exDef = {
        nodes: new EditableNodeCollection(),
        edges: new EditableEdgeCollection(),
        title: "Graph Title"
      };
      return _.extend({}, ExploreGraphModel.prototype.defaults(), exDef);
    },

    // TODO sync title/discussion with server

    isPopulated: function(){
      return true;
    }
  });
});
