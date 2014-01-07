/*global define*/
define(["backbone", "underscore"], function(Backbone, _){
  return  (function(){
    var pvt = {};
    pvt.viewConsts = {
      templateId: "resource-editor-template"
    };

    return Backbone.View.extend({
      template: _.template(document.getElementById(pvt.viewConsts.templateId).innerHTML),

      className: "resource-form",

      events: {
      },

      render: function(){
        var thisView = this;
        thisView.isRendered = false;

        thisView.$el.html(thisView.template(thisView.model.toJSON()));

        thisView.isRendered = true;
        return thisView;
      }
    });
  })();
});
