// FIXME TODO - must return errors to the user in an elegant way, both client side (here) and from the server

/*global define*/
define(["backbone", "underscore", "jquery", "gc/views/base-editor-view"], function(Backbone, _, $, BaseEditorView){
  return  (function(){

    var pvt = {};
    pvt.consts = {
      templateId: "global-resource-editor-template",
      ecClass: "expanded"
    };

    return BaseEditorView.extend({
      template: _.template(document.getElementById(pvt.consts.templateId).innerHTML),

      events: function () {
        var oevts = BaseEditorView.prototype.events();
        oevts["blur .author-field"] = "changeAuthorField";
        return oevts;
      },

      /**
       * render the view and return the view element
       */
      render: function(){
        var thisView = this;
        thisView.isRendered = false;

        thisView.$el.html(thisView.template(thisView.model.toJSON()));

        thisView.isRendered = true;
        return thisView;
      },

      /**
       * changeAuthorField: change author field in the resource model
       * -- array separated by "and"
       */
      changeAuthorField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0],
            inpText = curTar.value,
            authors = inpText.split(/\s+and\s+/i);
        thisView.model.set(attrName, authors);
      }
    });
  })();
});
