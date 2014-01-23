
/*global define */

define(["jquery", "backbone", "underscore", "dagre", "gc/collections/editable-edge-collection", "gc/collections/editable-node-collection", "agfk/models/explore-graph-model"], function($, Backbone, _, dagre, EditableEdgeCollection, EditableNodeCollection, ExploreGraphModel){

  return ExploreGraphModel.extend({

    defaults:function(){
      var exDef = {
        nodes: new EditableNodeCollection(),
        edges: new EditableEdgeCollection(),
        title: "New Graph Title",
        id: window.agfkGlobals.graphId
      };
      return _.extend({}, ExploreGraphModel.prototype.defaults(), exDef);
    },

    url: function () {
    // TODO fix urls hack - make API consistent once it's migrated
    if (this.useOldUrl) {
      this.useOldUrl = false;
      var leaf = this.get("leafs")[0] || this.fetchTag;
      if (!leaf){
        throw new Error("Must set graph leaf in graph-model to fetch graph data");
      }
      return window.CONTENT_SERVER + "/dependencies?concepts=" + leaf;
    }
      return "http://127.0.0.1:8080/graphs/api/v1/graph/" + this.id + "/";
    },

    isPopulated: function(){
      return true;
    }
  });
});
