window.define(["jquery", "backbone", "dagre", "gc/collections/editable-edge-collection", "gc/collections/editable-node-collection", "gc/models/editable-node-model", "gc/models/editable-edge-model"], function($, Backbone, dagre, EditableEdgeCollection, EditableNodeCollection, EditableNode, EditableEdge){
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
     * TODO only grab a single node
     */
    addServerNodeToGraph: function() {

    },

    /**
     * Add dependency graph from server to the current graph
     * TODO handle id problems
     */
    addServerDepGraphToGraph: function(tag) {
      var thisGraph = this;
      $.getJSON(window.CONTENT_SERVER + "/dependencies?concepts=" + tag, function(resp){
        var deps = [],
            nodes = resp.nodes,
            nodeTag;
        for (nodeTag in nodes) {
          if (nodes.hasOwnProperty(nodeTag)) {
            var tmpNode = nodes[nodeTag];
            tmpNode.sid = tmpNode.id;
            tmpNode.id = nodeTag;
            
            // contract the incoming graph
            tmpNode.isContracted = true;
            if (tag === tmpNode.tag) {
              tmpNode.x = 100;
              tmpNode.y = 100;
              tmpNode.hasContractedDeps = true;
              tmpNode.isContracted = false;
            }

            // parse deps separately (outlinks will be readded)
            tmpNode.dependencies.forEach(function(dep){
              deps.push({source: dep.from_tag, target: dep.to_tag, reason: dep.reason, isContracted: true});
            });
            delete tmpNode.dependencies;
            delete tmpNode.outlinks;
            thisGraph.addNode(tmpNode);
          }
        }
        deps.forEach(function(dep){
          thisGraph.addEdge(dep);
        });        
        thisGraph.trigger("loadedServerData"); 
      })
      .fail(function(){
        console.err("Unable to obtain dependency graph for " + tag); // FIXME
      });
    },

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
     * Optimize graph placement using dagre
     *
     * @param nodeWidth <number>: the width in px of each node
     * @param <boolean> minSSDist: whether to miminize the squared distance of the
     * nodes moved in the graph by adding the mean distance moved in each direction -- defaults to true
     * @param <id> noMoveNodeId: node id of node that should not move during optimization
     * note: noMoveNodeId has precedent over minSSDist
     */
    optimizePlacement: function(nodeWidth, minSSDist, noMoveNodeId) {

      var thisGraph = this,
          dagreGraph = new dagre.Digraph(),
          nodeHeight = nodeWidth,
          nodes = thisGraph.get("nodes"),
          edges = thisGraph.get("edges"),
          transX = 0,
          transY = 0;

      minSSDist = minSSDist === undefined ? true : minSSDist;
      
      // input graph into dagre
      nodes.filter(function(n){return n.isVisible();}).forEach(function(node){
        dagreGraph.addNode(node.id, {width: nodeWidth*2, height: nodeHeight});
      });

      edges.filter(function(e){return e.isVisible();}).forEach(function(edge){
        dagreGraph.addEdge(edge.id, edge.get("source").id, edge.get("target").id);
      });

      var layout = dagre.layout()
            .rankSep(100)
            .nodeSep(20)
            .rankDir("BT").run(dagreGraph);

      // determine average x and y movement
      if (noMoveNodeId === undefined && minSSDist) {
        layout.eachNode(function(n, inp){
          var node = nodes.get(n);
          transX +=  node.get("x") - inp.x;
          transY += node.get("y") - inp.y;
        });
        transX /= nodes.length;
        transY /= nodes.length;        
      }

      else if (noMoveNodeId !== undefined) {
        var node = nodes.get(noMoveNodeId),
            inp = layout._strictGetNode(noMoveNodeId);
        transX = node.get("x") - inp.value.x;
        transY = node.get("y") - inp.value.y;
      }

      layout.eachEdge(function(e, u, v, value) {
        var addPts = [];
        value.points.forEach(function(pt){
          addPts.push({x: pt.x + transX, y: pt.y + transY});
        });
        edges.get(e).set("middlePts",  addPts); // plen > 1 ? value.points : []);//value.points.splice(0, -1);
      });

      layout.eachNode(function(n, inp){
        var node = nodes.get(n);
        node.set("x", inp.x + transX);
        node.set("y", inp.y + transY);
      });
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
      edge.source =  edge.source instanceof EditableEdge ? edge.source : this.getNode(edge.source);
      edge.target = edge.target instanceof EditableEdge ? edge.target : this.getNode(edge.target);

      if (!edge.source  || !edge.target) {
        throw new Error("source or target was not given correctly for input or does not exist in graph");
      }

      if (edge.id === undefined) {
        edge.id = String(edge.source.id) + String(edge.target.id);
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
      edge = edge instanceof EditableEdge ? edge : edges.get(edge);
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
      node =  node instanceof EditableNode ? node : nodes.get(node);
      node.get("dependencies").pluck("id").forEach(function(edgeId){ thisGraph.removeEdge(edgeId);});
      node.get("outlinks").pluck("id").forEach(function(edgeId){ thisGraph.removeEdge(edgeId);});
      nodes.remove(node);      
    }
  });
  return EditableGraph;



});
