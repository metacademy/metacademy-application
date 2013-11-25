define(["backbone", "underscore", "agfk/models/directed-edge-model"], function(Backbone, _, DetailedEdgeModel){
  var EditableEdge = DetailedEdgeModel.extend({
    defaults: function(){
      var enDef = {
        source: {},
        target: {},
        isNew: 1,
        editNote: "",
        middlePts: [],
        isContracted: false
      };
      return _.extend({}, DetailedEdgeModel.prototype.defaults, enDef);
    },

    isVisible: function(){
      return !this.get("isContracted");
    }
  });

  return EditableEdge;
});
