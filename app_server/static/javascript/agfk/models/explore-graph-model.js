/*
 This file contains the graph-data model
 */
/*global define */
define(["backbone", "underscore", "lib/kmapjs/models/graph-model", "agfk/collections/detailed-node-collection",  "agfk/collections/detailed-edge-collection", "utils/errors"], function(Backbone, _, GraphModel, DetailedNodeCollection, DetailedEdgeCollection, ErrorHandler){

  /**
   * GraphOptionsModel: model to store graph display/interaction options
   * FIXME this is an awkward model and the logic belongs in a view! --
   * CR: Aye- but it handles state information for the graph that dictates several views,
   * also, if we add more settings/options we'll place them here
   */
  var GraphOptionsModel =  (function(){
    return Backbone.Model.extend({
      defaults:{
        showLearnedConcepts: true
      },

      /**
       * helper function to set the showLearnedConcepts and fire appropriate change events when "changing" from false to false
       * (i.e. clearing the newly learned concepts)
       */
      setLearnedConceptsState: function(state){
        if (state === this.get("showLearnedConcepts") && state === false){
          this.trigger("change");
          this.trigger("change:showLearnedConcepts");
        }
        else{
          this.set("showLearnedConcepts", state);
        }
      }
    });
  })();

  /**
   * GraphData: model to store all graph related data
   */
  return (function(){
    var pvt = {};
    return GraphModel.extend({
      /**
       * default user states
       */
      defaults: function(){
        var enDef = {
          nodes: new DetailedNodeCollection(),
          edges: new DetailedEdgeCollection(),
          options: new GraphOptionsModel()
        };
        return _.extend({}, GraphModel.prototype.defaults(), enDef);
      },

      parse: function(resp, xhr){
        if (xhr.parse == false) {
          return {};
        }

        var thisModel = this,
            deps = [],
            nodes = resp.concepts,
            edges = resp.dependencies,
            nodeTag;

        if (resp.id) {
          thisModel.set("id", resp.id);
        }
        if (resp.title) {
          thisModel.set("title", resp.title);
        }

        // parse is called before initialize - so these aren't guaranteed to be present
        if (resp.hasOwnProperty("leafs")) {
          thisModel.set("leafs", resp.leafs);
        }
        if (!thisModel.get("edges")){
          thisModel.set("edges", thisModel.defaults().edges);
          thisModel.edgeModel = thisModel.get("edges").model;
        }
        if (!thisModel.get("nodes")){
          thisModel.set("nodes", thisModel.defaults().nodes);
          thisModel.nodeModel = thisModel.get("nodes").model;
        }

        for (nodeTag in nodes) {
          if (nodes.hasOwnProperty(nodeTag)) {
            var tmpNode = nodes[nodeTag];
            tmpNode.sid = tmpNode.id;
            thisModel.addNode(tmpNode);
          }
        }
        if (edges) {
          edges.forEach(function(dep){
            // convert source/target uri to id
            dep.source = dep.source.split("concept/")[1].slice(0,-1);
            dep.target = dep.target.split("concept/")[1].slice(0,-1);
            thisModel.addEdge(dep);
          });
        }
        return thisModel.attributes;
      },

      /**
       * @Override
       */
      postinitialize: function () {
        // setup listeners
        var thisModel = this,
            aux = window.agfkGlobals && window.agfkGlobals.auxModel;
        // Implicit learned listeners
        if (aux) {
          thisModel.listenTo(aux, aux.getConsts().learnedTrigger, thisModel.changeILNodes);
        }
        thisModel.changeILNodes();
      },

      changeILNodes: function () {
        var thisModel = this,
            depLeafs = thisModel.get("leafs"),
            aux = window.agfkGlobals && window.agfkGlobals.auxModel,
            reachableNodeIds = [];

        if (!aux) return;

        depLeafs.forEach(function(depLeaf){
          // perform dfs from leaf node
          reachableNodeIds = _.union(reachableNodeIds, aux.dfsFromNode(thisModel.getNode(depLeaf), true));
        });
        thisModel.getNodes().each(function(node){
          if (reachableNodeIds.indexOf(node.id) > -1){
            node.setImplicitLearnStatus(false);
          } else {
            node.setImplicitLearnStatus(!aux.conceptIsLearned(node.id));
          }
        });
      },

      getNodeByTag: function (tag) {
        return this.get("nodes").findWhere({tag: tag});
      }
    });
  })();
});
