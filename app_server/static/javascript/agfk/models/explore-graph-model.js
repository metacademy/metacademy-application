/*
 This file contains the graph-data model
 */
/*global define */
define(["jquery", "backbone", "underscore", "lib/kmapjs/models/graph-model", "agfk/collections/detailed-node-collection",  "agfk/collections/detailed-edge-collection", "utils/errors", "utils/utils"], function($, Backbone, _, GraphModel, DetailedNodeCollection, DetailedEdgeCollection, ErrorHandler, Utils){

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
        var thisModel = this;
        if (resp.id) {
          thisModel.set("id", resp.id);
        }

        if (xhr.parse == false) {
          return {};
        }

        var deps = [],
            nodes = resp.concepts,
            edges = resp.dependencies,
            nodeTag;

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
       * traverse the graph and determine the visibility of the nodes based on the goal relationships
       */
      setVisStatusFromGoals: function () {
        var thisModel = this;

        // get the leaves
        var toTraverse = thisModel.getNodes().filter(function (mdl) {
          return mdl.get("outlinks").length  == 0;
        });

        var visitedIds = {};
        var relevantGoals = {};
        _.each(toTraverse, function (mdl) {
          visitedIds[mdl.id] = 1;
          // all leaf goals are relevant by default  TODO allow for users to specify
          mdl.get("goals").each(function (goal) {
            relevantGoals[goal.id] = 1;
          });
        });

        // BFS
        while (toTraverse.length) {
          var node = toTraverse.shift(),
              hasGoals = node.get("goals").length > 0;
          node.get("dependencies").each(function(dep) {
            /* if any of the dep's target goals are in the relevantGoals
            // add the source goals to the relgoals list and add the node
             if it's not already present */
            var isRelDep = !hasGoals || dep.get("target_goals").some(function (tg) {
              return relevantGoals.hasOwnProperty(tg.id);
            });

            if (isRelDep) {
              dep.get("source_goals").each(function (sg) {
                relevantGoals[sg.id] = 1;
              });
              var src = dep.get("source");
              if (!visitedIds.hasOwnProperty(src.id)) {
                toTraverse.push(src);
                visitedIds[src.id] = 1;
              }
            }
          });
        }

        // set the vis status of all nodes not visited
        thisModel.getNodes().each(function (node) {
          if (!visitedIds.hasOwnProperty(node.id)) {
            node.set("notGoalRelevant", true);
          }
        });

        // TODO set a flag on all goals not in the goal list or store globally on aux?
        window.agfkGlobals.auxModel.relevantGoals = relevantGoals;
      },

      toJSON: function () {
        var thisModel = this,
            node_uris = [],
            edge_uris = [];
        this.get("nodes").each(function (node) {
          node_uris.push(node.url());
        });
        this.get("edges").each(function (edge) {
          edge_uris.push(edge.url());
        });

        return {
          concepts: node_uris,
          dependencies: edge_uris,
          id: this.get("id"),
          title: this.get("title")
        };
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
        thisModel.setVisStatusFromGoals();
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
      },

      setEdgeId: function (edge) {
        var src,
            tar,
            needsServerId;

        if (edge.set) {
          // edge is a backbone model
          src = edge.get("source");
          tar = edge.get("target");
          edge.set("id", String(src.id) + String(tar.id));
          edge.needsServerId = !src.hasServerId || !tar.hasServerId;
        } else {
          src = edge.source;
          tar = edge.target;
          edge.id = String(src.id) + String(tar.id);
          edge.needsServerId = !src.hasServerId || !tar.hasServerId;
        }
      }
    });
  })();
});
