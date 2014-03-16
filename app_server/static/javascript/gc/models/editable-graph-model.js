
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
    // TODO fix urls hack - make API consistent once it's migrated
    if (this.useOldUrl) {
      this.useOldUrl = false;
      var leaf = this.get("leafs")[0] || this.fetchTag;
      if (!leaf){
        throw new Error("Must set graph leaf in graph-model to fetch graph data");
      }
      return window.CONTENT_SERVER + "/dependencies?concepts=" + leaf;
    }
      return window.agfkGlobals.apiBase + "graph/" + this.id + "/";
    },

    isPopulated: function() {
      return true;
    },

    /**
     * @Override
     */
    postAddEdge: function (edge, isNewEdge) {
      var thisModel = this;
      // if it needs the server id it'll be saved after the node id returns
      // so don't save the graph here
      if (isNewEdge && !edge.needsServerId) {
        edge.save(null,
                  {parse: false,
                   success: function () {
                     thisModel.save(null,
                                    {parse: false,
                                     success:  function (){
                                       Utils.urlFromNewToId(thisModel.id);
                                     }
                                    });
                   }
                  });
      }
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
          node.save(null, {parse: false,
                           success: function () {
                             thisModel.save(null,
                                            {parse: false,
                                             success: function () {
                                               Utils.urlFromNewToId(thisModel.id);
                                             }});
                           }});
        })
        .fail(function (resp){
          // failure
          console.error("unable to verify new resource id -- TODO inform user -- msg: "
                        + resp.responseText);
        });
    },


  });
});
