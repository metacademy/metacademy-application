define(["backbone", "underscore", "agfk/models/detailed-edge-model"], function(Backbone, _, DetailedEdgeModel){
  return  DetailedEdgeModel.extend({
    defaults: function(){
      var enDef = {
        isNew: 1,
        editNote: ""
      };
      return _.extend({}, DetailedEdgeModel.prototype.defaults, enDef);
    }
  });
});
