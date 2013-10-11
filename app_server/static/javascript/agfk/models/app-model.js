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
    },

    /**
     * parse incoming json data
     */
    parse: function(response){
      // TODO check for extending the nodes vs resetting
      var thisModel = this,
          graphData = thisModel.get("graphData"),
          nodes = graphData.get("nodes");

      window.agfkGlobals.auxModel.set("titles", response.titles);

      // build node set
      nodes.add(response.nodes, {parse: true});
      nodes.changeILNodesFromTag();
      
      delete response.nodes;
      return response;
    },

    /**
     * Specify URL for HTTP verbs (GET/POST/etc)
     */
    url: function(){
      var depTag = window.agfkGlobals.auxModel.get("depRoot");
      // TODO post CR-Restruct handle different types of input (aggregated graphs) based on url
      ErrorHandler.assert(typeof depTag === "string", "dependency is not defined in backbone URL request"); 
      return window.CONTENT_SERVER + "/dependencies?concepts=" + depTag;
    }
  });

});
