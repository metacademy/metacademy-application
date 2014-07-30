
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
          "click .ec-button": "toggleEC"
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
      }

    });
  })();
});
