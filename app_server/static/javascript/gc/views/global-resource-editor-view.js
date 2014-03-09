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
        oevts["blur .author-field"] = "blurAuthorField";
        oevts["keyUp .gresource-title"] = "keyUpGlobalResourceTitle";
        oevts["blur .gresource-title"] = "blurGlobalResourceTitle";
        return oevts;
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
      },

      blurGlobalResourceTitle: function (evt) {
        var thisView = this,
            globalGResources = window.agfkGlobals.globalResources,
            gid = thisView.model.id;
        if (!globalGResources.hasOwnProperty(gid)){
          globalGResources[gid] = thisView.model;
        }
        thisView.blurTextField(evt);
      },

      keyUpGlobalResourceTitle: function () {
        // TODO FIXME this should match preexisting titles, i.e. check local gresources and also check server gresources
      },

      /**
       * blurAuthorField: change author field in the resource model
       * -- array separated by "and"
       */
      blurAuthorField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0],
            inpText = curTar.value,
            authors = inpText.split(/\s+and\s+/i),
            saveObj = {};
        if (thisView.model.get(attrName) !== authors) {
          saveObj[attrName] = authors;
          thisView.model.save(saveObj, {parse: false, patch: true});
        }
      }
    });
  })();
});
