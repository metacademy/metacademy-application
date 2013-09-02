window.define(["jquery", "backbone", "agfk/utils/errors"], function($, Backbone, ErrorHandler){
  "use strict";

  /**
   * Simple explore-learn button toggle view
   */
  var AppToolsView = (function(){
    var pvt = {};
    pvt.prevButtonEl = null;
    pvt.viewConsts = {
      activeClass: "active",
      elNameAppend: "-button",
      elNavButtonClass: "el-nav-button",
      clearLearnedId: "button-clear-learned",
      showLearnedId: "button-show-learned"
    };

    pvt.isRendered = true; // view is prerendered 
    
    return Backbone.View.extend({
      appRouter: null,

      initialize: function(inp){
        var thisView = this,
            viewConsts = pvt.viewConsts;
        thisView.appRouter = inp.appRouter;
        $('.' + viewConsts.elNavButtonClass).on("click", function(evt){
          thisView.handleELButtonClick.call(thisView, evt);
        });
        $('#' + viewConsts.clearLearnedId).on("click", function(evt){
          thisView.handleClearLearnedClick.call(thisView, evt);
        });
        $('#' + viewConsts.showLearnedId).on("click", function(evt){
          thisView.handleShowLearnedClick.call(thisView, evt);
        });
      },

      /**
       * Return true if the view has been rendered
       */
      isRendered: function(){
        return pvt.isRendered();
      },

      /**
       * Handle click event for showing the [implicitly] learned nodes
       */
      handleClearLearnedClick: function(evt){
        // TODO: check that learned concepts have changed
        this.model.get("options").setLearnedConceptsState(false);
      },

      /**
       * Handle click event for showing the [implicitly] learned nodes
       */
      handleShowLearnedClick: function(evt){
        this.model.get("options").setLearnedConceptsState(true);
      },

      /**
       * Handle click event by passing relevant event info to changeActiveELButton
       */
      handleELButtonClick: function(evt){
        var thisView = this;
        var buttonEl = evt.currentTarget;
        thisView.changeActiveELButtonFromDomEl(buttonEl);
        thisView.appRouter.setELTransition(true);
        // 10 ms delay to let the UI update (looks smoother)
        window.setTimeout(function(){
            thisView.appRouter.changeUrlParams({mode: buttonEl.id.split("-")[0]});
        }, 10);
      },

      /**
       * Change the active button to the input name: "explore" or "learn"
       */
      changeActiveELButtonFromName: function(name){
        var $domEl = $("#" + name + pvt.viewConsts.elNameAppend);
        ErrorHandler.assert($domEl.hasClass(pvt.viewConsts.elNavButtonClass),
                            "changeActiveELButtonFromName did not obtain the correct dom element from name:" + name);
        this.changeActiveELButtonFromDomEl($domEl.get(0));
      },
      
      /**
       * Change the active button to the input dom element (must be one of the EL buttons)
       */
      changeActiveELButtonFromDomEl: function(buttonEl){
        if (pvt.prevButtonEl === null || buttonEl.id !== pvt.prevButtonEl.id){
          var activeClass = pvt.viewConsts.activeClass;
          $(pvt.prevButtonEl).toggleClass(activeClass);
          $(buttonEl).toggleClass(activeClass);
          pvt.prevButtonEl = buttonEl;
        }
      },

      /**
       * Render the apptools view
       */
      render: function(){
        pvt.viewRendered = true;
        return this;
      },

      /**
       * Close and unbind views to avoid memory leaks 
       */
      close: function() {
        this.remove();
        this.unbind();
      }
      
    });
  })();

  // return require.js object
  return AppToolsView;
});
