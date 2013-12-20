define(["backbone", "base/collections/edge-collection", "agfk/models/detailed-edge-model"], function(Backbone, EdgeCollection, DetailedEdgeModel){
  return  EdgeCollection.extend({
    model: DetailedEdgeModel
  });
});
