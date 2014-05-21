
/*global define*/
define(["backbone", "underscore", "jquery", "gc/views/base-editor-view", "agfk/models/resource-location-model"], function(Backbone, _, $, BaseEditorView, ResourceLocationModel){
  return  (function(){

    var pvt = {};
    pvt.consts = {
      templateId: "resource-location-template"
    };

    var ResourceLocationView = BaseEditorView.extend({
      template: _.template(document.getElementById(pvt.consts.templateId).innerHTML),
      tagName: "li",
      className: "resource-location",
      id: function () {
        return this.model.cid + "-rloc";
      },

      /**
       * render the view and return the view element
       */
      render: function(){
        var thisView = this;
        thisView.isRendered = false;
        thisView.$el.html(thisView.template(thisView.model.attributes));
        thisView.isRendered = true;
        return thisView;
      }
    });

    // resource location_s_ view (expects a collection)
    return Backbone.View.extend({
      render: function () {
        var thisView = this;
        thisView.model.each(function (resLoc) {
          var rlv = new ResourceLocationView({model: resLoc});
          thisView.$el.append(rlv.render().el);
        });
      }
    });
  })();
});
