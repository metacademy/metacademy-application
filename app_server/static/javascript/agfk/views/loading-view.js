(function(AGFK, Backbone, _, undefined){
  "use strict";

  /**
   * Simple "loading" view
   * TODO we could have an aux model that maintains ajax request state / graph loading request state
   * and updates this view appropriately
   */
  AGFK.LoadingView = Backbone.View.extend({
    template: _.template(document.getElementById("loading-view-template").innerHTML),
    className: "load-content",        
    render: function(){
      this.$el.html(this.template());
      return this;
    }
  });

})(window.AGFK = window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {}, window.Backbone, window._);
