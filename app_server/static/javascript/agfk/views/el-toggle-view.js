(function(AGFK, $, undefined){
  "use strict";

  /**
   * Simple explore-learn button toggle view
   */
  AGFK.ELToggleView = (function(){
    var pvt = {};
    pvt.prevButtonEl = null;
    pvt.viewConsts = {
      activeClass: "active",
      elNameAppend: "-button",
      elNavButtonClass: "el-nav-button",
      elId: "explore-learn-button-wrapper"
    };
    
    return Backbone.View.extend({
      el: document.getElementById(pvt.viewConsts.elId),
      
      events: {
        "click button": "handleELButtonClick"
      },

      /**
       * Handle click event by passing relevant event info to changeActiveELButton
       */
      handleELButtonClick: function(evt){
        var buttonEl = evt.currentTarget;
        this.changeActiveELButtonFromDomEl(buttonEl);
        AGFK.appRouter.changeUrlParams({mode: buttonEl.id.split("-")[0]});
      },

      /**
       * Change the active button to the input name: "explore" or "learn"
       */
      changeActiveELButtonFromName: function(name){
        var domEl = document.getElementById(name + pvt.viewConsts.elNameAppend);
          AGFK.errorHandler.assert(domEl && domEl.classList && domEl.classList.contains(pvt.viewConsts.elNavButtonClass),
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

})(window.AGFK = window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {}, window.$);
