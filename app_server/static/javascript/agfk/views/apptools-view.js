define(["jquery", "backbone", "agfk/utils/errors"], function($, Backbone, ErrorHandler){
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
    
    return Backbone.View.extend({
      el: document.getElementById(pvt.viewConsts.elId),
      
      events: {
        "click .el-nav-button": "handleELButtonClick",
        "click #button-clear-learned": "handleClearLearnedClick",
        "click #button-show-learned": "handleShowLearnedClick",
        "click #button-add-concept": "handleAddConceptClick",
        "click #button-remove-concept": "handleRemoveConceptClick"
      },

      appRouter: null,

      initialize: function(inp){
        this.appRouter = inp.appRouter;
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
       * Handle click event for adding a given concept
       */
      handleAddConceptClick: function(evt){
        alert("not yet implemented");
      },

      /**
       * Handle click event for removing a given concept
       */
     handleRemoveConceptClick: function(evt){
        alert("not yet implemented");
      },

      /**
       * Handle click event by passing relevant event info to changeActiveELButton
       */
      handleELButtonClick: function(evt){
        var buttonEl = evt.currentTarget;
        this.changeActiveELButtonFromDomEl(buttonEl);
        this.appRouter.changeUrlParams({mode: buttonEl.id.split("-")[0]});
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
      
      render: function(){
        return this;
      }
    });
  })();

  // return require.js object
  return AppToolsView;
});
