define(['agfk/collections/node-collection', 'agfk/models/detailed-node-model', 'underscore'], function(NodeCollection, DetailedNodeModel, _){
  return NodeCollection.extend({
    model: DetailedNodeModel,

    initialize: function(){
      var aux = window.agfkGlobals.auxModel,
          thisColl = this;
      if (aux){
        thisColl.listenTo(aux, aux.getConsts().learnedTrigger, thisColl.changeILNodesFromTag);
      }
      thisColl.on("sync", function(){
          thisColl.changeILNodesFromTag();
      });
    },

    /**
     * DFS to change the implicit learned status of the dependencies of rootTag
     */
    changeILNodesFromTag: function(){
      // TODO cache learned/implicit learned nodes
      var thisCollection = this,
          aux = window.agfkGlobals.auxModel,
          depRoot = aux.get("depRoot"),
          isShortcut = thisCollection.get(depRoot).get("is_shortcut"),
          unlearnedDepTags = _.map(aux.computeUnlearnedDependencies(depRoot, isShortcut), function(tagO){return tagO.from_tag;});

      thisCollection.each(function(node){
        if (unlearnedDepTags.indexOf(node.id) > -1){
          node.setImplicitLearnStatus(false);
        } else if (node.id !== depRoot){
          node.setImplicitLearnStatus(!aux.conceptIsLearned(node.id));
        }
      });
    },

    /*
     * Specify URL for HTTP verbs (GET/POST/etc)
     */
    url: function(){
      var depTag = window.agfkGlobals.auxModel.get("depRoot");
      return window.CONTENT_SERVER + "/dependencies?concepts=" + depTag;
    },

    /* Learning time estimate for the given node collection */
    getTimeEstimate: function(){
      var aux = window.agfkGlobals.auxModel,
          total = 0;
      
      this.each(function(node) {
        if (!aux.conceptIsLearned(node.id) && !node.getImplicitLearnStatus()) {
          if (node.get("time")) {
            total += node.get("time");
          } else {
            total += 1;     // reasonable guess when the time is unknown
          }
        }
      });
      return total;
    }

  });

});
