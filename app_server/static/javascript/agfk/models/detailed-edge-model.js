/*global define*/
define(["backbone", "underscore", "lib/kmapjs/models/edge-model", "agfk/collections/goal-collection"], function(Backbone, _, EdgeModel, GoalCollection){
  return EdgeModel.extend({
    defaults: function(){
      var enDef = {
        source: null,
        target: null,
        source_goals: new GoalCollection(),
        target_goals: new GoalCollection(),
        // TODO FIXME consider moving these to non-saved attributes
        middlePts: [],
        isContracted: false,
        isTransitive: false
      };
      return _.extend({}, EdgeModel.prototype.defaults(), enDef);
    },

    parse: function (resp, xhr) {
      // backwards compatability to parse entire server graph TODO remove
      if (!xhr.parse) {
        return {};
      }
      if (!(resp.hasOwnProperty("source") && resp.hasOwnProperty("target"))) {
        return resp;
      }

      var thisModel = this;

      // source goals
      // TODO DRY source_goals and target_goals
      if (resp.hasOwnProperty("source_goals")) {
        if (! (resp.source_goals instanceof GoalCollection)) {
          // assume we're dealing with an array of goal uris
          var sgids = resp.source_goals.map(function (sguri) {
            var sgarr = sguri.split("/");
            return sgarr[sgarr.length-2];
          });

          var sourceGoals = resp.source.get("goals"),
              presentSGIds = {};
          resp.source_goals = sourceGoals.filter(function (sgoal) {
            if (sgids.indexOf(sgoal.id) != -1) {
              presentSGIds[sgoal.id] = 1;
              return true;
            }
            return false;
          });

          // create new goals for goal ids that do not exists and add them to the source_goals
          _.each(sgids, function (sid) {
            if (!presentSGIds[sid]) {
              sourceGoals.add({id: sid, concept: resp.source});
              resp.source_goals.push(sourceGoals.get(sid));
            }
          });

        }
      } else {
        // add all goals from source unless the goals are specified
        resp.source_goals = resp.source.get("goals").models;
      }

      // target goals
      if (resp.hasOwnProperty("target_goals")) {
        if (!(resp.target_goals instanceof GoalCollection)) {
          // assume we're dealing with an array of goal uris
          var tgids = resp.target_goals.map(function (tguri) {
            var tgarr = tguri.split("/");
            return tgarr[tgarr.length-2];
          });

          var targetGoals = resp.target.get("goals"),
              presentTGIds = {};
          resp.target_goals = targetGoals.filter(function (tgoal) {
            if (tgids.indexOf(tgoal.id) > -1) {
              presentTGIds[tgoal.id] = 1;
              return true;
            }
            return false;
          });

          // create new goals for goal ids that do not exists and add them to the target_goals
          _.each(tgids, function (tid) {
            if (!presentTGIds[tid]) {
              targetGoals.add({id: tid, concept: resp.target});
              resp.target_goals.push(targetGoals.get(tid));
            }
          });
        }
      } else {
        // add all goals from target when the goals are not specified
        resp.target_goals = resp.target.get("goals").models;
      }

      var sgColl = thisModel.get("source_goals"),
          tgColl = thisModel.get("target_goals");
      sgColl = sgColl || new GoalCollection();
      tgColl = tgColl || new GoalCollection();

      if (!(resp.source_goals instanceof GoalCollection)) {
        sgColl.add(resp.source_goals);
        resp.source_goals = sgColl;
      }

      if (!(resp.target_goals instanceof GoalCollection)) {
        tgColl.add(resp.target_goals);
        resp.target_goals = tgColl;
      }

      return resp;
    },

    url: function () {
      return window.APIBASE + "dependency/" + this.id + "/";
    },

    toJSON: function () {
      var thisModel = this;
      if (!thisModel) { return {};}

      var src = thisModel.get("source"),
          tar = thisModel.get("target"),
          srcGoals = thisModel.get("source_goals").map(function (sg) {
            return sg.url();
          }),
          tarGoals = thisModel.get("target_goals").map(function (tg) {
            return tg.url();
          });

      return {
        source: src.url(),
        target: tar.url(),
        reason: thisModel.get("reason") || "",
        id: thisModel.id,
        source_goals: srcGoals,
        target_goals: tarGoals
      };
    }
  });
});
