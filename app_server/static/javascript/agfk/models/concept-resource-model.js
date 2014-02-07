/**
 * Concept-level learning resource model
 */

/*global define*/

define(["backbone", "agfk/collections/resource-location-collection", "agfk/models/global-resource-model"], function(Backbone, LocationCollection, GlobalResource){
    return Backbone.Model.extend({
    listFields: ['additional_dependencies'],
    /**
     * default values -- attributes match possible data from server
     */
    defaults: function() {
      return {
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
      // FIXME this needs to parse the global_resource and location models
      resp.concept = (xhr && xhr.collection && xhr.collection.parent) || resp.concept;
      return xhr.parse === false ? {} : resp;
    },

    toJSON: function () {
      var thisModel = this,
          retObj = {},
          attrs = thisModel.attributes,
          attrib;
      // avoid infinite recurse with concept property
      for (attrib in attrs) {
        if (attrs.hasOwnProperty(attrib) && attrib !== "concept") {
          retObj[attrib] = thisModel.get(attrib);
        }
      }
      var concept = thisModel.get("concept");
      retObj["concept"] = {"id": concept.get("id") , "tag": concept.get("tag")};

      return retObj;
    },

    // getLocationString: function () {
    //   var retArr = [];
    //   this.get("location").forEach(function (itm) {
    //     if (itm.link) {
    //       retArr.push(itm.text + " [" + itm.link + "]");
    //     } else {
    //       retArr.push(itm.text);
    //     }
    //   });
    //   return retArr.join("\n");
    // },

    // getYearString: function() {
    //   if (this.get("year")) {
    //     return this.get("year");
    //   }

    //   var edYears = this.get("edition_years"), ed = parseInt(this.get("edition"));
    //   if (edYears && ed && 1 <= ed && ed <= edYears.length) {
    //     if (edYears.length >= 2) {
    //       return "edition " + ed + ", " + edYears[ed-1];
    //     } else {
    //       return edYears[ed-1];
    //     }
    //   }

    //   if (this.get("edition")) {
    //     return "edition " + this.get("edition");
    //   }

    //   return "";
    // }
  });
});
