/*
 * This file contains the node collection
 */
define(['backbone', 'underscore', 'jquery', 'agfk/models/node-model'], function(Backbone, _, $, NodeModel){
  "use strict";
  
  /**
   * Collection of all node models in graph
   */
  return Backbone.Collection.extend({
    model: NodeModel,

    initialize: function(){
      var thisColl = this;
      this.on("change:learnStatus", thisColl.dfsChangeILCount);
    },
    /**
     * parse incoming json data
     */
    parse: function(response){
      var ents = [];
      for (var key in response) {
        // place the server id in "sid" since all deps are returned in terms of the tag
        ents.push(_.extend(response[key],{sid: response[key].id, id: key})); 
      }
      return ents;
    },

    /**
     * Apply the user data to the given node collection
     */
    applyLearnedConcepts: function(learnedConcepts){
      var thisColl = this,
          collNode;
      learnedConcepts.each(function(lcModel){
        collNode = thisColl.findWhere({sid: lcModel.get("id")});
        if (collNode !== undefined){
          collNode.setLearnedStatus(true);
        }
      });
    },

    /**
     * DFS to change the implicit learned count of the dependencies of rootTag
     * This method works by changing the implicitLearnCt of unique dependent concepts
     * if the learned status of the root node changes
     */
    dfsChangeILCount: function(rootTag, ctChange){
        var thisColl = this,     
            rootNode = thisColl.get(rootTag);
          if (rootNode.getImplicitLearnStatus()){
            return false;
          }
     
      var depNodes = [rootNode],
          nextRoot,
          addDepNode,
          passedNodes = {};
      ctChange = typeof ctChange === "boolean" ? (ctChange === true ? 1 : -1) : ctChange;

      // DFS over the nodes
        while ((nextRoot = depNodes.pop())){
        $.each(nextRoot.getUniqueDependencies(), function(dct, dtag){
          addDepNode = thisColl.get(dtag);
          var initStatus = addDepNode.isLearnedOrImplicitLearned();
          addDepNode.incrementILCt(ctChange);
          if (addDepNode.isLearnedOrImplicitLearned() !== initStatus && !passedNodes.hasOwnProperty(dtag)){
            depNodes.push(addDepNode);
            passedNodes[dtag] = true;
          }
        });
      }
      return true;
    }
  });
});
