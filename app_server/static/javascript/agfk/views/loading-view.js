define(["backbone"], function(Backbone){ 
  "use strict";

  /**
   * Simple "loading" view
   * TODO we could have an aux model that maintains ajax request state / graph loading request state
   * and updates this view appropriately
   */
  var pvt = {};
  pvt.viewConsts = {
    viewID: "loading-view-template"
  };
  pvt.isRendered = false;
  return Backbone.View.extend({
    className: "load-content",
    el: document.getElementById(pvt.viewConsts.viewId),
    
    /* render: view html does not use a template */
    render: function(){
      pvt.isRendered = true;
      return this;
    },

    /**
     * Return true if the view has been rendered
     */
    isRendered: function(){
      return pvt.isRendered;
    }
    
  });

});
