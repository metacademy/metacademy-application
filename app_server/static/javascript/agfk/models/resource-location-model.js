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
    }
  });
});
