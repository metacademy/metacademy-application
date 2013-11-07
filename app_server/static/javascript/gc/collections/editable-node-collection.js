define(["backbone", "agfk/collections/detailed-node-collection", "gc/models/editable-node-model"], function(Backbone, DetailedNodeCollection, EditableNode){
  var EditableNodeCollection = DetailedNodeCollection.extend({
    model: EditableNode
  });
  return EditableNodeCollection;
});
