define(["backbone", "base/models/edge-model"], function(Backbone, DirectedEdge){
  return  Backbone.Collection.extend({
    model: DirectedEdge
  });
});
