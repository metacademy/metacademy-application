
// FIXME TODO - must return errors to the user in an elegant way, both client side (here) and from the server

/*global define*/
define(["backbone", "underscore", "jquery", "gc/views/base-editor-view", "gc/views/global-resource-editor-view", "gc/views/resource-locations-view", "agfk/models/resource-location-model"], function(Backbone, _, $, BaseEditorView, GlobalResourceEditorView, ResourceLocationsView, ResourceLocation){
  return  (function(){

    var pvt = {};
    pvt.consts = {
      templateId: "resource-editor-template",
      ecClass: "expanded",
      globalResClass: "global-resource-fields",
      resLocWrapperClass: "resource-location-wrapper",
      rgcClass: "resource-goals-covered",
      crfClass: "core-radio-field"
    };

    return BaseEditorView.extend({
      template: _.template(document.getElementById(pvt.consts.templateId).innerHTML),

      className: "resource-form input-form",

      events: function(){
        var oevts = BaseEditorView.prototype.events(),
            consts = pvt.consts;
        oevts["blur .deps-field"] = "changeDepsField";
        oevts["change ." + consts.crfClass] = "changeCoreRadioField";
        oevts["change ." + consts.rgcClass + " input"] = "changeCoveredGoal";
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

        thisView.$el.html(thisView.template(thisView.model.attributes));
        // assign the subviews
        thisView.assign(assignObj);

        thisView.isRendered = true;
        return thisView;
      },

      addResourceLocation: function () {
        var thisView = this,
            rlid = Math.random().toString(36).substr(8),
            resLoc = new ResourceLocation({id: rlid, cresource: thisView.model});
        thisView.resourceLocationsView = thisView.resourceLocationsView || new ResourceLocationsView({model: thisView.model.get("locations")});
        thisView.resourceLocationsView.model.add(resLoc);
        // verify the rl id is okay
        // TODO fix hardcoded URLS!
        $.get(window.agfkGlobals.idcheckUrl,
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
            inpText = curTar.value,
            saveObj = {};

        // parse tags server side since graph is being created
        saveObj[attrName] = inpText.split(/\s*,\s*/).map(function (title) {
          return {title: title};
        });
        thisView.model.save(saveObj, {parse: false, patch: true});
      },

      /**
       * changeCoveredGoal: change which goals are covered by the resource
       */
      changeCoveredGoal: function (evt) {
        var thisView = this,
            checkbox = evt.currentTarget,
            goalId = checkbox.value,
            checked = checkbox.checked,
            goalsCovered = this.model.get("goals_covered"),
            gidIndex = goalsCovered.indexOf(goalId),
            saveObj = {};

        if (checked && gidIndex === -1) {
          goalsCovered.push(goalId);
        } else if (!checked && gidIndex !== -1) {
          goalsCovered.splice(gidIndex, 1);
        }
        thisView.model.set("goals_covered", goalsCovered);
        thisView.model.save(null, {parse: false});
      },

      /**
       * changeCoreRadioField: change core/supplementary field in the resource model
       */
      changeCoreRadioField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0],
            coreVal = curTar.value === "core" ? 1 : 0,
            $rgc = $(evt.currentTarget.parentElement).find("." + pvt.consts.rgcClass).hide(),
            saveObj = {};
        saveObj[attrName] = coreVal;
        thisView.model.save(saveObj, {parse: false, patch: true});
        if (coreVal) {
          $rgc.hide();
        } else {
          $rgc.show();
        }
      }
    });
  })();
});
