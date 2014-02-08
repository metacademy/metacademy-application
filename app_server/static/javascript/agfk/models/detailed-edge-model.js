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
    }
  });
});
