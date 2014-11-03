/*global define*/
define(["backbone", "agfk/models/resource-location-model"], function(Backbone, LocationModel){
  return Backbone.Collection.extend({
    model: LocationModel,
    comparator: "ordering",
    url: window.APIBASE + "resourcelocation/"
  });
});
