/*
 This file contains the graph-data model
 */
/*global define */
define(["backbone", "underscore", "base/models/graph-model", "agfk/collections/node-property-collections", "agfk/collections/detailed-node-collection",  "agfk/collections/detailed-edge-collection", "base/utils/errors"], function(Backbone, _, GraphModel, NodePropertyCollections, DetailedNodeCollection, DetailedEdgeCollection, ErrorHandler){

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

      url: function(){
        var root = this.get("roots")[0] || this.fetchTag;
        if (!root){
          throw new Error("Must set graph root in graph-model to fetch graph data");
        }
        return window.CONTENT_SERVER + "/dependencies?concepts=" + this.get("roots")[0];
      },

      parse: function(resp, xhr){
        var thisGraph = this,
            deps = [],
            nodes = resp.nodes,
            nodeTag;
        for (nodeTag in nodes) {
          if (nodes.hasOwnProperty(nodeTag)) {
            var tmpNode = nodes[nodeTag];
            tmpNode.sid = tmpNode.id;
            tmpNode.id = nodeTag;

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
      },

      /**
       * @Override
       */
      postinitialize: function () {
        // setup listeners
        var thisGraph = this,
            aux = window.agfkGlobals && window.agfkGlobals.auxModel;
        // Implicit learned listeners
        if (aux) {
          thisGraph.listenTo(aux, aux.getConsts().learnedTrigger, thisGraph.changeILNodesFromTag);
        }
        thisGraph.on("sync", function(){
          thisGraph.changeILNodesFromTag();
        });
      },

      /**
       * DFS to change the implicit learned status of the dependencies of rootTag
       * TODO does not have test coverage
       */
      changeILNodesFromTag: function(){
        // TODO cache learned/implicit learned nodes
        var thisGraph = this,
            nodes = thisGraph.getNodes(),
            aux = window.agfkGlobals && window.agfkGlobals.auxModel,
            depRoots = thisGraph.get("roots");

        if (!aux) return;

        depRoots.forEach(function(depRoot){
          var isShortcut = nodes.get(depRoot).get("is_shortcut"),
              unlearnedDepTags = _.map(aux.computeUnlearnedDependencies(depRoot, isShortcut), function(tagO){return tagO.from_tag;});
          nodes.each(function(node){
            if (unlearnedDepTags.indexOf(node.id) > -1){
              node.setImplicitLearnStatus(false);
            } else if (node.id !== depRoot){
              node.setImplicitLearnStatus(!aux.conceptIsLearned(node.id));
            }
          });
        });
      }

    });
  })();
});
