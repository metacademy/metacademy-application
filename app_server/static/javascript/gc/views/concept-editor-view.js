define(["backbone", "underscore"], function(Backbone, _){

  var ConceptEditorView = (function(){
    var pvt = {};
    pvt.viewConsts = {
      templateId: "full-screen-content-editor"
    };

    return Backbone.View.extend({
      template: _.template(document.getElementById(pvt.viewConsts.templateId).innerHTML),

      render: function(){
        var thisView = this;
        thisView.$el.html(thisView.template(thisView.model.toJSON()));
        
        // initialize all of the subview, but only render/display them once clicked
        
        return thisView;
      }
    });
  })();

  return ConceptEditorView;
});
