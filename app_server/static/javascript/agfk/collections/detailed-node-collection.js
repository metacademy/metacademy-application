define(['agfk/collections/node-collection', 'agfk/models/detailed-node-model'], function(NodeCollection, DetailedNodeModel){
  return NodeCollection.extend({model: DetailedNodeModel});
});
