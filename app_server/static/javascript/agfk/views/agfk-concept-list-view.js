
/*global define*/
define(["backbone", "underscore", "jquery", "agfk/views/agfk-concept-list-item", "lib/kmapjs/views/concept-list-view", "utils/utils"], function (Backbone, _, $, AGFKListItem, ConceptListView, Utils) {

  return (function () {
    var pvt = {};
    pvt.consts = _.extend(ConceptListView.prototype.getConstsClone(),
      {
        elNameAppend: "-button",
        elNavButtonClass: "el-nav-button"
      });

    return ConceptListView.extend({

      events: function(){
        var thisView = this,
        levts =  {
          "click .el-nav-button": "handleELButtonClick"
        };
        return _.extend(ConceptListView.prototype.events, levts);
      },

      /**
       * @override
       */
      useListTemplate: function () {
        return true;
      },

      postrender: function () {
        var thisView = this;
        thisView.$el.find("#" + pvt.consts.olId).append(thisView.$list);
        thisView.updateTimeEstimate();
      },

      /**
       * @override
       */
      postinitialize: function (inp) {
        var thisView = this,
            gConsts = window.agfkGlobals.auxModel.getConsts();
        thisView.ListItem = AGFKListItem;
        thisView.prevButtonEl = null;

        thisView.listenTo(window.agfkGlobals.auxModel,
                          gConsts.learnedTrigger, thisView.updateTimeEstimate);
        // initialization
        // thisView.listenTo(thisView.model, "sync", thisView.updateTimeEstimate);
        if (inp !== undefined) {
          thisView.appRouter = inp.appRouter;
        }
      },

      /**
       * Handle click event by passing relevant event info to changeActiveELButton
       */
      handleELButtonClick: function(evt){
        var thisView = this;
        var buttonEl = evt.currentTarget;
        thisView.changeActiveELButtonFromDomEl(buttonEl);
        thisView.appRouter.changeUrlParams({mode: buttonEl.id.split("-")[0]});
      },

      /**
       * Change the active button to the input name: "explore" or "learn"
       */
      changeActiveELButtonFromName: function(name){
        var $domEl = $("#" + name + pvt.consts.elNameAppend);
        if ($domEl.get(0)){
          this.changeActiveELButtonFromDomEl($domEl.get(0));
        }
      },

      /**
       * Change the active button to the input dom element (must be one of the EL buttons)
       */
      changeActiveELButtonFromDomEl: function(buttonEl){
        var thisView = this;
        if (thisView.prevButtonEl === null || buttonEl.id !== thisView.prevButtonEl.id){
          var activeClass = pvt.consts.activeClass,
              $prevButton = $(thisView.prevButtonEl);

          $prevButton.toggleClass(activeClass);
          $prevButton.prop("disabled", false);

          var $buttonEl = $(buttonEl);
          $buttonEl.toggleClass(activeClass);
          $buttonEl.prop("disabled", true);
          thisView.prevButtonEl = buttonEl;
        }
      },

      /**
       * Update the learning time estimate display
       */
      updateTimeEstimate: function(){
        // FIXME extract agfk out
        var thisView = this,
            nodes = thisView.model.getNodes(),
            timeEstimate,
            timeStr;
        if (nodes.getTimeEstimate){
          timeEstimate = nodes.getTimeEstimate();
          if (timeEstimate) {
            timeStr = "Completion Time: " + Utils.formatTimeEstimate(timeEstimate);
          } else {
            timeStr = "All done!";
          }
        } else {
          timeStr = "---";
        }
        thisView.$el.find(".time-estimate").html(timeStr); // TODO move hardcoding
      }
    });
  })();
});
