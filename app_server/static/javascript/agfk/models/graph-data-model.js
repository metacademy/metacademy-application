/*
 This file contains the graph-data model, which is a wrapper model for the nodes, edges, and auxiliary models
 */

define(["backbone", "agfk/collections/node-property-collections", "agfk/collections/node-collection"], function(Backbone, NodePropertyCollections, NodeCollection){

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

    // private data (not currently used)
    var pvt = {
      dependencies: {},
      timeEstimates: {},
      loadedGraph: false,
    };

    return Backbone.Model.extend({
      defaults: {
        depRoot: undefined,
        titles: {},
        fullGraph: {},
      },

      initialize: function(){
        var url = window.CONTENT_SERVER + '/full_graph',
            thisModel = this;
        $.get(url, function(data) {
          thisModel.set("fullGraph", data);
        });
        pvt.loadedGraph = true;
      },

      resetEstimates: function(){
        pvt.dependencies = {};
        pvt.timeEstimates = {};
      },

      conceptIsLearned: function(tag){
        var learnedConcepts = this.parentModel.parentModel.get("userData").get("learnedConcepts"),
            fullGraph = this.get("fullGraph"),
            id = fullGraph[tag].id;
        return learnedConcepts.findWhere({id: id});
      },

      computeDependencies: function(tag){
        var fullGraph = this.get("fullGraph"),
            thisModel = this;
            

        if (pvt.dependencies.hasOwnProperty(tag)) {
          return;
        }
        if (!fullGraph.hasOwnProperty(tag)) {
          return;
        }
        pvt.dependencies[tag] = [];    // so we don't get in an infinite loop if there are cycles
        deps = fullGraph[tag].dependencies;
        _.each(deps, function(dep) {
          if (!(fullGraph.hasOwnProperty(dep))) {
            return;
          }
          if (thisModel.conceptIsLearned(tag)){
            return;
          }
          thisModel.computeDependencies(dep);
          if (pvt.dependencies.hasOwnProperty(dep)) {
            pvt.dependencies[tag] = _.union(pvt.dependencies[tag], pvt.dependencies[dep], [dep]);
          }
        });
      },

      computeTimeEstimate: function(tag){
        var fullGraph = this.get("fullGraph");
        if (!(tag in fullGraph)) {
          return '';
        }
        if (!(tag in pvt.timeEstimates)) {
          if (!(tag in pvt.dependencies)) {
            this.computeDependencies(tag);
          }
          
          var total = 0;
          _.each(pvt.dependencies[tag], function(dep) {
            if (dep in fullGraph && fullGraph[dep].time) {
              total += fullGraph[dep].time;
            } else {
              total += 1;
            }
          });

          if (fullGraph[tag].time) {
            total += fullGraph[tag].time;
          } else {
            total += 1;
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
        this.get("nodes").parentModel = this;
        this.get("edges").parentModel = this;
        this.get("aux").parentModel = this;
        this.get("options").parentModel = this;
      }
    });
  })();
});
