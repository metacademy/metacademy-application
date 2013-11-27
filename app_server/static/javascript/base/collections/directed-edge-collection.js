define(["backbone", "base/models/directed-edge-model"], function(Backbone, DirectedEdge){
  var DirectedEdgeCollection = Backbone.Collection.extend({
    model: DirectedEdge
  });
  return DirectedEdgeCollection;
});
