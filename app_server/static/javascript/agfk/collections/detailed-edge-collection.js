/*global define*/
define(["backbone", "lib/kmap/js/collections/edge-collection", "agfk/models/detailed-edge-model"], function(Backbone, EdgeCollection, DetailedEdgeModel){
  return  EdgeCollection.extend({
    model: DetailedEdgeModel
  });
});
