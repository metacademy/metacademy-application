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
      userData.listenTo(nodes, "change:learnStatus", userData.updateLearnedNodes);
      userData.listenTo(nodes, "change:implicitLearnStatus", userData.updateImplicitLearnedNodes);
      userData.listenTo(nodes, "change:visibleStatus", userData.updateVisibleNodes);
    },
    
    /**
     * Aux function to set graph data from wrapper model (TODO this function may not be necessary)
     */
    setGraphData: function(gdataObj){
      // TODO make this function more general (if we keep it)
      if (gdataObj.hasOwnProperty("depRoot")){
	this.get("graphData").get("aux").set("depRoot", gdataObj.depRoot);
      }
    },

    /**
     * parse incoming json data
     */
    parse: function(response){
      // TODO we should also parse/obtain user-data here CR-Restruct
      // TODO check for extending the nodes vs resetting
      var thisModel = this,
	  graphData = thisModel.get("graphData"),
	  nodes = graphData.get("nodes"),
	  edges = graphData.get("edges"),
	  aux = graphData.get("aux");

      aux.set("titles", response.titles); // TODO: change this to response.aux.titles?

      // build node set
      nodes.add(response.nodes, {parse: true});
      nodes.applyUserData(thisModel.get("userData"));

      // build edge set from nodes
      nodes.each(function(node){
	// add all edges from nodes
	["dependencies", "outlinks"].forEach(function(edgeType){
	  node.get(edgeType).each(function(edge){
	    edges.add(edge);
	    edge.graphEdgeCollection = edges;
	  });
	});
      });
      
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
