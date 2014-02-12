
// FIXME TODO - must return errors to the user in an elegant way, both client side (here) and from the server

/*global define*/
define(["backbone", "underscore", "jquery", "gc/views/base-editor-view", "gc/views/global-resource-editor-view", "gc/views/resource-locations-view", "agfk/models/resource-location-model"], function(Backbone, _, $, BaseEditorView){
  return  (function(){

    var pvt = {};
    pvt.consts = {
      templateId: "goal-editor-template"
    };

    return BaseEditorView.extend({
      template: _.template(document.getElementById(pvt.consts.templateId).innerHTML),

      className: "input-form goal-form",

      /**
       * render the view and return the view element
       */
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
