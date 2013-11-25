define(["backbone", "underscore", "agfk/models/detailed-node-model", "gc/collections/editable-edge-collection"], function(Backbone, _, DetailedNodeModel, EditableEdgeCollection) {
  var EditableNode = DetailedNodeModel.extend({
    collFields: ["questions", "dependencies", "outlinks", "resources"],
    
    txtFields: ["id", "sid", "title", "summary", "goals", "pointers", "is_shortcut", "flags", "time", "x", "y", "isNew", "editNote", "isContracted", "hasContractedDeps"],

    defaults: function() {
      var enDef = {
        x: 0,
        y: 0,
        isContracted: false,
        hasContractedDeps: false, // FIXME should be clearer distinction with isContracted
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
        tmpDep.isContracted = dep.get("isContracted");
        dependencies.push(tmpDep);
      });
      retObj.dependencies = dependencies;
      retObj.resources = thisModel.get("resources").toJSON();
      retObj.questions = thisModel.get("questions").toJSON();

      return retObj;
    },

    /**
     * @return {boolean} true if the node is visible
     */
    isVisible: function(){
      return !this.get("isContracted");
    },

    /**
     * Node's deps should be contracted if it has > 0 outlinks that are all invisible
     *
     * @return {boolean} whether the node's deps should be contracted
     */
    depsShouldBeContracted: function(){
      var ols = this.get("outlinks");
      return ols.length && ols.every(function(ol){
        return ol.get("isContracted");
      });
    },

    /**
     * Contracts the dependencies of the node
     */
    contractDeps: function(notStart){
      if (!notStart){
        this.set("hasContractedDeps", true);
      }
      this.get("dependencies")
        .each(function(dep){          
          dep.set("isContracted", true);
          var srcNode = dep.get("source");
          if (srcNode.depsShouldBeContracted()){
            srcNode.set("isContracted", true);
            srcNode.set("hasContractedDeps", false);
            srcNode.contractDeps(true);
          }
        });
    },

    /**
     * Expands the dependencies of the node
     */
    expandDeps: function(notStart) {
      if (!notStart){
        this.set("hasContractedDeps", false);     
      }
      this.get("dependencies")
        .each(function(dep) {
          dep.set("isContracted", false);
          var srcNode = dep.get("source");
          if (srcNode.get("isContracted")) {
            srcNode.set("isContracted", false);
            srcNode.set("hasContractedDeps", false);
            srcNode.expandDeps(true);
          }
        });
    }    
  });
  return EditableNode;
});
