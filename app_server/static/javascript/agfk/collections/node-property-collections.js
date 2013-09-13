/*
 Collections that are properties of the Node model
 */

define(["backbone", "agfk/models/node-property-models"], function(Backbone, NodePropertyModels){

  /**
   * collection of resource models
   */
  var ResourceCollection = Backbone.Collection.extend({
    model: NodePropertyModels.Resource,

    /**
     * Returns a backbone collection of the free resources TODO does this maintain the cid correctly?
     */
    getFreeResources: function(){
      return new ResourceCollection(this.where({free: 1}));
    },

    /**
     * Returns a backbone collection of the paid resources TODO does this maintain the cid correctly?
     */
    getPaidResources: function(){
      return new ResourceCollection(this.where({free: 0}));
    },

    getStarredResources: function(){
      return new ResourceCollection(this.filter(function(rsrc){
        return rsrc.get("mark").indexOf("star") !== -1;
      }));
    },

    getCore: function(){
      return new ResourceCollection(this.filter(function(rsrc){
        return rsrc.get("mark").indexOf("star") !== -1;
      }));
    },

    getSupplemental: function(){
      return new ResourceCollection(this.filter(function(rsrc){
        return rsrc.get("mark").indexOf("star") === -1;
      }));
    },

    getMessage: function(){
      if (this.getFreeResources().getStarredResources().length > 0) {
        return "Read/watch one starred resource, and go to any of the others for additional clarification.";
      } else if (this.getStarredResources().length > 0) {
        return "Sorry, we haven't found any free resources which fit nicely with our graph structure. Read/watch one of the starred resources if you happen to have it available, and go to any of the others for additional clarification.";
      } else if (this.length > 0) {
        return "Sorry, we haven't found any resources which fit nicely with the graph structure. Maybe you'll find some of the following helpful anyway.";
      } else {
        return "Sorry, we haven't finished annotating this concept yet."
      }
    },

    /**
     * Keep the resource sorted by mark !== 'star'
     */
    comparator: function(rsrc){
      return rsrc.get("mark").indexOf("star") === -1;
    }
  });


  /**
   * Collection of directed edge models TODO post CR-Restruct consider using subets of GraphEdgeCollections -- this will be problematic when adding new data
   */
  var DirectedEdgeCollection = Backbone.Collection.extend({
    model: NodePropertyModels.DirectedEdge
  });


  /**
   * Collection of question models
   */
  var QuestionCollection = Backbone.Collection.extend({
    model: NodePropertyModels.Question
  });


  /**
   * Collection of all edge models in graph
   */
  var GraphEdgeCollection = Backbone.Collection.extend({
    model: NodePropertyModels.DirectedEdge
  });


  return {
    DirectedEdgeCollection: DirectedEdgeCollection,
    GraphEdgeCollection: GraphEdgeCollection,
    QuestionCollection: QuestionCollection,
    ResourceCollection: ResourceCollection
  };
});
