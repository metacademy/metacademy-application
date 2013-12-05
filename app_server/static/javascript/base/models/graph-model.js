/*global define */
define(["jquery", "underscore", "backbone", "base/collections/edge-collection", "base/collections/node-collection", "base/models/node-model", "base/models/edge-model"], function($, _, Backbone, BaseEdgeCollection, BaseNodeCollection){
  var pvt = {};

  pvt.alwaysTrue = function(){return true;};

  return Backbone.Model.extend({

    defaults: function(){
      return {
        root: null, // TODO make this more general (multiple roots)
        edges: new BaseEdgeCollection(),
        nodes: new BaseNodeCollection()
      };
    },

    initialize: function(){
      this.edgeModel = this.get("edges").model;
      this.nodeModel = this.get("nodes").model;
      this.postinitialize();
    },

    url: function(){
      var root = this.get("root");
      if (!root){
        throw new Error("Must set graph root in graph-model to fetch graph data");
      }
      return window.CONTENT_SERVER + "/dependencies?concepts=" + this.get("root");
    },

    parse: function(resp, xhr){
      var thisGraph = this,
          deps = [],
          nodes = resp.nodes,
          tag = this.get("root"),
          nodeTag;
      for (nodeTag in nodes) {
        if (nodes.hasOwnProperty(nodeTag)) {
          var tmpNode = nodes[nodeTag];
          tmpNode.sid = tmpNode.id;
          tmpNode.id = nodeTag;

          // contract the incoming graph
          // tmpNode.isContracted = true; // FIXME this is specific to editable-graph-model (how to generalize?)
//          if (tag === tmpNode.tag) {
            tmpNode.x = 400; // TODO come up with better solution
            tmpNode.y = 100;
            // tmpNode.hasContractedDeps = true;
            // tmpNode.isContracted = false;
//          }

          // parse deps separately (outlinks will be readded)
          tmpNode.dependencies.forEach(function(dep){
            deps.push({source: dep.from_tag, target: dep.to_tag, reason: dep.reason, from_tag: dep.from_tag, to_tag: dep.to_tag});
          });
          delete tmpNode.dependencies;
          delete tmpNode.outlinks;
          thisGraph.addNode(tmpNode);
        }
      }
      deps.forEach(function(dep){
        thisGraph.addEdge(dep);
      });
      //thisGraph.optimizePlacement();
      // thisGraph.trigger("loadedServerData"); // TODO use "sync" events instead (they're standard)
    },

    // override in subclass
    postinitialize: function(){},

    /**
     * TODO only grab a single node (where would we use this?)
     */
    addServerNodeToGraph: function() {

    },

    /**
     * Add dependency graph from server to the current graph
     * TODO handle id problems
     */
    addServerDepGraphToGraph: function(tag) {
      // FIXME this should be integrated into the fetch role -- this is hacky!
      var thisGraph = this;
      $.getJSON(window.CONTENT_SERVER + "/dependencies?concepts=" + tag, thisGraph.parse);
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
     * @return <boolean> true if the graph is populated
     */
     isPopulated: function(){
       return this.getEdges().length > 0 || this.getNodes().length > 0;
     },

    /**
     * @param stNode: the start node
     * @param endNode: the end node
     * @param checkFun: an optional function that dermines whether an edge
     * is valid (e.g. an "is visible" function --defaults to a tautological function)
     * @return <boolean> true if there is a directed path from stNode to endNode (follows outlinks from stNode)
     */
    isPathBetweenNodes: function (stNode, endNode, checkFun) {
      var thisGraph = this,
          outlinks = stNode.get("outlinks");
      checkFun = checkFun || pvt.alwaysTrue;
      // DFS recursive search
      return outlinks.length > 0
        && outlinks.any(function(ol){
          var olTar = ol.get("target");
          return checkFun(ol) && (olTar.id === endNode.id || thisGraph.isPathBetweenNodes(olTar, endNode, checkFun));
        });
    },

    /**
     * Checks if an edge is transitive by performing a DFS on it's source
     *
     * @param edge: the edge to be checked
     * @param checkFun: a function that returns a boolean value indiciating
     * whether a given edge should be counted in the traversal
     * (e.g. an "is visible" function --defaults to a tautological function)
     * @return <boolean> true if the edge is transitive
     */
    checkIfTransitive: function(edge, checkFun){
      var thisGraph = this,
          edgeSource = edge.get("source"),
          edgeTarget = edge.get("target");
      checkFun = checkFun || pvt.alwaysTrue;
      return edgeSource.get("outlinks").any(
        function(ol){
          return edge.id !== ol.id && thisGraph.isPathBetweenNodes(ol.get("target"), edgeTarget, checkFun);
        });
    },

    /**
     * Get a nodes from the graph
     *
     * @return {node collection} the node collection of the model
     */
    getNodes: function() {
      return this.get("nodes");
    },

    /**
     * Get a edges from the graph
     *
     * @return {edge collection} the edge collection of the model
     */
    getEdges: function() {
      return this.get("edges");
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
      var thisGraph = this;
      // check if source/target are ids and switch to nodes if necessary
      edge.source =  edge.source instanceof thisGraph.nodeModel ? edge.source : this.getNode(edge.source);
      edge.target = edge.target instanceof thisGraph.nodeModel ? edge.target : this.getNode(edge.target);

      if (!edge.source  || !edge.target) {
        throw new Error("source or target was not given correctly for input or does not exist in graph");
      }

      if (edge.id === undefined) {
        edge.id = String(edge.source.id) + String(edge.target.id);
      }

      // check if this edge is transitive
      // (will be transitive if there is already a path from the edge source to the edge target)
      edge.isTransitive = thisGraph.isPathBetweenNodes(edge.source, edge.target);

      // check if the new edge changes transitivity of other edges FIXME this is a trivial check

      if (!edge.isTransitive) {
        thisGraph.getEdges().filter(function(e){return !e.get("isTransitive");}).forEach(function(notTransEdge){
          var isTrans = thisGraph.checkIfTransitive(notTransEdge);
          if (isTrans){
            notTransEdge.set("isTransitive", true);
          }
        });
      }

      //
      var edges = thisGraph.getEdges();
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
      var thisGraph = this;
      if (!(node instanceof thisGraph.nodeModel )){
        node = new thisGraph.nodeModel(node, {parse: true});
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
      var thisGraph = this,
          edges = thisGraph.get("edges");

      edge = edge instanceof thisGraph.edgeModel ? edge : edges.get(edge);
      edge.get("source").get("outlinks").remove(edge);
      edge.get("target").get("dependencies").remove(edge);
      edges.remove(edge);

      // possibly change transitivity relationships of transitive edges
      edges.filter(function(e){return e.get("isTransitive");}).forEach(function(transEdge){
        var isTrans = thisGraph.checkIfTransitive(transEdge);
        if (!isTrans){
          transEdge.set("isTransitive", false);
        }
      });
    },

    /**
     * Removes the node from the graph and all edges that were in its dependencies/outlinks attributes
     *
     * @param {node id or node object} node: the node id or node object to be removed
     */
    removeNode: function(node){
      var thisGraph = this,
          nodes = this.get("nodes");
      node =  node instanceof thisGraph.nodeModel ? node : nodes.get(node);
      node.get("dependencies").pluck("id").forEach(function(edgeId){ thisGraph.removeEdge(edgeId);});
      node.get("outlinks").pluck("id").forEach(function(edgeId){ thisGraph.removeEdge(edgeId);});
      nodes.remove(node);
    },

    /**
     * Compute the learning view ordering (topological sort)
     * TODO write tests for getTopoSort FIXME
     */
      getTopoSort: function(){
        var thisGraph = this;
        if (!thisGraph.topoSort){
            thisGraph.doTopoSort();
        }
        return thisGraph.topoSort;
      },

    doTopoSort: function () {
              // TODO cache the sort
        var thisGraph = this,
            nodes = thisGraph.getNodes(),
            traversedNodes = {}, // keep track of traversed nodes
            startRootNodes;

        // init: obtain node tags with 0 outlinks (root nodes)
          startRootNodes = _.map(nodes.filter(function(mdl){
            return mdl.get("outlinks").length == 0;
          }), function(itm){
            return itm.get("id");
          });

        thisGraph.topoSort = dfsTopSort(startRootNodes);

        // recursive dfs topological sort
        // TODO this should be defined in pvt?
        function dfsTopSort (rootNodeTags, prevRootTag){
          var curRootNodeTagDepth,
              returnArr = [],
              rootNodeRoundArr = [],
              curRootNodeTag,
              unqDepTags,
              curNode;

          // recurse on the input root node tags
          // -- use edge weight to do the ordering if available
          for(curRootNodeTagDepth = 0; curRootNodeTagDepth < rootNodeTags.length; curRootNodeTagDepth++){
            curRootNodeTag = rootNodeTags[curRootNodeTagDepth];
            curNode = nodes.get(curRootNodeTag);
            if (!traversedNodes.hasOwnProperty(curRootNodeTag)){
              if (prevRootTag) {
                thisGraph.getEdge(curRootNodeTag + prevRootTag).isTopoEdge = true; // mark topological edges
              }
              unqDepTags = curNode.getUniqueDeps();
              if (unqDepTags.length > 0){
                returnArr = returnArr.concat(dfsTopSort(unqDepTags, curRootNodeTag));
              }
              returnArr.push(curRootNodeTag);
              traversedNodes[curRootNodeTag] = 1;
            }
          }
          return returnArr;
        };
    },

    /**
     * Check if the input edge is present in the topological sort
     */
    isEdgeInTopoSort: function(edge){
      var thisGraph = this;
      // make sure we've done a topological sort
      if (!thisGraph.topoSort){
        thisGraph.doTopoSort();
      }
      return edge.isTopoEdge;
    }
  });
});
