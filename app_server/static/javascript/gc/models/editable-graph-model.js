define(["backbone", "gc/collections/editable-edge-collection", "gc/collections/editable-node-collection", "gc/models/editable-node-model"], function(Backbone, EditableEdgeCollection, EditableNodeCollection, EditableNode){
  var EditableGraph = Backbone.Model.extend({
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

      // FIXME: arrays are not being parsed to collections when uploading graphs
      var thisGraph = this,
          tmpEdges = [];
      
      jsonNodeArr.forEach(function(node) {
        node.dependencies.forEach(function(dep) {
          tmpEdges.push({source: dep.source, target: node.id, reason: dep.reason, middlePts: dep.middlePts, id: dep.id});
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

    /**
     * Export this graph to a simple json representation
     *
     * @return {json object}: simple json object representation of this graph
     *   that can be directly converted into a string
     */
    toJSON: function() {
      // returning nodes AND edges is redundant, since nodes contain dep info
      return this.get("nodes").toJSON(); 
    },

    /**
     * Get a node from the graph with the given id
     *
     * @param {node id} nodeId: the node id of the desired node
     * @return {node} the desired node object or undefined if not present
     */
    getNode: function(nodeId) {
      return this.get("nodes").get(nodeId);
    },

    /**
     * Get an edge from the graph with the given id
     *
     * @param {edge id} edgeId: the edge id of the desired edge
     * @return {edge} the desired edge object or undefined if not present
     */
    getEdge: function(edgeId) {
      return this.get("edges").get(edgeId);
    },

    /**
     * Add an edge to the graph: adds the edge to the edge collection and
     * outlinks/dependencies properties in the appropriate nodes
     *
     * @param {edge object} edge: the edge to be added to the model
     */
    addEdge: function(edge) {
      // check if source/target are ids and switch to nodes if necessary
      edge.source = typeof edge.source === "number" ? this.getNode(edge.source) : edge.source;
      edge.target = typeof edge.target === "number" ? this.getNode(edge.target) : edge.target;

      if (!edge.source  || !edge.target) {
        throw new Error("source or target was not given correctly for input or does not exist in graph");
      }
      
      var edges = this.get("edges");
      edges.add(edge);
      var mEdge = edges.get(edge.id);
      edge.source.get("outlinks").add(mEdge);
      edge.target.get("dependencies").add(mEdge);        
    },

    /**
     * Add a node to the graph
     *
     * @param {node object} node: the node to be added to the model
     */
    addNode: function(node) {
      if (! (node instanceof EditableNode)){
        node = new EditableNode(node, {parse: true});
      }
      this.get("nodes").add(node);
    },

    /**
     * Removes an edge from the graph: removes the edge from the edge collection
     * and appropriate outlinks/dependencies properties in the appropriate nodes
     *
     * @param {edge-id or edge object} edge: the edge id or edge object
     */
    removeEdge: function(edge) {
      var edges = this.get("edges");
      edge = typeof edge === "number" ? edges.get(edge) : edge;
      edge.get("source").get("outlinks").remove(edge);
      edge.get("target").get("dependencies").remove(edge);
      edges.remove(edge);
    },

    /**
     * Removes the node from the graph and all edges that were in its dependencies/outlinks attributes
     *
     * @param {node id or node object} node: the node id or node object to be removed
     */
    removeNode: function(node){
      var thisGraph = this,
          nodes = this.get("nodes");
      node = typeof node === "number" ? nodes.get(node) : node;
      node.get("dependencies").pluck("id").forEach(function(edgeId){ thisGraph.removeEdge(edgeId);});
      node.get("outlinks").pluck("id").forEach(function(edgeId){ thisGraph.removeEdge(edgeId);});
      nodes.remove(node);      
    }
    
  });
  return EditableGraph;
});
