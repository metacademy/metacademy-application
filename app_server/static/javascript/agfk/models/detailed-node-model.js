/*global define*/
define(["underscore", "base/models/node-model", "base/collections/node-property-collections", "agfk/collections/detailed-edge-collection"], function(_, Node, NodePropertyCollections, DetailedEdgeCollection){

  var pvt = {};

    /**
   * Simple function to break long strings and insert a hyphen (idea from http://ejohn.org/blog/injecting-word-breaks-with-javascript/)
   * str: string to be potentially hyphenated
   * num: longest accecptable length -1 (single letters will not be broken)
   */
  pvt.wbr = function(str, num) {
    return str.replace(RegExp("(\\w{" + num + "})(\\w{3," + num + "})", "g"), function(all,text, ch){
      return text + "-\\n" + ch;
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
    }

  });

  return DetailedNode;
});
