/*global define
 This file contains the node model, which contains the data for each concept TODO should this be renamed "concept-model"?
 */

define(["backbone", "underscore", "lib/kmap/collections/edge-collection"], function(Backbone, _, DirectedEdgeCollection){
  /**
   * Node: node model that encompasses several collections and sub-models
   */
  return  (function(){
    // maintain ancillary/user-specific info and fields in a private object
    var pvt = {};

    return Backbone.Model.extend({
      /**
       * all possible attributes are present by default
       */
      defaults: function() {
        return {
          title: "",
          id: "",
          dependencies: new DirectedEdgeCollection(),
          outlinks: new DirectedEdgeCollection()
        };
      },

      collFields: ["dependencies", "outlinks"],

      txtFields: ["id", "title"]

    });
  })();
});
