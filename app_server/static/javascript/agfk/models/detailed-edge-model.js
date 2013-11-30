/*global define*/
define(["backbone", "underscore", "base/models/edge-model"], function(Backbone, _, EdgeModel){
  return EdgeModel.extend({
    defaults: function(){
      var enDef = {
        source: {},
        target: {},
        middlePts: [],
        isContracted: false
      };
      return _.extend({}, EdgeModel.prototype.defaults(), enDef);
    },

    /**
     * return a dot (graphviz) representation of the edge
     */
    getDotStr: function(){
      if (this.get("from_tag")){
        return this.get("from_tag") + "->" + this.get("to_tag") + ';';
      }
      else{
        return "";
      }
    }

  });
});
