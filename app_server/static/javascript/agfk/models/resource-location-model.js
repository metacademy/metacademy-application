/*
 * This file contains the resource location model used with conceptresource
 * TODO consider making a general "location" model for use with resources, exercises, problems, etc
 */

/*global define*/
define(["backbone"], function(Backbone){
  return Backbone.Model.extend({
    defaults: function () {
      return {
        cresource: null,
        url: "",
        location_type: "",
        location_text: ""
      };
    },

    initialize: function () {
      // save instead of patch to avoid race conditions with concept resource
      this.doSaveUpdate = true;
    },

    url: function () {
        return window.APIBASE + "resourcelocation/" + this.id + "/";
    },

    parse: function (resp, xhr) {
      if (!xhr.parse) {
        return {};
      }
      resp["cresource"] = this.collection.parent;
      return resp;
    },

    toJSON: function () {
      var thisModel = this,
          cresource = thisModel.get("cresource");

      return {
        id: thisModel.id,
        cresource: cresource.url(),
        url: thisModel.get("url"),
        location_type: thisModel.get("location_type"),
        location_text: thisModel.get("location_text")
      };
    }
  });
});
