
/*global define*/
define(["backbone", "agfk/collections/detailed-edge-collection", "gc/models/editable-edge-model"], function(Backbone, DetailedEdgeCollection, EditableEdge){
  return DetailedEdgeCollection.extend({
    model: EditableEdge
  });
});
