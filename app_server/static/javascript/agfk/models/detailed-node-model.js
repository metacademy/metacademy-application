
/*global define*/
define(["underscore", "lib/kmapjs/models/node-model", "agfk/collections/concept-resource-collection", "agfk/collections/detailed-edge-collection"], function(_, Node, ConceptResourceCollection, DetailedEdgeCollection){

  var DetailedNode = Node.extend({
    // FIXME these shouldn't be hardcoded
    collFields: ["dependencies", "outlinks", "resources"],

    txtFields: ["id", "exercises", "sid", "title", "summary", "goals", "pointers", "is_shortcut", "flags", "time", "x", "y", "isContracted", "software", "hasContractedDeps", "hasContractedOLs"],

    defaults: function(){
      var dnDefaults = {
        dependencies: new DetailedEdgeCollection(),
        outlinks: new DetailedEdgeCollection(),
        exercises: "",
        resources: new ConceptResourceCollection(),
        flags: [],
        useCsrf: true,
        goals: "",
        pointers: "",
        software: "",
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

    url: function () {
      // FIXME localhost hardcoded
      return 'http://127.0.0.1:8080/graphs/api/v1/concept/' + this.get("id") + "/";
    },

    /**
     *  parse the incoming server data
     */
    parse: function(resp, xhr) {
      var thisModel = this;
      // check if we have a null response from the server
      if (resp === null || xhr.parse == false) {
        return {};
      }
      var output = thisModel.defaults();

      // ---- parse the text values ---- //
      var i = thisModel.txtFields.length;
      while (i--) {
        var tv = thisModel.txtFields[i];
        if (resp[tv] !== undefined) {
          output[tv] = resp[tv];
        }
      }

      // ---- parse the collection values ---- //
      i = thisModel.collFields.length;
      while (i--) {
        var cv = thisModel.collFields[i];
        output[cv].parent = thisModel;
        if (resp[cv] !== undefined) {
          output[cv].add(resp[cv], {parse: true});
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
