/*global define */
define(["backbone", "underscore", "agfk/models/detailed-node-model", "gc/collections/editable-edge-collection"], function(Backbone, _, DetailedNodeModel, EditableEdgeCollection) {

  var EditableNode = (function(){

    var pvt = {};

    // private functions //

    return DetailedNodeModel.extend({
      collFields: ["dependencies", "outlinks", "resources", "goals"],

      txtFields: ["id", "sid", "title", "summary", "pointers", "is_shortcut", "flags", "time", "x", "y", "isNew", "editNote", "exercises", "software", "isContracted", "hasContractedDeps", "hasContractedOLs"], // FIXME this should inherit from superclass

      defaults: function() {
        var enDef = {
          isNew: 1,
          editNote: "",
          dependencies: new EditableEdgeCollection(),
          outlinks: new EditableEdgeCollection()
        };
        return _.extend({}, DetailedNodeModel.prototype.defaults(), enDef);
      }
    }); // end DetailedNodeModel.extend(
  })(); // end private function
  return EditableNode;
});
