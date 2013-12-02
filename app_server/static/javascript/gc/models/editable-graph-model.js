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

    // resource url
    url: "/gc/save", // FIXME

    /**
     * Make/extend this graph from a json obj
     *
     * @param {json object} jsonObj: json string with attribute:
     *   nodes: array of objects: each contains at least node title and id (optional coordinates) and dependencies
     * @return {backbone model} this model altered by the jsonObj (allows chaining)
     */
    addJsonNodesToGraph: function(jsonNodeArr) {

      var thisGraph = this,
          tmpEdges = [];

      jsonNodeArr.forEach(function(node) {
        node.dependencies.forEach(function(dep) {
          tmpEdges.push({source: dep.source, target: node.id, reason: dep.reason, middlePts: dep.middlePts, id: dep.id, isContracted: dep.isContracted});
        });
        node.dependencies = undefined;
        thisGraph.addNode(node);
      });

      // add edges
      tmpEdges.forEach(function(edge){
        thisGraph.addEdge.call(thisGraph, edge);
      });

      return this;
    },

    // FIXME should this always return true since we don't populate the graph?
    isPopulated: function(){
      return true;
    }
  });
});
