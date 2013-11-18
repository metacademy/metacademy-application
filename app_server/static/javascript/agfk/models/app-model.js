/*
 This file contains the central application model, which is a wrapper model for the other models in the agfk application
 */

define(["backbone", "agfk/models/graph-data-model", "agfk/models/user-data-model", "agfk/utils/errors"], function(Backbone, GraphData, UserData, ErrorHandler){
  "use strict";

  /**
   * Wrapper model for all application data (i.e. user and graph data)
   */
  return Backbone.Model.extend({
    /**
     * Default model attributes
     */
    defaults: function(){
      return {
        graphData: new GraphData(),
        userData: new UserData()
      };
    },

    /**
     * Initialize the model by binding the appropriate callback functions
     */
    initialize: function(){
      var thisModel = this,
          userData = thisModel.get("userData"),
          graphData = thisModel.get("graphData"),
          nodes = graphData.get("nodes");

      // set parentModel for userData and graphData
      graphData.parentModel = thisModel;
      userData.parentModel = thisModel;

      // Update user data when aux node data changes 
      // TODO: this is nonstandard but it follow the idea that the userData should reflect user-specific changes to the graph 
      // (there may be a better way to do this, but aux fields on the nodes themselves, such as "learnStatus,"
      // make it easy to trigger changes in the views for the specific node rather than the entire collection 
      userData.listenTo(nodes, "change:learnStatus", userData.updateLearnedConcept);
      userData.listenTo(nodes, "change:starStatus", userData.updateStarredConcept);
      userData.listenTo(nodes, "change:implicitLearnStatus", userData.updateImplicitLearnedNodes);
      userData.listenTo(nodes, "change:visibleStatus", userData.updateVisibleNodes);

      var aux = graphData.get("aux");
      aux.listenTo(userData, "change:learnedConcepts", aux.resetEstimates);
    },
    
    /**
     * Aux function to set graph data from wrapper model (TODO this function may not be necessary)
     */
    setGraphData: function(gdataObj){
        this.get("graphData").get("aux").set("depRoot", gdataObj.depRoot);
    },

    /**
     * Apply the user data obtained from the server to the graph
     * This function should be called after successfully fetching
     * data from the content server
     */
    applyUserDataToGraph: function(){
      var thisModel = this,
      userData = thisModel.get("userData");
      if (userData.areLearnedConceptsPopulated()){
        applyLearnedConcepts();
      } else{
        thisModel.listenTo(userData.get("learnedConcepts"), "reset", applyLearnedConcepts);
      }
      if (userData.areStarredConceptsPopulated()){
        applyStarredConcepts();
      } else{
        thisModel.listenTo(userData.get("starredConcepts"), "reset",   applyStarredConcepts);
      }

      function applyLearnedConcepts(){
        var learnedConcepts = userData.get("learnedConcepts");
        if (learnedConcepts.length > 0){
          thisModel.get("graphData").get("nodes").applyUserConcepts(learnedConcepts, "learned");
        }
      }
      function applyStarredConcepts(){
        var starredConcepts = userData.get("starredConcepts");
        if (starredConcepts.length > 0){
          thisModel.get("graphData").get("nodes").applyUserConcepts(starredConcepts, "starred");
        }
      }
    },

    /**
     * parse incoming json data
     */
    parse: function(response){
      // TODO check for extending the nodes vs resetting
      var thisModel = this,
          graphData = thisModel.get("graphData"),
          nodes = graphData.get("nodes"),
          edges = graphData.get("edges"),
          aux = graphData.get("aux");

      aux.set("titles", response.titles);

      // build node set
      nodes.add(response.nodes, {parse: true});
      
      delete response.nodes;
      return response;
    },

    /**
     * Specify URL for HTTP verbs (GET/POST/etc)
     */
    url: function(){
      var thisModel = this, 
          depTag = thisModel.get("graphData").get("aux").get("depRoot");
      // TODO post CR-Restruct handle different types of input (aggregated graphs) based on url
      ErrorHandler.assert(typeof depTag === "string", "dependency is not defined in backbone URL request"); 
      return window.CONTENT_SERVER + "/dependencies?concepts=" + depTag;
    }
  });

});
