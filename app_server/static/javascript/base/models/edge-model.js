define(["backbone"], function(Backbone){
  /**
   * general directed edge model
   */
    return Backbone.Model.extend({

    /**
     * default values -- underscore attribs used to match data from server
     */
    defaults: function () {
      return {
        from_tag: "",
        to_tag: "",
        reason: "",
        shortcut: ""
      };
    },

    /**
     * Initialize the DE (currently sets the id properly)
     */
    initialize: function(inp){
      // FIXME does this handle all cases?
      this.id = inp.id || inp.from_tag + inp.to_tag;
    }
  });
});
