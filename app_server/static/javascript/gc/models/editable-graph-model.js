define(["backbone", "gc/collections/editable-edge-collection", "gc/collections/editable-node-collection"], function(Backbone, EditableEdgeCollection, EditableNodeCollection){
  var EditableGraph = Backbone.Model.extend({
    defaults: {
      nodes: new EditableNodeCollection(),
      edges: new EditableEdgeCollection(),
      graphDiscussion: ""
    }
  });
  return EditableGraph;
});
