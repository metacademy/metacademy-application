define(["backbone"], function(Backbone){ 
  "use strict";

  /**
   * Simple error view 
   */
  var pvt = {};
  pvt.viewConsts = {
    errorWrapClass: "app-error-wrapper", // must also change in main.js
    noContentErrorKey: "nocontent", // musst also change in router.js
    ajaxErrorKey: "ajax", // musst also change in router.js
    unsupportedBrowserKey: "unsupportedbrowser", // musst also change in router.js
    closeMessageClass: "close-error-message" // must also change in events definition
  };

  /**
   * Obtain button that closes the error message (this view)
   */
  pvt.getCloseMessageEl = function(){
    var button = window.document.createElement("button");
    button.className = pvt.viewConsts.closeMessageClass;
    button.textContent = "close message";
    return button;
  };
  
  pvt.isRendered = false;
  
  return Backbone.View.extend({
    className: pvt.viewConsts.errorWrapClass,
    events: {
      "click .close-error-message": "close"
    },
    
    /**
     * Initialize the view
     * inp.errorType: type of error (see viewConsts *Key)
     * inp.extra: extra information to accompany the error
     */
    initialize: function(inp){
      if (inp){
        this.errorType = inp.errorType;
        this.extra = inp.extra;
      }
    },
    
    /**
     * Render the error view
     * inp.errorType: type of error (see viewConsts *Key)
     * inp.extra: extra information to accompany the error
     */
    render: function(inp){
      var thisView = this;
      pvt.isRendered = false;
      var thisView = this,
          viewConsts = pvt.viewConsts,
          errorMessage;

      if (inp){
        thisView.errorType = inp.errorType || thisView.errorType;
        thisView.extra = inp.extra || thisView.extra;
      }

      switch (thisView.errorType){
      case viewConsts.noContentErrorKey:
        errorMessage = "Unfortuneately, it appears that this concept does not exist yet. "
          + "Perhaps search for a different concept or check out our " + '<a href="/list" class="internal-link underline" target="_self">list of concepts</a>.';
        break;
      case viewConsts.unsupportedBrowserKey:
        errorMessage = "Sorry, Your browser is currently not supported for this application. Consider updating your browser (IE 10 works, if you want to use IE) or switching to Firefox/Chrome/Opera/Safari when using Metacademy.org.";
        break;
      case viewConsts.ajaxErrorKey:
        errorMessage = "Sorry: We encountered a problem trying to load content from "
          + "our server. Refreshing your browser may fix this issue.";
        break;
      default:
        errorMessage = "An error occured. Sorry about that. "
          + "Refreshing your browser may solve the problem.";
      }
      var pel = window.document.createElement("p");
      pel.innerHTML = errorMessage;
      thisView.$el.append(pel);
      thisView.$el.append(pvt.getCloseMessageEl());
      pvt.isRendered = true;
      
      return thisView;
    },

    /**
     * Return true if the view has been rendered
     */
    isRendered: function(){
      return pvt.isRendered;
    },

    /**
     * Close and unbind views to avoid memory leaks TODO make sure to unbind any listeners
     */
    close: function() {
      this.remove();
      this.unbind();
    }


  });
});
