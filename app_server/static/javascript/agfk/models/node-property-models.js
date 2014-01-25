/*
 This file contains the submodels of node-model.js
 */

/*global define*/

define(["backbone"], function(Backbone){
  /**
   * Comprehension exercises model
   */
  var Exercise = Backbone.Model.extend({
    /**
     * default values -- underscore attribs used to match data from server
     */
    defaults: function () {
      return {
        text: ""
      };
    },
    toText: function () {
      return this.get("text");
    }
  });

  /**
   * Learning resource model
   */
  var Resource = Backbone.Model.extend({
    listFields: ['authors', 'additional_dependencies', 'extra', 'note'],

    /**
     * default values -- attributes match possible data from server
     */
    defaults: function() {
      return {
        title: "",
        description: "",
        location: [],
        url: "",
        resource_type: "",
        free: 0,
        requires_signup: 0,
        core: 0,
        edition: "",
        level: "",
        authors: [],
        additional_dependencies: [],
        extra: "",
        year: "",
        edition_years: [],
        concept: null
      };
    },

    url: function () {
      // FIXME localhost hardcoded
      // TODO what if concept is not present yet...
      return 'http://127.0.0.1:8080/graphs/api/v1/conceptresource/' + this.get("id") + "/";
    },

    parse: function (resp, xhr) {
      if (xhr.parse === false) {
        return {};
      }

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

    getLocationString: function () {
      var retArr = [];
      this.get("location").forEach(function (itm) {
        if (itm.link) {
          retArr.push(itm.text + " [" + itm.link + "]");
        } else {
          retArr.push(itm.text);
        }
      });
      return retArr.join("\n");
    },

    getAuthorsString: function () {
      return this.get("authors").join(" and ");
    },

    getYearString: function() {
      if (this.get("year")) {
        return this.get("year");
      }

      var edYears = this.get("edition_years"), ed = parseInt(this.get("edition"));
      if (edYears && ed && 1 <= ed && ed <= edYears.length) {
        if (edYears.length >= 2) {
          return "edition " + ed + ", " + edYears[ed-1];
        } else {
          return edYears[ed-1];
        }
      }

      if (this.get("edition")) {
        return "edition " + this.get("edition");
      }

      return "";
    }
  });

  return {
    Exercise: Exercise,
    Resource: Resource
  };

});
