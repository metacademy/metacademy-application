/*global define */
define(["backbone", "lib/kmap/models/edge-model"], function(Backbone, DirectedEdge){
  return  Backbone.Collection.extend({
    model: DirectedEdge
  });
});
