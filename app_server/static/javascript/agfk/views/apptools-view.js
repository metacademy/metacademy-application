define(["jquery", "backbone", "agfk/utils/errors"], function($, Backbone, ErrorHandler){
  "use strict";

  /**
   * Application Tools View
   */
  var AppToolsView = (function(){
    var pvt = {};
    pvt.prevButtonEl = null;
    pvt.viewConsts = {
      activeClass: "active",
      elNameAppend: "-button",
      elNavButtonClass: "el-nav-button",
      clearLearnedId: "button-clear-learned",
      showLearnedId: "button-show-learned",
      disabledClass: "disabled"
    };
    pvt.numVisLearned = 0;
    pvt.numLearned = 0;

    /**
     * helper function to enable/disable the appropriate clear/show learned button
     */
    pvt.changeShowHideButtons = function(elId, enable){
      var $el = $("#" + elId);
      if (enable){
        $el.removeClass(pvt.viewConsts.disabledClass);
        $el.prop("disabled", false);
      } else{
        $el.addClass(pvt.viewConsts.disabledClass);
        $el.prop("disabled", true);
      }
    };
    
    pvt.enableHide = function(){
      pvt.changeShowHideButtons(pvt.viewConsts.clearLearnedId, true);
    };
    
    pvt.disableHide = function(){
      pvt.changeShowHideButtons(pvt.viewConsts.clearLearnedId, false);
    };

    pvt.disableShow = function(){
      pvt.changeShowHideButtons(pvt.viewConsts.showLearnedId, false);
    };

    pvt.enableShow = function(){
      pvt.changeShowHideButtons(pvt.viewConsts.showLearnedId, true);
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

        var aux = window.agfkGlobals.auxModel;
        
        // enable/disable the hide/show buttons
        thisView.listenTo(thisView.model.get("options"), "change:showLearnedConcepts", thisView.changeShowHideState);
        thisView.listenTo(aux, "change:learnedConcepts", thisView.handleChLearnStatus ); // listen for check clicks
        thisView.listenTo(thisView.model.get("nodes"), "sync", function(){
          thisView.model.get("nodes").each(function(node){
            if (aux.conceptIsLearned(node.id)){
              thisView.handleChLearnStatus(node.id, node.get("sid"), true);
            };
          });
        });
      },

      /**
       *  Change the show/hide learned concepts buttons state
       */
      changeShowHideState: function(chmodel, chstate){
        if (chstate){
          // enables the "hide learned concepts" and disables "show learned concepts"
          pvt.numVisLearned = pvt.numLearned;
          pvt.enableHide();
          pvt.disableShow();
        } else{
          // enables the "show learned concepts" and disables "hide learned concepts"
          pvt.numVisLearned = 0;
          pvt.disableHide();
          pvt.enableShow();
        }
      },

      /**
       * Handle changing node status
       */
      handleChLearnStatus: function(tag, nodesid, state){
       // keep count of the number of visible learned nodes
        if (state){
          pvt.numVisLearned++;
          pvt.numLearned++;
          if (pvt.numVisLearned === 1){
            pvt.enableHide();
          }
        }
        else{
          pvt.numVisLearned--;
          pvt.numLearned--;
          if(pvt.numVisLearned === 0){
            pvt.disableHide();
          }
        }
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
        if (!$(evt.currentTarget).hasClass(pvt.viewConsts.disabledClass)){
          this.model.get("options").setLearnedConceptsState(false);
        }
      },

      /**
       * Handle click event for showing the [implicitly] learned nodes
       */
      handleShowLearnedClick: function(evt){
        if (!$(evt.currentTarget).hasClass(pvt.viewConsts.disabledClass)){
          this.model.get("options").setLearnedConceptsState(true);
        }
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
