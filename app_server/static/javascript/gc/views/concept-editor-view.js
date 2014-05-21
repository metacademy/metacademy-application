
/*global define*/
define(["jquery", "backbone", "underscore", "gc/views/resource-editor-view", "agfk/models/concept-resource-model", "agfk/models/goal-model", "gc/views/goal-editor-view", "utils/utils"], function($, Backbone, _, ResourceEditorView, ConceptResource, GoalModel, GoalEditorView, Utils){

  return (function(){
    var pvt = {};

    // TODO state should exist on the object itself
    pvt.state = {
      visId: ""
    };

    pvt.consts = {
      templateId: "full-screen-content-editor",
      contentItemClass: "ec-display-wrap",
      resourcesTidbitWrapId: "resources-tidbit-wrap",
      goalsTidbitWrapId: "goals-tidbit-wrap",
      historyId: "history",
      sortableClass: "sortable",
      reversionsClass: "reversions",
      depUlId: "dependencies-list",
      expClass: "expanded"
    };

    pvt.failFun = function failFun (resp){
          // failure
      Utils.errorNotify("unable to verify sync learning resource with the server -- " + resp.responseText);
        };

    return Backbone.View.extend({
      template: _.template(document.getElementById(pvt.consts.templateId).innerHTML),

      events: {
        "blur .title-input": "blurTitleField",
        "blur .tag-input": "blurTagField",
        "blur .ec-display-wrap > textarea": "blurTextField",
        "blur input.dep-reason": "blurDepReason",
        "click #btn-history": "loadConceptHistory",
        "click .ec-title + .ec-tabs button": "changeDisplayedSection",
        "click #add-resource-button": "addResource",
        "click #add-goal-button": "addGoal",
        "change .goal-check-input .check-field": "changeDepGoal",
        "click .ec-button": "togglePreqDetails"
      },

      render: function(){
        var thisView = this,
            thisModel = thisView.model,
            consts = pvt.consts;
        pvt.state.visId = pvt.state.visId || "summary";
        thisView.isRendered = false;

        // check the structure of goals, resources, problems, and relevant software
        // convert to free-form text for now
        // TODO extract this to a utils function
        var freeFormFields = ["pointers", "exercises"];
        var ffl = freeFormFields.length,
            httpRe = /http:/;
        while( ffl -- ){
          var qfield = thisModel.get(freeFormFields[ffl]);

          // if the field does not exist: set to ""
          if (qfield === undefined){
            thisModel.set(freeFormFields[ffl], "");
            qfield = "";
          }

          if (typeof qfield !== "string") {
            // make field into a string for editing purposes
            var convArr = [],
                i = qfield.length,
                prevDepth = 0,
                liStr;
            // convert array to displayable string
            while( i -- ){
              var line = qfield[i],
                  depth = line.depth,
                  items = line.items,
                  j = -1,
                  itemsLen = line.items.length,
                  retStr = Array(depth + 1).join("*") + " ";
              while (++j < itemsLen ){
                var item = line.items[j];
                if (item.link) {
                  if (httpRe.test(item.link)) {
                    retStr += item.text + "[" + item.link + "]";
                  } else {
                    retStr += '"' + item.text + '":' + item.link;
                  }
                } else {
                  retStr += item.text;
                }
              } // end while j --
              convArr.unshift(retStr);
            } // end while i --
            thisModel.set(freeFormFields[ffl], convArr.join("\n"));
          } // end if typeof qfield !-- string
        } // end while ffl--

        // use attributes since toJSON changes the structure
        thisView.$el.html(thisView.template(thisModel.attributes));

        // add the resources and goals (they're the tricky parts)
        thisView.model.get("resources").each(function (res) {
          var rev = new ResourceEditorView({model: res});
          thisView.$el.find("#" + consts.resourcesTidbitWrapId).append(rev.render().$el);
        });
        // TODO DRY with resources, problems, etc
        thisView.model.get("goals").each(function (goal) {
          var gev = new GoalEditorView({model:goal});
          thisView.$el.find("#" + consts.goalsTidbitWrapId).append(gev.render().$el);
        });

        pvt.state.rendered = true;

        thisView.$el.find("#" + pvt.state.visId).addClass("active");
        thisView.$el.find("#btn-" + pvt.state.visId).addClass("active");

        thisView.$el.find("#" + consts.goalsTidbitWrapId).sortable().bind('sortupdate', function () {
          thisView.updateGoalOrdering();
        });
        thisView.$el.find("#" + consts.depUlId).sortable().bind('sortupdate', function () {
          thisView.updateDepOrdering();
        });
        thisView.isRendered = true;
        return thisView;
      },

      updateDepOrdering: function () {
        var thisView = this,
            deps = thisView.model.get("dependencies");
        thisView.$el.find("#" + pvt.consts.depUlId).find("li").each(function (i, dep) {
          var depModel = deps.get(dep.id.split("-")[0]);
          if (depModel.get("ordering") !== i) {
            depModel.set("ordering", i);
            depModel.save({ordering: i}, {patch: true, parse: false});
          }
        });
        deps.sort();
      },

      updateGoalOrdering: function () {
        var thisView = this,
            goals = thisView.model.get("goals");
        thisView.$el.find("#" + pvt.consts.goalsTidbitWrapId).find("li").each(function (i, goalel) {
          var goalModel = goals.get(goalel.id.split("-")[0]);
          if (goalModel.get("ordering") !== i) {
            goalModel.set("ordering", i);
            goalModel.save({ordering: i}, {patch: true, parse: false});
          }
        });
        goals.sort();
      },

      addGoal: function () {
        var thisView = this,
            gid = Math.random().toString(36).substr(3, 11),
            newGoal = new GoalModel({id: gid, concept: thisView.model, ordering: _.max(thisView.model.get("goals").pluck("ordering")) + 1}),
            deps = thisView.model.get("dependencies"),
            ols = thisView.model.get("outlinks");

        // add goal to goal list
        thisView.model.get("goals").add(newGoal);

        newGoal.save(null, {parse: false, error: thisView.attrErrorHandler, success: function () {
          // FIXME this is an awkward way to update the deps and ols
          deps.save(null, {parse: false, error: thisView.attrErrorHandler});
          ols.save(null, {parse: false, error: thisView.attrErrorHandler});
        },
        error: function () {
         Utils.errorNotify("unable to save goal");
        }});

        // add goal to all preq and postreq dep lists by default
        deps.each(function (dep) {
            dep.get("target_goals").add(newGoal);
        });
        ols.each(function (ol) {
          ol.get("source_goals").add(newGoal);
        });

        thisView.render();
      },

      changeDepGoal: function (evt) {
        var thisView = this,
            thisModel = thisView.model,
            $domEl = $(evt.currentTarget),
            depId = $domEl.data("dep"),
            goalId = $domEl.prop("value"),
            goalType = $domEl.prop("name").split("-")[0],
            goal = goalType === "target_goals"
            ? thisModel.get("goals").get(goalId)
            : thisModel.get("dependencies").get(depId).get("source").get("goals").get(goalId),
            dep = thisModel.get("dependencies").get(depId);

        if ($domEl.prop("checked")) {
          dep.get(goalType).add(goal);
        } else {
          dep.get(goalType).remove(goal);
        }
        var saveObj = {};
        saveObj[goalType] = dep.get(goalType);
        dep.save(saveObj, {patch: true, parse: false, error: thisView.attrErrorHandler});
      },

      addResource: function () {
        var thisView = this,
            rid = Math.random().toString(36).substr(3, 11),
            grid = Math.random().toString(36).substr(3, 11),
            newRes = new ConceptResource({id: rid});
        newRes.get("global_resource").set("id", grid);
        newRes.parent = thisView.model;
        newRes.set("concept", thisView.model);

        $.get(window.agfkGlobals.idcheckUrl, {id: rid, type: "resource" })
        .success(function (resp) {
            newRes.set("id", resp.id);
            newRes.save(null, {parse: false, error: thisView.attrErrorHandler});
        })
        .fail(pvt.failFun);

        $.get(window.agfkGlobals.idcheckUrl, {id: grid, type: "global_resource" })
          .success(function (resp) {
            // change the id if it hasn't taken on a different global resource
            var gresource = newRes.get("global_resource");
            if (gresource.id === grid && resp.id != grid) {
              gresource.set("id", resp.id);
            }
          })
          .fail(pvt.failFun);

        thisView.model.get("resources").add(newRes, {at: 0});
        thisView.render();
      },

      changeDisplayedSection: function(evt){
        var thisView = this,
            curVal = pvt.state.visId,
            val = evt.currentTarget.id.substr(4);
        if (curVal !== val) {
          pvt.state.visId = val;
          thisView.render();
        }
      },

      blurTitleField: function(evt){
        var thisView = this;
        if (thisView.model.get("title") !== evt.currentTarget.value) {
          thisView.model.save({"title": evt.currentTarget.value}, {parse: false, error: thisView.attrErrorHandler, patch: true});
        }
      },

      blurTagField: function(evt){
        var thisView = this;
        if (thisView.model.get("tag") !== evt.currentTarget.value) {
          if (confirm("are you sure you want to change the tag field?")) {
            thisView.model.save({"tag": evt.currentTarget.value}, {parse: false, error: thisView.attrErrorHandler, patch: true});
          } else {
            evt.currentTarget.value = thisView.model.get("tag");
          }
        }
      },

      /**
       * Changes text field values for simple attributes of models
       * the id of the containing element must match the attribute name
       */
      blurTextField: function(evt){
        var thisView = this,
            saveObj = {},
            attr = evt.currentTarget.parentElement.id;
        saveObj[attr] = evt.currentTarget.value;
        if (thisView.model.get(attr) !== saveObj[attr]) {
          thisView.model.save(saveObj, {parse: false, error: thisView.attrErrorHandler, patch: true});
        }
      },

      /**
       * Blur the dependency reason: save changes to server
       */
      blurDepReason: function(evt){
        var thisView = this,
            curTarget = evt.currentTarget,
            cid = curTarget.id.split("-")[0], // cid-reason
            reason = curTarget.value,
            dep = thisView.model.get("dependencies").get(cid);
        if (reason !== dep.get("reason")) {
          dep.save({"reason": reason}, {patch: true, parse: false, error: thisView.attrErrorHandler});
        }
      },

      /**
       * Load the reversion history for the given concept
       */
      loadConceptHistory: function (evt) {
        var thisView = this,
            conceptTag = thisView.model.get("tag"),
            consts = pvt.consts;

        // TODO remove hardcoding
        $.get("/concepts/" + conceptTag + "/history")
        .success(function (resp, xhr) {
          $("#" + consts.historyId).append($(resp).find("." + consts.reversionsClass));
        })
        .fail(function () {
            Utils.errorNotify("unable to load concept reversion history");
        });
      },

      // TODO create standalone views for the preqs
      togglePreqDetails: function (evt) {
        var parEl = evt.currentTarget.parentElement;
        $(parEl).toggleClass(pvt.consts.expClass);
      },

      isViewRendered: function(){
        return this.isRendered;
      }
    });
  })();
});
