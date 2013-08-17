/*
 This file contains the graph-data model, which is a wrapper model for the nodes, edges, and auxiliary models
 */

window.define(["backbone", "agfk/collections/node-property-collections", "agfk/collections/node-collection"], function(Backbone, NodePropertyCollections, NodeCollection){

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
    var pvt = {};

    return Backbone.Model.extend({
      defaults: {
        depRoot: undefined,
        titles: {}
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
