/*global define*/
define(["jquery", "backbone", "agfk/models/goal-model"], function($, Backbone, GoalModel){
  return Backbone.Collection.extend({
    model: GoalModel,
    comparator: "ordering",
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
