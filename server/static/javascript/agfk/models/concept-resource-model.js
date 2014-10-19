
/**
 * Concept-level learning resource model
 */

/*global define*/

define(["backbone", "agfk/collections/resource-location-collection", "agfk/models/global-resource-model"], function(Backbone, LocationCollection, GlobalResource){
    return Backbone.Model.extend({
    simpleFields: ["id", "core", "edition", "additional_dependencies", "notes", "goals_covered"],
    collFields: ["locations"],
    /**
     * default values -- attributes match possible data from server
     */
    defaults: function() {
      return {
        id: "",
        locations: new LocationCollection(),
        global_resource: new GlobalResource(),
        core: 1,
        // TODO consider using a GoalCollection if goals become more complicated
        goals_covered: [],
        edition: "",
        additional_dependencies: [],
        notes: "",
        concept: null
      };
    },

    parse: function (resp, xhr) {
      if (xhr.parse === false) {
        return {};
      }
      var thisModel = this,
          output = thisModel.defaults();

      // get goal id from goal uri
      var gc = resp['goals_covered'],
          i = gc.length;
      while (i--) {
        var splitGc = gc[i].split("/");
        gc[i] = splitGc[splitGc.length - 2];
      }

      // ---- parse the simple attributes ---- //
      i = thisModel.simpleFields.length;
      while( i -- ){
        var sf = thisModel.simpleFields[i];
        if (resp[sf] !== undefined) {
          output[sf] = resp[sf];
        }
      }

      // ---- parse the collection attributes ---- //
      i = thisModel.collFields.length;
      while (i--) {
        var cv = thisModel.collFields[i];
        output[cv].parent = thisModel;
        if (resp[cv] !== undefined) {
          output[cv].add(resp[cv], {parse: true});
        }
      }

      /* ---- parse the global resources ----
       each global resource should have a pointer to the
       global global_resource object since it may be shared by multiple resources
      */

      // TODO test this parsing
      var grs = window.agfkGlobals.globalResources;
      if (grs.hasOwnProperty(resp.global_resource.id)) {
        output.global_resource =  grs[resp.global_resource.id];
      } else {
        output.global_resource =  new GlobalResource(resp.global_resource);
        grs[output.global_resource.id] = output.global_resource;
      }

      output.concept = (xhr && xhr.collection && xhr.collection.parent) || resp.concept;
      return output;
    },

    getYearString: function () {
      return this.get("global_resource").get("year");
    },

    url: function () {
        return window.APIBASE + "conceptresource/" + this.id + "/";
    },

    toJSON: function () {
      var thisModel = this,
          retObj = {},
          attrs = thisModel.attributes,
          attrib;
      // avoid infinite recurse with concept property
      thisModel.simpleFields.forEach(function(attrib){
          retObj[attrib] = thisModel.get(attrib);
      });
      retObj["concept"] = thisModel.get("concept").url();
      // don't use URIs since the locs and global res must exist
      retObj["locations"] = thisModel.get("locations").toJSON();
      retObj["global_resource"] = thisModel.get("global_resource").toJSON();
      var goals = thisModel.get("concept").get("goals");
      retObj["goals_covered"] = thisModel.get("goals_covered")
        .filter(function(gid){
          return goals.get(gid);
        }).map(function (gid) {
          return goals.get(gid).url();
        });
      return retObj;
    }
  });
});
