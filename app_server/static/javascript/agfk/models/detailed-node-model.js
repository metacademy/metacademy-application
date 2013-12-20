/*global define*/
define(["underscore", "base/models/node-model", "base/collections/node-property-collections", "agfk/collections/detailed-edge-collection"], function(_, Node, NodePropertyCollections, DetailedEdgeCollection){

  var pvt = {};

  /**
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

  var DetailedNode = Node.extend({
    // FIXME these shouldn't be hardcoded
    collFields: ["questions", "dependencies", "outlinks", "resources"],

    txtFields: ["id", "sid", "title", "summary", "goals", "pointers", "is_shortcut", "flags", "time", "x", "y", "isContracted", "hasContractedDeps", "hasContractedOLs"],

    defaults: function(){
      var dnDefaults = {
        dependencies: new DetailedEdgeCollection(),
        outlinks: new DetailedEdgeCollection(),
        questions: new NodePropertyCollections.QuestionCollection(),
        resources: new NodePropertyCollections.ResourceCollection(),
        flags: [],
        goals: "",
        pointers: "",
        x: 0,
        y: 0,
        isContracted: false,
        hasContractedDeps: false,
        hasContractedOLs: false
      };
      return _.extend({}, Node.prototype.defaults(), dnDefaults);
    },

    /**
     * @return {boolean} true if the node is visible
     */
    isVisible: function(){
      return !this.get("isContracted"); // TODO add learned/hidden properties as well
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


  });

  return DetailedNode;
});
