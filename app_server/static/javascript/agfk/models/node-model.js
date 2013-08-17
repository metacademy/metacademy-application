/*
 This file contains the node model, which contains the data for each concept TODO should this be renamed "conept-model"?
 */

window.define(["backbone", "agfk/collections/node-property-collections", "agfk/utils/utils"], function(Backbone, NodePropertyCollections, Utils){
  /**
   * Node: node model that encompasses several collections and sub-models
   */
  return  (function(){
    // maintain ancillary/user-specific info and fields in a private object
    var pvt = {};
    pvt.collFields =  ["questions", "dependencies", "outlinks", "resources"]; 
    pvt.txtFields = ["id", "title", "summary", "pointers", "is_shortcut"];
    
    return Backbone.Model.extend({
      /**
       * all possible attributes are present by default
       */
      defaults: function() {
        return {
          title: "",
          id: "",
          summary: "",
          pointers: "",
          is_shortcut: 0,
          questions: new NodePropertyCollections.QuestionCollection(),
          dependencies: new NodePropertyCollections.DirectedEdgeCollection(),
          outlinks: new NodePropertyCollections.DirectedEdgeCollection(),
          resources: new NodePropertyCollections.ResourceCollection()
        };
      },

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
        var i = pvt.txtFields.length;
        while (i--) {
          var tv = pvt.txtFields[i];
          if (resp[tv]) {
            output[tv] = resp[tv];
          }
        }

        // ---- parse the collection values ---- //
        i = pvt.collFields.length;
        while (i--) {
          var cv = pvt.collFields[i];
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
        // changes in attribute collections should trigger a change in the node model
        var i = pvt.collFields.length;
        while (i--) {
          var cval = pvt.collFields[i];
          this.get(cval).bind("change", function () {
            model.trigger("change", cval);
          });
        } 
        this.bind("change", function () {
          this.save();
        });

        // ***** Add private instance variable workaround ***** //
        var nodePvt = {};
        nodePvt.visible = false;
        nodePvt.implicitLearnCt = 0;
        nodePvt.implicitLearn = false;
        nodePvt.learned = false;
        
        // * Increment the implicit learn count by ival (default 1)
        this.incrementILCt = function(ival){
          ival = ival || 1;
          this.setImplicitLearnCt(nodePvt.implicitLearnCt + ival);
        };
        
        this.setLearnedStatus = function(status){
          if (status !== nodePvt.learned){
            nodePvt.learned = status;
            this.trigger("change:learnStatus", this.get("id"), status);
          }
        };

        this.setVisibleStatus = function(status){
          if (nodePvt.visible !== nodePvt.visible){
            nodePvt.visible = status;
            this.trigger("change:visibleStatus", this.get("id"), status);
          }
        };

        this.setImplicitLearnCt = function(ilct){
          if (nodePvt.implicitLearnCt !== nodePvt.ilct){
            nodePvt.implicitLearnCt = ilct;
            this.trigger("change:implicitLearnCt", this.get("id"), ilct);
            this.setImplicitLearnStatus(ilct > 0);
          }
        };

        this.setImplicitLearnStatus = function(status){
          if (nodePvt.implicitLearn !== status){
            nodePvt.implicitLearn = status;
            this.trigger("change:implicitLearnStatus", this.get("id"), status);
          }
        };

        this.getImplicitLearnCt = function(){
          return nodePvt.implicitLearnCt;
        };
        
        this.getImplicitLearnStatus = function(){
          return nodePvt.implicitLearn;
        };

        this.getVisibleStatus = function(){
          return nodePvt.visible;
        };
        
        this.getCollFields = function(){
          return nodePvt.collFields;
        };

        this.getTxtFields = function(){
          return nodePvt.txtFields;
        };
        
        this.getLearnedStatus = function(){
          return nodePvt.learned;
        };

        this.isLearnedOrImplicitLearned = function(){
          return nodePvt.learned || nodePvt.implicitLearn;
        };

      },

      /**
       * returns and caches the node display title
       */
      getNodeDisplayTitle: function(numCharNodeLine){
        if (!this.nodeDisplayTitle){
          var title = this.get("title") || this.id.replace(/_/g, " ");
          this.nodeDisplayTitle = Utils.wrapNodeText(title, numCharNodeLine || 9);
        }
        return this.nodeDisplayTitle;
      },

      /**
       * Returns the title to be displayed in the learning view
       */
      getLearnViewTitle: function(){
        return this.get("is_shortcut") ? this.get("title") + " (shortcut)" : this.get("title");
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
      }
    });
  })();
});
