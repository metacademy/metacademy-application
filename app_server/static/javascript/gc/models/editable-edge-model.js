define(["backbone", "underscore", "agfk/models/detailed-edge-model"], function(Backbone, _, DetailedEdgeModel){
  var EditableEdge = DetailedEdgeModel.extend({
    defaults: function(){
      var enDef = {
        source: {},
        target: {},
        middlePts: [],
        isContracted: false,
        isNew: 1,
        editNote: ""
      };
      return _.extend({}, DetailedEdgeModel.prototype.defaults, enDef);
    },

    isVisible: function(){
      return !this.get("isContracted");
    }
  });

  return EditableEdge;
});
