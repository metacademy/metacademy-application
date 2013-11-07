define(["backbone", "agfk/collections/directed-edge-collection", "gc/models/editable-edge-model"], function(Backbone, DirectedEdgeCollection, EditableEdge){
  var EditableEdgeCollection = DirectedEdgeCollection.extend({
    model: EditableEdge
  });
  return EditableEdgeCollection;
});
