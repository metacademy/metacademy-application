/*
 This file contains the submodels of node-model.js
 */

define(["backbone"], function(Backbone){
  /**
   * Comprehension question model
   */
  var Question = Backbone.Model.extend({
    /**
     * default values -- underscore attribs used to match data from server
     */
    defaults: function () {
      return {
        text: "",
        node: null
      };
    }
  });


  /**
   * Learning resource model
   */
  var Resource = Backbone.Model.extend({
    listFields: ['authors', 'dependencies', 'extra', 'note'],

    /**
     * default values -- attributes match possible data from server
     */
    defaults: function() {
      return {
        title: "",
        location: "",
        url: "",
        node: null,
        resource_type: "",
        free: 0,
        core: 0,
        edition: "",
        level: "",
        authors: [],
        dependencies: [],
        extra: [],
        note: []
      };
    }
  });

  return {
    Question: Question,
    Resource: Resource
  };

});
