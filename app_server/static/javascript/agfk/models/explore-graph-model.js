/*
 This file contains the graph-data model
 */
/*global define */
define(["backbone", "underscore", "base/models/graph-model", "base/collections/node-property-collections", "agfk/collections/detailed-node-collection",  "agfk/collections/detailed-edge-collection", "agfk/utils/errors"], function(Backbone, _, GraphModel, NodePropertyCollections, DetailedNodeCollection, DetailedEdgeCollection, ErrorHandler){

  /**
   * GraphOptionsModel: model to store graph display/interaction options
   * FIXME this is an awkward model
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
        return {
          nodes: new DetailedNodeCollection(),
          edges: new DetailedEdgeCollection(),
          options: new GraphOptionsModel()
        };
      }
    });
  })();
});
