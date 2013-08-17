/*
 * This file contains the node collection
 */
window.define(['backbone', 'underscore', 'jquery', 'agfk/models/node-model'], function(Backbone, _, $, NodeModel){
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
        ents.push(_.extend(response[key],{id: key})); // TODO change once id is generated server-side
      }
      return ents;
    },

    /**
     * Apply the user data to the given node collection
     */
    applyUserData: function(userModel){
      var thisColl = this,
          collNode;
      _.each(userModel.get("learnedNodes"), function(val, key){
        collNode = thisColl.get(key);
        if (collNode !== undefined){
          thisColl.get(key).setLearnedStatus(true);
        }
      });
    },

    /**
     * DFS to change the implicit learned count of the dependencies of rootTag
     */
    dfsChangeILCount: function(rootTag, ctChange){
      var thisColl = this,
          depNodes = [thisColl.get(rootTag)],
          nextRoot,
          addDepNode,
          passedNodes = {};
      ctChange = typeof ctChange === "boolean" ? (ctChange === true ? 1 : -1) : ctChange;
      // TODO assert ctChange is a number

      // DFS over the nodes
      while ((nextRoot = depNodes.pop())){
        $.each(nextRoot.getUniqueDependencies(), function(dct, dtag){
          if (!passedNodes.hasOwnProperty(dtag)){
            addDepNode = thisColl.get(dtag);
            addDepNode.incrementILCt(ctChange);
            passedNodes[dtag] = true;
            depNodes.push(addDepNode);
          }
        });
      }
    }
  });
});
