
// FIXME TODO - must return errors to the user in an elegant way, both client side (here) and from the server

/*global define*/
define(["backbone", "underscore", "jquery", "gc/views/base-editor-view", "gc/views/global-resource-editor-view", "gc/views/resource-locations-view", "agfk/models/resource-location-model"], function(Backbone, _, $, BaseEditorView, GlobalResourceEditorView, ResourceLocationsView, ResourceLocation){
  return  (function(){

    var pvt = {};
    pvt.consts = {
      templateId: "resource-editor-template",
      ecClass: "expanded",
      globalResClass: "global-resource-fields",
      resLocWrapperClass: "resource-location-wrapper"
    };

    return BaseEditorView.extend({
      template: _.template(document.getElementById(pvt.consts.templateId).innerHTML),

      className: "resource-form input-form",

      events: function(){
        var oevts = BaseEditorView.prototype.events();
        oevts["blur .deps-field"] = "changeDepsField";
        oevts["change .core-radio-field"] = "changeCoreRadioField";
        return oevts;
      },

      /**
       * render the view and return the view element
       */
      render: function(){
        var thisView = this,
            consts = pvt.consts;
        thisView.isRendered = false;

        var assignObj = {};
        thisView.globalResourceView = thisView.globalResourceView || new GlobalResourceEditorView({model: thisView.model.get("global_resource")});
        thisView.resourceLocationsView = thisView.resourceLocationsView || new ResourceLocationsView({model: thisView.model.get("locations")});

        // make sure we have at least one resource location
        if (thisView.resourceLocationsView.model.length == 0){
          thisView.addResourceLocation();
        }

        assignObj["." + consts.globalResClass] = thisView.globalResourceView;
        assignObj["." + consts.resLocWrapperClass] = thisView.resourceLocationsView;

        thisView.$el.html(thisView.template(thisView.model.toJSON()));

        // assign the subviews
        thisView.assign(assignObj);

        thisView.isRendered = true;
        return thisView;
      },

      addResourceLocation: function () {
        var thisView = this,
            rlid = Math.random().toString(36).substr(8),
            resLoc = new ResourceLocation({id: rlid, concept_resource: thisView.model});
        thisView.resourceLocationsView = thisView.resourceLocationsView || new ResourceLocationsView({model: thisView.model.get("locations")});
        thisView.resourceLocationsView.model.add(resLoc);
        // verify the rl id is okay
        // TODO fix hardcoded URLS!
        $.get("http://127.0.0.1:8080/graphs/idchecker/",
          {id: rlid, type: "resource_location" })
          .success(function (resp) {
            resLoc.set("id", resp.id);
        })
          .fail(function (resp){
            // failure
            console.error("unable to verify new resource location id -- TODO inform user -- msg: "
                          + resp.responseText);
          });

        // TODO fixme should add a new location element to the dom and rerender
      },

      /**
       * changeDepsField: change dependency field in the resource model
       * -- array of titles
       */
      changeDepsField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0],
            inpText = curTar.value;
        // parse tags server side since graph is being created
        thisView.model.set(attrName, inpText.split(/\s*,\s*/).map(function (title) {
          return {title: title};
        }));
      },

      /**
       * changeCoreRadioField: change core/supplementary field in the resource model
       */
      changeCoreRadioField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0];
        thisView.model.set(attrName, curTar.value === "core" ? 1 : 0);
      }
    });
  })();
});
