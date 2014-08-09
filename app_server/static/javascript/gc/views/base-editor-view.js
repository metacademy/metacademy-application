
// FIXME TODO - must return errors to the user in an elegant way, both client side (here) and from the server

/*global define*/
define(["backbone", "underscore", "jquery", "utils/utils"], function(Backbone, _, $, Utils){
  return  (function(){

    var pvt = {};
    pvt.consts = {
      ecClass: "expanded"
    };

    return Backbone.View.extend({

      events: function(){
      // TODO why are some of these events firing twice?
        return {
          "blur .text-field": "blurTextField",
          "blur .array-field": "blurArrayField",
          "change .boolean-field": "changeBooleanField",
          "change .select-field": "changeSelectField",
          "click .ec-button": "toggleEC",
          "click .destroy-model": "destroyModel"
        };
      },

      /**
       * render the view and return the view element
       */
      render: function(){
        throw "must implement render in sub'class'";
      },

      /**
       * Assign subviews: method groked from http://ianstormtaylor.com/assigning-backbone-subviews-made-even-cleaner/
       */
      assign : function (selector, view) {
        var selectors;
        if (_.isObject(selector)) {
          selectors = selector;
        }
        else {
          selectors = {};
          selectors[selector] = view;
        }
        if (!selectors) return;
        _.each(selectors, function (view, selector) {
          view.setElement(this.$(selector)).render();
        }, this);
      },

      /**
       * Expand/contract the resource fields
       */
      toggleEC: function (evt) {
        $(evt.currentTarget.parentElement).toggleClass(pvt.consts.ecClass);
      },

      /**
       * Handle errors when syncing the attributes with the server
       */
      attrErrorHandler: function (robj, resp) {
        Utils.errorNotify("unable to sync attribute with the server: " + (resp.status === 401 ? "create an account to save your changes" : resp.responseText));
      },

      /**
       * blurTextField: change text field in the resource model
       */
      blurTextField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0],
            saveObj = {};
        if (thisView.model.get(attrName) !== curTar.value) {
          saveObj[attrName] = curTar.value;
          thisView.model.save(saveObj, {parse: false, patch: !thisView.model.doSaveUpdate, error: thisView.attrErrorHandler});
        }
        // so event is only fired on child views
        evt.stopPropagation();
      },


      /**
       * changeBooleanField: change boolean field in the resource model
       */
      changeBooleanField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0],
            saveObj = {};

        saveObj[attrName] =  curTar.checked ? 1 : 0;
        if (thisView.model.get(attrName) !== saveObj[attrName]) {
          thisView.model.save(saveObj, {parse: false, patch: !thisView.model.doSaveUpdate, error: thisView.attrErrorHandler});
        }
        // so event is only fired on child views
        evt.stopPropagation();
      },

      /**
       * changeSelectField: change core/supplementary field in the resource model
       */
      changeSelectField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0],
            saveObj = {};
        if (thisView.model.get(attrName) !== curTar.value) {
          saveObj[attrName] = curTar.value;
          thisView.model.save(saveObj, {parse: false, patch: !thisView.model.doSaveUpdate, error: thisView.attrErrorHandler});
        }
        // so event is only fired on child views
        evt.stopPropagation();
      },

      /**
       * blurArrayField
       */
      blurArrayField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0],
            inpText = curTar.value;
        var saveArr = inpText.split(","),
            saveObj = {};
        saveObj[attrName] = saveArr;
        thisView.model.save(saveObj, {parse: false, patch: true, error: thisView.attrErrorHandler});
        evt.stopPropagation();
      },

      destroyModel: function (evt) {
        evt.stopPropagation();
        var thisView = this;
        if (confirm("Are you sure you want to delete this resource location (this action can't be undon)?")) {
          thisView.model.destroy(
            {
              success: function () {
                if (thisView.parentView) {
                  thisView.parentView.render();
                }
              },
              error: function (mdl, jqxhr) {
                var etext = "Unable to delete resource location";
                if (jqxhr.status == 401) {
                  etext += " -- you do not have permission";
                } else if (jqxhr.status == 404) {
                  etext += " -- it may already be deleted";
                }
                window.noty({
                  timeout: 5000,
                  type: 'error',
                  maxVisible: 1,
                  dismissQueue: false,
                  text: etext
                });
              }});
        }
      }
    });
  })();
});
