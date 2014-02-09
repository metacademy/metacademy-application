/*global define*/
define(["backbone", "agfk/models/goal-model"], function(Backbone, GoalModel){
  return Backbone.Collection.extend({
    model: GoalModel
  });
});
