/**
 * Concept-level learning resource model
 */

/*global define*/

define(["backbone", "agfk/collections/resource-location-collection", "agfk/models/global-resource-model"], function(Backbone, LocationCollection, GlobalResource){
    return Backbone.Model.extend({
    simpleFields: ["id", "access", "core", "edition", "additional_dependencies", "notes"],
    collFields: ["locations"],
    /**
     * default values -- attributes match possible data from server
     */
    defaults: function() {
      return {
        id: "",
        locations: new LocationCollection(),
        global_resource: new GlobalResource(),
        access: "",
        core: 0,
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

      // ---- parse the simple attributes ---- //
      var i = thisModel.simpleFields.length;
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
      window.agfk.globalResources = window.agfkGlobals.globalResources || {};
      var grs = window.agfk.globalResources;
      if (grs.hasOwnProperty(resp.global_resource.id)) {
        resp.global_resource =  grs[resp.global_resource.id];
      } else {
        resp.global_resource =  new GlobalResource(resp.global_resource);
        grs[resp.global_resource.id] = resp.global_resource;
      }

      resp.concept = (xhr && xhr.collection && xhr.collection.parent) || resp.concept;
      return resp;
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
      retObj["concept"] = {"id": thisModel.get("concept").get("id")};
      retObj["locations"] = thisModel.get("locations").toJSON();
      retObj["global_resource"] = thisModel.get("global_resource").toJSON();
      return retObj;
    }
  });
});
