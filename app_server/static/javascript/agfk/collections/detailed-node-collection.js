/*global define*/
define(['base/collections/node-collection', 'agfk/models/detailed-node-model', 'underscore'], function(NodeCollection, DetailedNodeModel, _){
  return NodeCollection.extend({
    model: DetailedNodeModel,

    // /*
    //  * Specify URL for HTTP verbs (GET/POST/etc)
    //  */
    // url: function(){
    //   var depTag = window.agfkGlobals.auxModel.get("depRoot");
    //   return window.CONTENT_SERVER + "/dependencies?concepts=" + depTag;
    // },

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
