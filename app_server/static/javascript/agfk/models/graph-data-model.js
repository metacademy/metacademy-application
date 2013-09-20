/*
 This file contains the graph-data model, which is a wrapper model for the nodes, edges, and auxiliary models
 */

define(["backbone", "underscore", "agfk/collections/node-property-collections", "agfk/collections/node-collection", "agfk/models/node-model", "agfk/utils/errors"], function(Backbone, _, NodePropertyCollections, NodeCollection, NodeModel, ErrorHandler){

  /**
   * GraphOptionsModel: model to store graph display/interaction options
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
   * GraphAuxModel: model to store all auxiliary graph information
   */
  var GraphAuxModel = (function(){

    // private data obj
    var pvt = {
      dependencies: {},
      timeEstimates: {},
      shortcutDependencies: {},
      loadedGraph: false,
      DEFAULT_LEARNING_TIME: 1
    };

    return Backbone.Model.extend({
      defaults: {
        depRoot: undefined,
        titles: {},
        nodes: new NodeCollection(),
        shortcuts: new NodeCollection()
      },

      url: window.CONTENT_SERVER + '/full_graph',

      /**
       * parse data from server
       */
      parse: function(resp, xhr){
        if (resp === null){
          return {};
        }
        var retObj = this.attributes;
        if (resp.hasOwnProperty("nodes")) {
          var nodesObj = _.map(resp.nodes, function(node) {
            var temp = _.extend(node, {"id": node.tag, "sid": node.id});
            return new NodeModel(temp, {parse: true});
          });
          retObj["nodes"] = new NodeCollection(nodesObj);
        }
        if (resp.hasOwnProperty("shortcuts")) {
          var shortcutsObj = _.map(resp.shortcuts, function(node) {
            var temp = _.extend(node, {"id": node.tag, "sid": node.id});
            return new NodeModel(temp, {parse: true});
          });
          retObj["shortcuts"] =  new NodeCollection(shortcutsObj);
        }
        pvt.loadedGraph = true;
        return retObj;        
      },

      /**
       * Reset learning time estimates
       */
      resetEstimates: function(){
        pvt.dependencies = {};
        pvt.timeEstimates = {};
        pvt.shortcutDependencies = {};
        this.trigger("reset:estimates");
      },

      /**
       * Returns true if userData attribute of app-model contains the concept for the input tag (note: must convert tag to server id)
       */
      conceptIsLearned: function(tag){
        var learnedConcepts = this.parentModel.parentModel.get("userData").get("learnedConcepts"),
            node = this.get("nodes").get(tag);
        if (!node){
          return false;
        }
        return learnedConcepts.get(node.get("sid"));
      },

      /**
       * Finds the unlearned dependencies of a concept with tag 'tag' 
       */
      computeDependencies: function(tag, isShortcut){
        var nodes = this.get("nodes"),
            shortcuts = this.get("shortcuts"),
            thisModel = this,
            node,
            dependenciesObj;

        if (isShortcut && shortcuts.get(tag)) {
          node = shortcuts.get(tag);
          dependenciesObj = pvt.shortcutDependencies;
        } else if (nodes.get(tag)) {
          node = nodes.get(tag);
          dependenciesObj = pvt.dependencies;
        } else {
          // shouldn't happen
          return [];
        }

        if (dependenciesObj.hasOwnProperty(tag)) {
          return dependenciesObj[tag];
        }
        
        var result = [];
        dependenciesObj[tag] = result;     // so that we don't get into an infinite loop if there's a cycle


        node.get("dependencies").each(function(dep) {
          var currDep = {'from_tag': dep.get("from_tag"), 'shortcut': dep.get("shortcut")};
          if (!thisModel.conceptIsLearned(dep.get("from_tag"))) {
            result = _.union(result, [currDep], thisModel.computeDependencies(dep.get("from_tag"), dep.get("shortcut")));
            result = _.unique(result, false, function(dep) { return dep.from_tag + ':' + dep.shortcut; });
          }
        });

        dependenciesObj[tag] = result;
        return result;
      },

      /**
       * Computes the learning time estimate for concept with tag 'tag'
       * Uses a DFS to compute the learning time estimate
       * Concepts without a learning time estimate are currently given a default value of 1 hour
       */
      computeTimeEstimate: function(tag){
        var fullGraph = this.get("fullGraph"),
            nodes = this.get("nodes"),
            shortcuts = this.get("shortcuts"),
            node = nodes.get(tag),
            DEFAULT_LEARNING_TIME = pvt.DEFAULT_LEARNING_TIME;

        if (!node) {
          return '';
        }

        if (!(tag in pvt.timeEstimates)) {
          var deps = this.computeDependencies(tag, 0);

          // eliminate redundant shortcuts
          deps = _.filter(deps, function(dep) {
            if (dep.shortcut) {
              var found = _.where(deps, {"from_tag": dep.from_tag, "shortcut": 0});
              return found.length == 0;
            }
            return true;
          });

          var total = 0;
          _.each(deps, function(dep) {
            var depShortcut = shortcuts.get(dep.from_tag),
                depNode = nodes.get(dep.from_tag);
            if (dep.shortcut && depShortcut && depShortcut.get("time")) {
              total += depShortcut.get("time");
            } else if (depNode && depNode.get("time")) {
              total += depNode.get("time");
            } else {
              total += DEFAULT_LEARNING_TIME;
            }
          });

          if (node.get("time")) {
            total += node.get("time");
          } else {
            total += DEFAULT_LEARNING_TIME;
          }

          pvt.timeEstimates[tag] = total;
        }
        
        return pvt.timeEstimates[tag];
      },

      /**
       * Get node display title from id
       */
      getTitleFromId: function(nid){
        return this.get("titles")[nid]; 
      }
    });
  })();
  
  /**
   * GraphData: model to store all graph related data (nodes, edges, aux data)
   */
  return (function(){
    var pvt = {};
    return Backbone.Model.extend({
      /**
       * default user states
       */
      defaults: function(){
        return {
          nodes: new NodeCollection(),
          edges: new NodePropertyCollections.GraphEdgeCollection(),
          aux: new GraphAuxModel(),
          options: new GraphOptionsModel()
        };
      },

      /**
       * initialize graph data (place parentModel field in child models)
       */
      initialize: function(){
        var nodes = this.get("nodes"),
            edges = this.get("edges"),
            aux = this.get("aux"),
            options = this.get("options");

         aux.fetch({
           reset: true,
           error: function(emodel, eresp, eoptions){
                 ErrorHandler.reportAjaxError(eresp, eoptions, "ajax");
           }
         });
        
        nodes.parentModel = this;
        edges.parentModel = this;
        aux.parentModel = this;
        options.parentModel = this;
      }
    });
  })();
});
