/*
 This file contains the node model, which contains the data for each concept TODO should this be renamed "concept-model"?
 */

define(["backbone", "agfk/collections/node-property-collections"], function(Backbone, NodePropertyCollections){
  /**
   * Node: node model that encompasses several collections and sub-models
   */
  return  (function(){
    // maintain ancillary/user-specific info and fields in a private object
    var pvt = {};

    return Backbone.Model.extend({
      /**
       * all possible attributes are present by default
       */
      defaults: function() {
        return {
          title: "",
          id: "",
          sid: "",
          summary: "",
          time: "",
          is_shortcut: 0,
          dependencies: new NodePropertyCollections.DirectedEdgeCollection(),
          outlinks: new NodePropertyCollections.DirectedEdgeCollection()
        };
      },

      collFields: ["dependencies", "outlinks"],
      
      txtFields: ["id", "sid", "title", "summary", "is_shortcut", "time"],

      /**
       *  parse the incoming server data
       */
      parse: function(resp, xhr) {
        // check if we have a null response from the server
        if (resp === null) {
          return {};
        }
        var output = this.defaults();
        // ---- parse the text values ---- //
        var i = this.txtFields.length;
        while (i--) {
          var tv = this.txtFields[i];
          if (resp[tv]) {
            output[tv] = resp[tv];
          }
        }

        // ---- parse the collection values ---- //
        i = this.collFields.length;
        while (i--) {
          var cv = this.collFields[i];
          output[cv].parent = this;
          if (resp[cv]) {
            output[cv].add(resp[cv]);
          }
        }
        return output;
      },

      /**
       * intially populate the model with all present collection, boolean and text values
       * bind changes from collection such that they trigger changes in the original model
       */
      initialize: function() {
        var model = this;

        // ***** Add private instance variable workaround ***** //
        var nodePvt = {};
        nodePvt.visible = false;
        nodePvt.implicitLearn = false;
        nodePvt.learned = false;
        nodePvt.starred = false;

        this.setVisibleStatus = function(status){
          if (nodePvt.visible !== nodePvt.visible){
            nodePvt.visible = status;
            this.trigger("change:visibleStatus", this.get("id"), status);
          }
        };

        this.setImplicitLearnStatus = function(status){
          if (nodePvt.implicitLearn !== status){
            nodePvt.implicitLearn = status;
            this.trigger("change:implicitLearnStatus", this.get("id"), this.get("sid"), status);
          }
        };

        this.getImplicitLearnStatus = function(){
          return nodePvt.implicitLearn;
        };

        this.getVisibleStatus = function(){
          return nodePvt.visible;
        };
        
        this.getCollFields = function(){
            return this.collFields;
        };

        this.getTxtFields = function(){
          return this.txtFields;
        };

      },

      /**
       * Returns the title to be displayed in the learning view
       */
      getLearnViewTitle: function(){
        var title = this.get("title") || this.id.replace(/_/g, " ");
        if (this.get("is_shortcut")) {
          title += " (shortcut)";
        }
        if (!this.isFinished()) {
          title += " (under construction)";
        }
        return title;
      },

      /**
       * Check if ancestID is an ancestor of this node
       */
      isAncestor: function(ancestID){
        if (!this.ancestors){
          this.getAncestors(true);
        }
        return this.ancestors.hasOwnProperty(ancestID);
      },

      /**
       * Obtain (and optionally return) a list of the ancestors of this node 
       * side effect: creates a list of unique dependencies (dependencies not present as an 
       * ancestor of another dependency) which is stored in this.uniqueDeps
       */
      getAncestors: function(noReturn){
        if (!this.ancestors){
          var ancests = {},
              coll = this.collection;
          this.get("dependencies").each(function(dep){
            var depNode = coll.get(dep.get("from_tag")),
                dAncests = depNode.getAncestors();
            for (var dAn in dAncests){
              if(dAncests.hasOwnProperty(dAn)){
                ancests[dAn] = 1;
              }
            }
          });

          // create list of unique dependencies
          var uniqueDeps = {},
              dtag;
          this.get("dependencies").each(function(dep){
            dtag = dep.get("from_tag");
            if (!ancests.hasOwnProperty(dtag)){
              uniqueDeps[dtag] = 1;
            }
            ancests[dtag] = 1;
          });
          this.uniqueDeps = uniqueDeps;
          this.ancestors = ancests;
        }

        if (!noReturn){
          return this.ancestors;
        }

        else{
          return false;
        }
      },

      /**
       * Get a list of unqiue dependencies (dependencies not present as an 
       * ancestor of another dependency)
       */
      getUniqueDependencies: function(noReturn){
        if (!this.uniqueDeps){ this.getAncestors(true); } // TODO: do we want to populate unique dependencies as a side effect of obtaining ancestors?
        if (!noReturn){
          return Object.keys(this.uniqueDeps);
        }
        return false;
      },

      /**
       * Check if depID is a unique dependency (dependencies not present as an 
       * ancestor of another dependency)
       */
      isUniqueDependency: function(depID){
        if (!this.uniqueDeps){ this.getUniqueDependencies(true); }
        return this.uniqueDeps.hasOwnProperty(depID);
      },
      
      /**
       * Compute the list of outlinks to be displayed in the context section
       */
      computeNeededFor: function(){
        var nodes = this.collection, thisModel = this;

        var found = this.get("outlinks").filter(function(item){
          var node = nodes.findWhere({"id": item.get("to_tag")});
          if (!node) {
            return false;
          }
          return node.get("dependencies").findWhere({"from_tag": thisModel.get("id")});
        });

        return new NodePropertyCollections.DirectedEdgeCollection(found);
      },

      /**
       * Determine if the node is considered "finished," so we can give an "under"
       # construction" message otherwise.
       */
      isFinished: function(){
        return this.get("summary") && this.get("resources").length > 0;
      }
    });
  })();
});

