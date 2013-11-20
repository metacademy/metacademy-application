define(["backbone", "underscore", "agfk/models/directed-edge-model"], function(Backbone, _, DetailedEdgeModel){
  var EditableEdge = DetailedEdgeModel.extend({
    defaults: function(){
      var enDef = {
        source: {},
        target: {},
        path: "",
        isNew: 1,
        editNote: "",
        middlePts: []
      };
      return _.extend({}, DetailedEdgeModel.prototype.defaults, enDef);
    }
  });

  return EditableEdge;
});
