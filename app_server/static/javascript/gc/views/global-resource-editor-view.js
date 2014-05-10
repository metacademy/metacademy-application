// FIXME TODO - must return errors to the user in an elegant way, both client side (here) and from the server

/*global define*/
define(["backbone", "underscore", "jquery", "gc/views/base-editor-view", "gen-utils"], function(Backbone, _, $, BaseEditorView, GenUtils){
  return  (function(){

    var pvt = {};
    pvt.consts = {
      templateId: "global-resource-editor-template",
      ecClass: "expanded",
      addGRTitleWrapClass: "gresource-title-wrap"
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

      initialize: function () {
          _.bindAll(this);
      },

      /**
       * render the view and return the view element
       */
      render: function(){
        var thisView = this;
        thisView.isRendered = false;

        thisView.$el.html(thisView.template(thisView.model.attributes));
        var acOpts = {
          containerEl: thisView.$el.find("." + pvt.consts.addGRTitleWrapClass)[0],
          acUrl: "/graphs/autocomplete"
        };
        var obtainGETData = function (val) {
          return {ac: val, type: "globalresource"};
        };

        thisView.autocomplete = new GenUtils.Autocomplete(acOpts, obtainGETData, null, thisView.loadGResource);

        thisView.isRendered = true;
        return thisView;
      },

      /**
       * Load a global resource into the model from an ajax request
       */
      loadGResource: function (inpText, evt) {
        var thisView = this,
            thisModel = thisView.model,
            id = evt.target.getAttribute("data-id");
        if (!id) {return;}
        var prevId = thisModel.id;
        thisModel.id = id;
        thisModel.fetch({parse: true, success: function () {
         thisView.conceptModel.save({"global_resource": thisModel.url()}, {parse: false, patch: true, error: thisView.attrErrorHandler});
         thisView.render();
        },
        error: function () {
          window.noty({
              timeout: 5000,
              type: 'error',
              maxVisible: 1,
              dismissQueue: false,
              text: "Unable to get global resource from the server."
          });
        }});
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
          thisView.model.save(saveObj, {parse: false, patch: true, error: thisView.attrErrorHandler});
        }
      }
    });
  })();
});
