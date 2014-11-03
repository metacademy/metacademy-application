// FIXME TODO - must return errors to the user in an elegant way, both client side (here) and from the server

/*global define*/
define(["backbone", "underscore", "jquery", "gc/views/base-editor-view"], function(Backbone, _, $, BaseEditorView){
  return  (function(){

    var pvt = {};
    pvt.consts = {
      templateId: "dependency-editor-template",
      expClass: "expanded"
    };

    return BaseEditorView.extend({
      template: _.template(document.getElementById(pvt.consts.templateId).innerHTML),
      className: "dep-entry input-form",
      tagName: "li",
      id: function () {
        return this.model.cid + "-dep";
      },

      events: function () {
        var oevts = BaseEditorView.prototype.events();
        oevts["blur input.dep-reason"] = "blurDepReason";
        oevts["change .goal-check-input .check-field"] = "changeDepGoal";
        oevts["click .ec-button"] = "togglePreqDetails";
        return oevts;
      },

      /**
       * render the view and return the view element
       */
      render: function(){
        var thisView = this;
        thisView.isRendered = false;
        thisView.$el.html(thisView.template(thisView.model.attributes));
        thisView.isRendered = true;
        return thisView;
      },

      /**
       * Blur the dependency reason: save changes to server
       */
      blurDepReason: function(evt){
        var thisView = this,
            curTarget = evt.currentTarget,
            reason = curTarget.value,
            dep = thisView.model;
        if (reason !== dep.get("reason")) {
          dep.save({"reason": reason}, {patch: true, parse: false, error: thisView.attrErrorHandler});
        }
      },

      changeDepGoal: function (evt) {
        var thisView = this,
            thisModel = thisView.model,
            $domEl = $(evt.currentTarget),
            goalId = $domEl.prop("value"),
            goalType = $domEl.prop("name").split("-")[0], // source_goals or target_goals
            goal = thisModel.get(goalType.split("_")[0]).get("goals").get(goalId);

        if ($domEl.prop("checked")) {
          thisModel.get(goalType).add(goal);
        } else {
          thisModel.get(goalType).remove(goal);
        }
        var saveObj = {};
        saveObj[goalType] = thisModel.get(goalType);
        thisModel.save(saveObj, {patch: true, parse: false, error: thisView.attrErrorHandler});
      },

      togglePreqDetails: function (evt) {
        var parEl = evt.currentTarget.parentElement;
        $(parEl).toggleClass(pvt.consts.expClass);
      },

      /**
       * Rerender the graph after removing an edge
       */
      postDestroy: function () {

      }
    });
  })();
});
