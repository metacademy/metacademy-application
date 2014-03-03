/*global define*/
define(["jquery", "backbone", "lib/kmapjs/collections/edge-collection", "agfk/models/detailed-edge-model"], function($, Backbone, EdgeCollection, DetailedEdgeModel){
  return  EdgeCollection.extend({
    model: DetailedEdgeModel,
    url: window.agfkGlobals.apiBase + "dependency/",
    save: function () {
      // TODO make this save function more general purpose
      // collection save makes a patch request to the list url
      var thisColl = this,
          jsonRep = {objects: thisColl.toJSON()};
      return $.ajax({ type: "PATCH",
               contentType: "application/json; charset=utf-8",
               data: JSON.stringify(jsonRep),
               headers: {'X-CSRFToken': window.CSRF_TOKEN},
               url: thisColl.url
          });
    }
  });
});
