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

    /**
     * parse incoming json data
     */
    parse: function(response){
      var ents = [];
      
      for (var key in response) {
        // place the server id in "sid" since all deps are returned in terms of the tag
        ents.push(_.extend(response[key],{sid: response[key].id, id: response[key].tag})); 
      }
      return ents;
    },


      
      
      //   var thisColl = this,     
      //       rootNode = thisColl.get(rootTag);
      //     if (rootNode.getImplicitLearnStatus()){
      //       return false;
      //     }
     
      // var depNodes = [rootNode],
      //     nextRoot,
      //     addDepNode,
      //     passedNodes = {};
      // ctChange = typeof ctChange === "boolean" ? (ctChange === true ? 1 : -1) : ctChange;

      // // DFS over the nodes
      //   while ((nextRoot = depNodes.pop())){
      //   nextRoot.get("dependencies").each(function(dep){
      //     var dtag = dep.get("from_tag");
      //     addDepNode = thisColl.get(dtag);
      //     var initStatus = addDepNode.isLearnedOrImplicitLearned();
      //     addDepNode.incrementILCt(ctChange);
      //     if (addDepNode.isLearnedOrImplicitLearned() !== initStatus && !passedNodes.hasOwnProperty(dtag)){
      //       depNodes.push(addDepNode);
      //       passedNodes[dtag] = true;
      //     }
      //   });
      // }
      // return true;
    //},

    getTimeEstimate: function(){
      var total = 0;
      // this.each(function(node) {
      //   if (!node.isLearnedOrImplicitLearned()) {
      //     if (node.get("time")) {
      //       total += node.get("time");
      //     } else {
      //       total += 1;     // reasonable guess when the time is unknown
      //     }
      //   }
      // });
      return total;
    }
    
  });
});
