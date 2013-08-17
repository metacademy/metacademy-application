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
      elId: "meta-app"
    };

    pvt.isRendered = true; // view is prerendered 
    
    return Backbone.View.extend({
      el: document.getElementById(pvt.viewConsts.elId),
      
      events: {
        "click .el-nav-button": "handleELButtonClick",
        "click #button-clear-learned": "handleClearLearnedClick",
        "click #button-show-learned": "handleShowLearnedClick"
      },

      appRouter: null,

      initialize: function(inp){
        this.appRouter = inp.appRouter;
      },

      /**
       * Return true if the view has been rendered
       */
      isRendered: function(){
        return pvt.isRendered();
      },

      /**
       * Handle click event for clearing the [implicitly] learned nodes
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
        // 10 ms delay to let the UI update (looks smoother)
        window.setTimeout(function(){
            thisView.appRouter.changeUrlParams({mode: buttonEl.id.split("-")[0]});
        }, 10);
      },

      /**
       * Change the active button to the input name: "explore" or "learn"
       */
      changeActiveELButtonFromName: function(name){
        var domEl = document.getElementById(name + pvt.viewConsts.elNameAppend);
        ErrorHandler.assert(domEl && domEl.classList && domEl.classList.contains(pvt.viewConsts.elNavButtonClass),
                            "changeActiveELButtonFromName did not obtain the correct dom element from name:" + name);
        this.changeActiveELButtonFromDomEl(domEl);
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
