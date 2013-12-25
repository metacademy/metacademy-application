/*global define*/
define(["backbone", "agfk/collections/detailed-node-collection", "gc/models/editable-node-model"], function(Backbone, NodeCollection, EditableNode){
  var EditableNodeCollection = NodeCollection.extend({
    model: EditableNode
  });
  return EditableNodeCollection;
});
