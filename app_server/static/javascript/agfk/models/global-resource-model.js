/*
 * This file contains the global resource models (can be used across multiple  concept resources
 */

/*global define*/
// TODO listen for changes to these fields in the associated views
define(["backbone"], function(Backbone){
  return Backbone.Model.extend({
    list_fields: ["edition_years", "authors"],
    defaults: function () {
      return {
        id: "",
        title: "",
        resource_type: "",
        year: "",
        url: "",
        authors: [],
        edition_years: [],
        description: "",
        notes: "",
        access: ""
      };
    },

    getAuthorsString: function () {
      return this.get("authors").join(" and ");
    }
  });
});
