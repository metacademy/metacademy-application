/*global define */
define(["backbone", "underscore", "agfk/models/detailed-node-model", "gc/collections/editable-edge-collection"], function(Backbone, _, DetailedNodeModel, EditableEdgeCollection) {

  var EditableNode = (function(){

    var pvt = {};

    // private functions //

    return DetailedNodeModel.extend({

      defaults: function() {
        var enDef = {
          dependencies: new EditableEdgeCollection(),
          outlinks: new EditableEdgeCollection()
        };
        return _.extend({}, DetailedNodeModel.prototype.defaults(), enDef);
      }
    }); // end DetailedNodeModel.extend(
  })(); // end private function
  return EditableNode;
});
