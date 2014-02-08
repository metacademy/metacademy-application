/*global define */
define(["backbone", "underscore", "agfk/models/detailed-node-model", "gc/collections/editable-edge-collection"], function(Backbone, _, DetailedNodeModel, EditableEdgeCollection) {

  var EditableNode = (function(){

    var pvt = {};

    // private functions //

    return DetailedNodeModel.extend({
      collFields: ["dependencies", "outlinks", "resources"],

      txtFields: ["id", "sid", "title", "summary", "goals", "pointers", "is_shortcut", "flags", "time", "x", "y", "isNew", "editNote", "exercises", "software", "isContracted", "hasContractedDeps", "hasContractedOLs"], // FIXME this should inherit from superclass

      defaults: function() {
        var enDef = {
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
          var tmpDep = {},
              src = dep.get("source"),
              tar = dep.get("target");
          tmpDep.id = dep.id;
          tmpDep.source_id = src.get("sid")|| src.get("id");
          tmpDep.reason = dep.get("reason");
          dependencies.push(tmpDep);
        });
        retObj.dependencies = dependencies;
        retObj.resources = thisModel.get("resources").toJSON();

        return retObj;
      }
    }); // end DetailedNodeModel.extend(
  })(); // end private function
  return EditableNode;
});
