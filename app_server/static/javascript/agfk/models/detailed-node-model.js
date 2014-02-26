
/*global define*/
define(["underscore", "lib/kmapjs/models/node-model", "agfk/collections/concept-resource-collection", "agfk/collections/detailed-edge-collection", "agfk/collections/goal-collection"], function(_, Node, ConceptResourceCollection, DetailedEdgeCollection, GoalCollection){

  var DetailedNode = Node.extend({
    // FIXME these shouldn't be hardcoded
    collFields: ["dependencies", "outlinks", "resources", "goals"],

    txtFields: ["id", "tag", "exercises", "sid", "title", "summary", "pointers", "is_shortcut", "learn_time", "x", "y", "isContracted", "software", "hasContractedDeps", "hasContractedOLs"],

    defaults: function(){
      var dnDefaults = {
        dependencies: new DetailedEdgeCollection(),
        outlinks: new DetailedEdgeCollection(),
        exercises: "",
        resources: new ConceptResourceCollection(),
        useCsrf: true,
        goals: new GoalCollection(),
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
        return window.agfkGlobals.apiBase + "concept/" + this.id + "/";
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
        } else if (output[tv] === undefined) {
          output[tv] = "";
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
          thisModel.trigger("change:implicitLearnStatus", thisModel.get("id"), status);
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
     * Determine if the node is considered "finished," so we can give an "under"
     # construction" message otherwise.
     */
    isFinished: function(){
      return this.get("summary") && this.get("resources").length > 0;
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

      // jsonify some of the collection attributes (don't pass edges)
      retObj.resources = thisModel.get("resources").toJSON();
      retObj.goals = thisModel.get("goals").toJSON();

      return retObj;
    }
  });

  return DetailedNode;
});
