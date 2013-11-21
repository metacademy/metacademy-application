define(["backbone", "underscore", "agfk/models/detailed-node-model", "gc/collections/editable-edge-collection"], function(Backbone, _, DetailedNodeModel, EditableEdgeCollection) {
  var EditableNode = DetailedNodeModel.extend({
    defaults: function() {
      var enDef = {
        x: 0,
        y: 0,
        isNew: 1,
        editNote: "",
        dependencies: new EditableEdgeCollection(),
        outlinks: new EditableEdgeCollection()
      };
      return _.extend({}, DetailedNodeModel.prototype.defaults(), enDef);
    },

    toJSON: function() {
      var thisModel = this,
          attrs = thisModel.attributes,
          attrib,
          retObj = {};
      
      // handle flat attributes
      for (attrib in attrs) {
        if (attrs.hasOwnProperty(attrib) && thisModel.collFields.indexOf(attrib) === -1) {
          retObj[attrib] = thisModel.get(attrib);
        }
      }
      
      // handle collection attributes (don't pass outlinks -- redundant)
      var dependencies = [];
      thisModel.get("dependencies").forEach(function(dep) {
        var tmpDep = {};
        tmpDep.source = dep.get("source").get("id");
        tmpDep.id = dep.id;
        tmpDep.reason = dep.get("reason");
        tmpDep.middlePts = dep.get("middlePts");
        dependencies.push(tmpDep);
      });
      retObj.dependencies = dependencies;
      retObj.resources = thisModel.get("resources").toJSON();
      retObj.questions = thisModel.get("questions").toJSON();

      return retObj;
    }
  });
  return EditableNode;
});
