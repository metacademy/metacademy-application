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

    getCore: function(){
      return new ResourceCollection(this.where({core: 1}));
    },

    getSupplemental: function(){
      return new ResourceCollection(this.where({core: 0}));
    },

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
