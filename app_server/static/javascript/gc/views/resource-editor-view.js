
/*global define*/
define(["backbone", "underscore"], function(Backbone, _){
  return  (function(){

    var pvt = {};
    pvt.viewConsts = {
      templateId: "resource-editor-template"
    };

    /**
     * use a regex to parse composite text [link] fields with newline \n separators
     */
    pvt.parseCompositeField = function (inpText) {
      var retArr = [],
          inpArr = inpText.split("\n"),
          linkRE = /([^\[]*)\[([^\]]+)\]/,
          reRes;
      inpArr.forEach(function (itm) {
        reRes = linkRE.exec(itm);
        var locItm = {text: null, link: null};
        if (reRes) {
          locItm.text = reRes[1];
          locItm.link = reRes[2];
        } else {
          locItm.text = itm;
        }
        retArr.push(locItm);
      });
      return retArr;
    };

    return Backbone.View.extend({
      template: _.template(document.getElementById(pvt.viewConsts.templateId).innerHTML),

      className: "resource-form",

      events: {
        "blur .text-field": "changeTextField",
        "change .core-radio-field": "changeCoreRadioField",
        "change .boolean-field": "changeBooleanField",
        "blur .deps-field": "changeDepsField",
        "blur .author-field": "changeAuthorField",
        "blur .composite-field": "changeCompositeField"
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
       * changeTextField: change text field in the resource model
       */
      changeTextField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0];
        thisView.model.set(attrName, curTar.value);
      },

      /**
       * changeCompositeField: change composite (text + url in brackets) field in the resource model
       */
      changeCompositeField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0],
            inpText = curTar.value;
        thisView.model.set(attrName, pvt.parseCompositeField(inpText));
      },

      /**
       * changeAuthorField: change authore field in the resource model  -- array separated by "and"
       */
      changeAuthorField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0],
            inpText = curTar.value,
            authors = inpText.split(/\s+and\s+/i);
        thisView.model.set(attrName, authors);
      },

      /**
       * changeDepsField: change dependency field in the resource model -- array of titles
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
       * changeBooleanField: change boolean field in the resource model
       */
      changeBooleanField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0];
        thisView.model.set(attrName, curTar.checked ? 1 : 0);
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
