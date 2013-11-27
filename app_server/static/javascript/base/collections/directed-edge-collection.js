define(["backbone", "base/models/edge-model"], function(Backbone, DirectedEdge){
  var DirectedEdgeCollection = Backbone.Collection.extend({
    model: DirectedEdge
  });
  return DirectedEdgeCollection;
});
