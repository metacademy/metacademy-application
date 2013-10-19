/*
 * This file contains the node collection
 */
define(['backbone', 'underscore', 'jquery', 'agfk/models/node-model'], function(Backbone, _, $, NodeModel){
  "use strict";
  
  /**
   * Collection of all node models in graph
   */
  return Backbone.Collection.extend({
    model: NodeModel,

    /**
     * parse incoming json data
     */
    parse: function(response){
    if (response.hasOwnProperty("titles")){
      window.agfkGlobals.auxModel.set("titles", response.titles);
    }
      var ents = [],
          nodes = response.hasOwnProperty("nodes") ? response.nodes : response;
      
      for (var key in nodes) {
        // place the server id in "sid" since all deps are returned in terms of the tag
        ents.push(_.extend(nodes[key],{sid: nodes[key].id, id: nodes[key].tag})); 
      }
      return ents;
    },

    /* Learning time estimate for the given node collection */
    getTimeEstimate: function(){
      var aux = window.agfkGlobals.auxModel,
          total = 0;
      
      this.each(function(node) {
        if (!aux.conceptIsLearned(node.id) && !node.getImplicitLearnStatus()) {
          if (node.get("time")) {
            total += node.get("time");
          } else {
            total += 1;     // reasonable guess when the time is unknown
          }
        }
      });
      return total;
    }
    
  });
});
