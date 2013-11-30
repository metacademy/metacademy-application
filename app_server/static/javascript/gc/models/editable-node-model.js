/*global define */
define(["backbone", "underscore", "agfk/models/detailed-node-model", "gc/collections/editable-edge-collection"], function(Backbone, _, DetailedNodeModel, EditableEdgeCollection) {

  var EditableNode = (function(){

    var pvt = {};

    // private functions //

    /*
     * determines whether the node should be contracted given the edges state
     */
    pvt.nodeShouldBeContracted = function(edgeType){
      var edges = this.get(edgeType);
      return edges.length && edges.every(function(edge){
        return edge.get("isContracted");
      });
    };

    // expand from a node FIXME: DRY with contractFromNode
    pvt.expandFromNode = function(notStart, hasContractedEdgesName, edgeType, edgeEnding){
      if (!notStart){
        this.set(hasContractedEdgesName, false);
      }
      this.get(edgeType)
        .each(function(dep) {
          dep.set("isContracted", false);
          var srcNode = dep.get(edgeEnding);
          if (srcNode.get("isContracted")) {
            srcNode.set("isContracted", false);
            srcNode.set(hasContractedEdgesName, false);
            pvt.expandFromNode.call(srcNode, true, hasContractedEdgesName, edgeType, edgeEnding);
          }
        });
    };

    // contract from a node
    pvt.contractFromNode = function(notStart, hasContractedEdgesName, edgeType, otherEdgeType, edgeEnding){
      if (!notStart){
        this.set(hasContractedEdgesName, true);
      }
      this.get(edgeType)
        .each(function(edge){
          edge.set("isContracted", true);
          var srcNode = edge.get(edgeEnding);
          if (pvt.nodeShouldBeContracted.call(srcNode, otherEdgeType)){
            srcNode.set("isContracted", true);
            srcNode.set(hasContractedEdgesName, false);
            pvt.contractFromNode.call(srcNode, true, hasContractedEdgesName, edgeType, otherEdgeType, edgeEnding);
          }
        });
    };


    return DetailedNodeModel.extend({
      collFields: ["questions", "dependencies", "outlinks", "resources"],

      txtFields: ["id", "sid", "title", "summary", "goals", "pointers", "is_shortcut", "flags", "time", "x", "y", "isNew", "editNote", "isContracted", "hasContractedDeps", "hasContractedOLs"], // FIXME this should inherit from superclass

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
       * Node's deps should be contracted if it has > 0 outlinks that are all invisible
       *
       * @return {boolean} whether the node's deps should be contracted
       */
      depNodeShouldBeContracted: function(){
        return pvt.nodeShouldBeContracted.call(this, "outlinks");
      },

      /**
       * Node's outlinks should be contracted if it has > 0 deps that are all invisible
       *
       * @return {boolean} whether the node's outlinks should be contracted
       */
      olNodeShouldBeContracted: function(){
        return pvt.nodeShouldBeContracted.call(this, "dependencies");
      },

      /**
       * Contracts the dependencies of the node
       */
      contractDeps: function(notStart){
          pvt.contractFromNode.call(this, notStart, "hasContractedDeps", "dependencies", "outlinks", "source");
      },

      /**
       * Expands the dependencies of the node
       */
      expandDeps: function(notStart) {
        pvt.expandFromNode.call(this, notStart, "hasContractedDeps", "dependencies", "source");
      },

      contractOLs: function(notStart){
          pvt.contractFromNode.call(this, notStart, "hasContractedOLs", "outlinks", "dependencies", "target");
      },

      expandOLs: function(notStart){
        pvt.expandFromNode.call(this, notStart, "hasContractedOLs", "outlinks", "target");
      }
    }); // end DetailedNodeModel.extend(
  })(); // end private function
  return EditableNode;
});
