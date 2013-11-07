define(["backbone", "underscore", "agfk/models/detailed-node-model", "gc/collections/editable-edge-collection"], function(Backbone, _, DetailedNodeModel, EditableEdgeCollection){
  var EditableNode = DetailedNodeModel.extend({
    defaults: function(){
      var enDef = {
        x: 0,
        y: 0,
        isNew: 1,
        editNote: "",
        dependencies: new EditableEdgeCollection(),
        outlinks: new EditableEdgeCollection()
      };
      return _.extend({}, DetailedNodeModel.prototype.defaults, enDef);
    }
  });
  return EditableNode;
});
