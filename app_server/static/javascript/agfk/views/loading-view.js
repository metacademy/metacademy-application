window.define(["backbone", "underscore"], function(Backbone, _){ 
  "use strict";

  /**
   * Simple "loading" view
   * TODO we could have an aux model that maintains ajax request state / graph loading request state
   * and updates this view appropriately
   */
  var pvt = {};
  pvt.isRendered = false;
  return Backbone.View.extend({
    template: _.template(document.getElementById("loading-view-template").innerHTML),
    className: "load-content",        
    render: function(){
      this.$el.html(this.template());
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
