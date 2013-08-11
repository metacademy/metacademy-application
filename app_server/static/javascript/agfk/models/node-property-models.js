define(["backbone"], function(Backbone){
  /**
   * Comprehension question model
   */
  var Question = Backbone.Model.extend({
    /**
     * default values -- underscore attribs used to match data from server
     */
    defaults: function () {
      return {
        text: "",
        node: null
      };
    }
  });


  /**
   * Learning resource model
   */
  var Resource = Backbone.Model.extend({
    listFields: ['authors', 'dependencies', 'mark', 'extra', 'note'],

    /**
     * default values -- attributes match possible data from server
     */
    defaults: function() {
      return {
        title: "",
        location: "",
        url: "",
        node: null,
        resource_type: "",
        free: 0,
        edition: "",
        level: "",
        authors: [],
        dependencies: [],
        mark: [],
        extra: [],
        note: []
      };
    }
  });


  /**
   * general directed edge model
   */
  var DirectedEdge = Backbone.Model.extend({

    /**
     * default values -- underscore attribs used to match data from server
     */
    defaults: function () {
      return {
        from_tag: "",
        to_tag: "",
        reason: ""
      };
    },

    /**
     * Initialize the DE (currently sets the id properly)
     */
    initialize: function(inp){
      this.id = inp.id || inp.from_tag + inp.to_tag;
    },

    /**
     * return a dot (graphviz) representation of the edge
     */
    getDotStr: function(){
      if (this.get("from_tag")){
        return this.get("from_tag") + "->" + this.get("to_tag") + ';';
      }
      else{
        return "";
      }
    }
  });
  return {
    Question: Question,
    Resource: Resource,
    DirectedEdge: DirectedEdge
  };


});
