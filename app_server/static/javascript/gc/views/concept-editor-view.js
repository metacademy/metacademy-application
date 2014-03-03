
/*global define*/
define(["jquery", "backbone", "underscore", "gc/views/resource-editor-view", "agfk/models/concept-resource-model", "agfk/models/goal-model", "gc/views/goal-editor-view"], function($, Backbone, _, ResourceEditorView, ConceptResource, GoalModel, GoalEditorView){

  return (function(){
    var pvt = {};
    pvt.state = {
      visId: ""
    };
    pvt.consts = {
      templateId: "full-screen-content-editor",
      contentItemClass: "ec-display-wrap",
      resourcesTidbitWrapId: "resources-tidbit-wrap",
      goalsTidbitWrapId: "goals-tidbit-wrap"
    };

    pvt.failFun = function failFun (resp){
          // failure
          console.error("unable to verify new resource id -- TODO inform user -- msg: "
                        + resp.responseText);
        };

    return Backbone.View.extend({
      template: _.template(document.getElementById(pvt.consts.templateId).innerHTML),

      events: {
        "blur .title-input": "blurTitleField",
        "blur .ec-display-wrap > textarea": "blurTextField",
        "blur input.dep-reason": "blurDepReason",
        "click .ec-tabs button": "changeDisplayedSection",
        "click #add-resource-button": "addResource",
        "click #add-goal-button": "addGoal",
        "change .goal-check-input .check-field": "changeDepGoal"
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
        thisView.isRendered = true;
        return thisView;
      },

      addGoal: function () {
        var thisView = this,
            gid = Math.random().toString(36).substr(8),
            newGoal = new GoalModel({id: gid, concept: thisView.model}),
            deps = thisView.model.get("dependencies"),
            ols = thisView.model.get("outlinks");
        // add goal to goal list
        thisView.model.get("goals").add(newGoal, {at: 0});

        newGoal.save(null, {parse: false, success: function () {
          // FIXME this is an awkward way to update the deps and ols
          deps.save(null, {parse: false});
          ols.save(null, {parse: false});
        }});

        // TODO we need to update all of the source/targets, hmmm
        thisView.render();
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
        dep.save(saveObj, {patch: true, parse: false});
      },

      addResource: function () {
        var thisView = this,
            rid = Math.random().toString(36).substr(8),
            grid = Math.random().toString(36).substr(8),
            newRes = new ConceptResource({id: rid});
        newRes.get("global_resource").set("id", grid);
        newRes.parent = thisView.model;
        newRes.set("concept", thisView.model);

        // TODO fix hardcoded URLS!
        $.get(window.agfkGlobals.idcheckUrl, {id: rid, type: "resource" })
        .success(function (resp) {
            newRes.set("id", resp.id);
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
        pvt.state.visId = evt.currentTarget.id.substr(4);
        this.render();
      },

      blurTitleField: function(evt){
        this.model.save({"title": evt.currentTarget.value}, {parse: false, patch: true});
      },

      /**
       * Changes text field values for simple attributes of models
       * the id of the containing element must match the attribute name
       */
      blurTextField: function(evt){
        var saveObj = {};
        saveObj[evt.currentTarget.parentElement.id] = evt.currentTarget.value;
        this.model.save(saveObj, {parse: false, patch: true});
      },

      blurDepReason: function(evt){
        var curTarget = evt.currentTarget,
            cid = curTarget.id.split("-")[0], // cid-reason
            reason = curTarget.value;
        this.model.get("dependencies").get(cid).save({"reason": reason}, {patch: true, parse: false});
      },

      isViewRendered: function(){
        return this.isRendered;
      }
    });
  })();
});
