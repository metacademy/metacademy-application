/*
 This file contains the graph-data model
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
   * GraphData: model to store all graph related data
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
          options: new GraphOptionsModel()
        };
      },

      /**
       * initialize graph data (place parentModel field in child models)
       */
      initialize: function(){
        var nodes = this.get("nodes"),
            options = this.get("options");

        nodes.parentModel = this;
        options.parentModel = this;
      }
    });
  })();
});
