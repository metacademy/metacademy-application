/*
 * This file contains the resource location model used with conceptresource
 * TODO consider making a general "location" model for use with resources, exercises, problems, etc
 */

/*global define*/
define(["backbone"], function(Backbone){
  return Backbone.Model.extend({
    defaults: function () {
      return {
        concept_resource: null,
        url: "",
        location_type: "",
        location_text: ""
      };
    },
    toJSON: function () {
      var thisModel = this,
          cresource = thisModel.get("concept_resource"),
          cres_id = cresource ? cresource.id : "",
          attrbs = thisModel.attributes;

      return {
        concept_resource: {id: cres_id},
        url: thisModel.get("url"),
        location_type: thisModel.get("location_type"),
        location_text: thisModel.get("location_text")
      };
    }
  });
});
