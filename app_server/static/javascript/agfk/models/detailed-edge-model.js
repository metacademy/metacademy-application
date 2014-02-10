/*global define*/
define(["backbone", "underscore", "lib/kmapjs/models/edge-model"], function(Backbone, _, EdgeModel){
  return EdgeModel.extend({
    defaults: function(){
      var enDef = {
        source: {},
        target: {},
        middlePts: [],
        isContracted: false,
        isTransitive: false
      };
      return _.extend({}, EdgeModel.prototype.defaults(), enDef);
    },
    toJSON: function () {
      var thisModel = this;
      if (!thisModel) { return {};}
      var src = thisModel.get("source"),
          tar = thisModel.get("target");
      return {
        source: src.id,
        target: tar.id,
        reason: thisModel.get("reason") || "",
        id: thisModel.id
      };
    }
  });
});
