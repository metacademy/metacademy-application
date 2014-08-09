
/*global define */

define(["jquery", "backbone", "underscore", "dagre", "gc/collections/editable-edge-collection", "gc/collections/editable-node-collection", "agfk/models/explore-graph-model", "utils/utils"], function($, Backbone, _, dagre, EditableEdgeCollection, EditableNodeCollection, ExploreGraphModel, Utils){

  return ExploreGraphModel.extend({
    defaults:function(){
      var exDef = {
        nodes: new EditableNodeCollection(),
        edges: new EditableEdgeCollection(),
        title: "Untitled Graph"
      };
      return _.extend({}, ExploreGraphModel.prototype.defaults(), exDef);
    },

    url: function () {
      return window.APIBASE + "graph/" + this.id + "/";
    },

    isPopulated: function() {
      return true;
    },

    /**
     * @Override
     */
    postRemoveEdge: function (edge) {
      edge.destroy();
    },

    /**
     * @Override
     */
    postAddEdge: function (edge, isNewEdge) {
      var thisModel = this;
      // if it needs the server id it'll be saved after the node id returns
      // so don't save the graph here
      edge.set("ordering", _.max(thisModel.getEdges().pluck("ordering")) + 1);
      if (isNewEdge && !edge.needsServerId) {
        edge.save(null,
                  {parse: false,
                   success: function () {
                     thisModel.save(null,
                                    {parse: false,
                                     success:  function (){
                                       Utils.urlFromNewToId(thisModel.id);
                                     },
                                     error: function () {
                                       Utils.errorNotify("unable to save dependency to server");
                                     }
                                    });
                   }
                  });
      }
    },

    /**
     * @Override
     */
    postRemoveNode: function (node) {
      node.destroy();
    },

    /**
     * @Override
     */
    postAddNode: function (node, isNewNode) {
      if (!isNewNode) {
        node.hasServerId = true;
        return;
      }
      var thisModel = this;
      node.hasServerId = false;

      $.get(window.agfkGlobals.idcheckUrl, {id: node.id, type: "concept" })
        .success(function (resp) {
          node.set("id", resp.id);
          node.set("tag", resp.id);
          node.hasServerId = true;
          // set edge ids that were waiting for the server
          thisModel.getEdges().filter(function (edge) {
            return edge.needsServerId;
          }).forEach(thisModel.setEdgeId);
          // save the node -- how will we save edges on creation? -- save them once they get the server id
          node.save(null,
                    {parse: false,
                     success: function () {
                       thisModel.save(null,
                                      {
                                        parse: false,
                                        success: function () {
                                          Utils.urlFromNewToId(thisModel.id);
                                        },
                                        error: function () {
                                          Utils.errorNotify("unable to sync with the server");
                                        }
                                      });
                     },
                    error: function (robj, resp) {
                      var msg = "unable to communicate with server -- error -- " + resp.responseText;
                      if (resp.status === 401){
                        msg = "changes not saved: create an account in order to save these changes";
                      }
                      Utils.errorNotify(msg);
                    }});
        })
        .fail(function (robj, resp){
          // failure
          Utils.errorNotify("unable to verify resource id with server -- error --  "
                      + resp.responseText);
        });
    }
  });
});
