define(["backbone", "agfk/collections/node-collection", "gc/models/editable-node-model"], function(Backbone, NodeCollection, EditableNode){
  var EditableNodeCollection = NodeCollection.extend({
    model: EditableNode
  });
  return EditableNodeCollection;
});
