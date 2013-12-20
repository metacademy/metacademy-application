/**
 * This file contains the node collection
 * it is a basic collection that should not depend on aux
 */

/*global define */
define(['backbone', 'underscore', 'jquery', 'base/models/node-model'], function(Backbone, _, $, NodeModel){
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
      // set aux if present (does not induce a strict dependency)
      if (window.agfkGlobals && window.agfkGlobals.auxModel && response.hasOwnProperty("titles")){
        window.agfkGlobals.auxModel.set("titles", response.titles);
      }

      var ents = [],
          nodes = response.hasOwnProperty("nodes") ? response.nodes : response;

      for (var key in nodes) {
        // place the server id in "sid" since all deps are returned in terms of the tag
        ents.push(_.extend(nodes[key],{sid: nodes[key].id, id: nodes[key].tag}));
      }
      return ents;
    }
  });
});
