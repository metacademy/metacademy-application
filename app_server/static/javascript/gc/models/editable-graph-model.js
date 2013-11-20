define(["backbone", "gc/collections/editable-edge-collection", "gc/collections/editable-node-collection"], function(Backbone, EditableEdgeCollection, EditableNodeCollection){
  var EditableGraph = Backbone.Model.extend({
    defaults: {
      nodes: new EditableNodeCollection(),
      edges: new EditableEdgeCollection(),
      graphDiscussion: ""
    },
    
    // resource url
    url: "/gc/save", // FIXME

    /**
     * Make/extend this graph from a json obj 
     *
     * @param {json object} jsonObj: json string with attributes:
     *   nodes: array of objs:
     *     each contains at least node title and id (optional coordinates)
     *   edges: array of objs:
     *     each contains at least a source node id and target node id (optional path coordinates)
     * @param {boolean} addToExisting: optional parameter to add the json object to the existing graph
     * @return {backbone model} this model altered by the jsonObj (allows chaining)
     */
    genGraphFromJsonObj: function(jsonObj, addToExisting) {
      addToExisting = addToExisting || false;
      // TODO: put it here?

      return this;
    },

    /**
     * Export this graph to a simple json representation
     *
     * @return {json object}: simple json object representation of this graph
     *   that can be directly converted into a string
     */
    toJSON: function() {
      return this.toJSON(); // FIXME
    },

    /**
     * Get a node from the graph with the given id
     *
     * @param {node id} nodeId: the node id of the desired node
     * @return {node} the desired node object or undefined if not present
     */
    getNode: function(nodeId){
      return this.get("nodes").get(nodeId);
    },

    /**
     * Get an edge from the graph with the given id
     *
     * @param {edge id} edgeId: the edge id of the desired edge
     * @return {edge} the desired edge object or undefined if not present
     */
    getEdge: function(edgeId){
      return this.get("edges").get(edgeId);
    },

    /**
     * Add an edge to the graph: adds the edge to the edge collection and
     * outlinks/dependencies properties in the appropriate nodes
     *
     * @param {edge object} edge: the edge to be added to the model
     */
    addEdge: function(edge) {
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
      node.get("dependencies").forEach(function(edge){ thisGraph.removeEdge(edge);});
      node.get("outlinks").forEach(function(edge){ thisGraph.removeEdge(edge);});
      nodes.remove(node);
      
    }
    
  });
  return EditableGraph;
});
