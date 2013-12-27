/*global define*/
define(["underscore", "lib/kmapjs/models/node-model", "agfk/collections/node-property-collections", "agfk/collections/detailed-edge-collection"], function(_, Node, NodePropertyCollections, DetailedEdgeCollection){

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
        hasContractedOLs: false,
        sid: "",
        summary: "",
        time: "",
        is_shortcut: 0
      };
      return _.extend({}, Node.prototype.defaults(), dnDefaults);
    },

    /**
     *  parse the incoming server data
     */
    parse: function(resp, xhr) {
      // check if we have a null response from the server
      if (resp === null) {
        return {};
      }
      var output = this.defaults();

      // ---- parse the text values ---- //
      var i = this.txtFields.length;
      while (i--) {
        var tv = this.txtFields[i];
        if (resp[tv] !== undefined) {
          output[tv] = resp[tv];
        }
      }

      // ---- parse the collection values ---- //
      i = this.collFields.length;
      while (i--) {
        var cv = this.collFields[i];
        output[cv].parent = this;
        if (resp[cv] !== undefined) {
          output[cv].add(resp[cv]);
        }
      }
      return output;
    },

    /**
     * intially populate the model with all present collection, boolean and text values
     * bind changes from collection such that they trigger changes in the original model
     */
    initialize: function() {
      var thisModel = this;

      // ***** Add private instance variable workaround ***** //
      // FIXME these need to be refactored given the new base inheritance structure
      var nodePvt = {};
      nodePvt.visible = false;
      nodePvt.implicitLearn = false;

      thisModel.setImplicitLearnStatus = function(status){
        if (nodePvt.implicitLearn !== status){
          nodePvt.implicitLearn = status;
          thisModel.trigger("change:implicitLearnStatus", thisModel.get("id"), thisModel.get("sid"), status);
        }
      };

      thisModel.isLearnedOrImplicitLearned = function(){
        return nodePvt.implicitLearn || window.agfkGlobals.auxModel.conceptIsLearned(thisModel.id);
      };

      thisModel.isLearned = function(){
        return window.agfkGlobals.auxModel.conceptIsLearned(thisModel.id);
      };

      thisModel.getImplicitLearnStatus = function(){
        return nodePvt.implicitLearn;
      };

      thisModel.getCollFields = function(){
        return thisModel.collFields;
      };

      thisModel.getTxtFields = function(){
        return thisModel.txtFields;
      };
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
    },

    /**
     * Returns the title to be displayed in the learning view
     */
    getLearnViewTitle: function(){
      var title = this.get("title") || this.id.replace(/_/g, " ");
      if (this.get("is_shortcut")) {
        title += " (shortcut)";
      }
      if (!this.isFinished()) {
        title += " (under construction)";
      }
      return title;
    },

    // TODO these methods might fit better on the node collection or aux
    getUnlearnedUniqueDeps: function(){
      return this.getUniqueDeps(true);
    },

    /**
     * Compute the list of outlinks to be displayed in the context section
     */
    computeNeededFor: function(){
      var nodes = this.collection, thisModel = this;

      var found = this.get("outlinks").filter(function(item){
        var node = nodes.findWhere({"id": item.get("to_tag")});
        if (!node) {
          return false;
        }
        return node.get("dependencies").findWhere({"from_tag": thisModel.get("id")});
      });

      return new DetailedEdgeCollection(found);
    },

    /**
     * Determine if the node is considered "finished," so we can give an "under"
     # construction" message otherwise.
     */
    isFinished: function(){
      return this.get("summary") && this.get("resources").length > 0;
    }


  });

  return DetailedNode;
});
