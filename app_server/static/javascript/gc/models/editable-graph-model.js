/*global define */
define(["jquery", "backbone", "dagre", "gc/collections/editable-edge-collection", "gc/collections/editable-node-collection", "base/models/graph-model"], function($, Backbone, dagre, EditableEdgeCollection, EditableNodeCollection, GraphModel){

  return GraphModel.extend({

    defaults:function(){
      return {
        nodes: new EditableNodeCollection(),
        edges: new EditableEdgeCollection(),
        graphDiscussion: ""
      };
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
    }
  });
});
