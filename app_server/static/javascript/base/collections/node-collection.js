/**
 * This file contains the node collection
 * it is a basic collection that should not depend on aux
 */

/*global define */
define(['backbone', 'underscore', 'jquery', 'base/models/node-model'], function(Backbone, _, $, NodeModel){
  "use strict";

  /**
   * Collection of all node models in graph
   */
  return Backbone.Collection.extend({
    model: NodeModel
  });
});
