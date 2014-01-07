/*
 This file contains the submodels of node-model.js
 */

/*global define*/

define(["backbone"], function(Backbone){
  /**
   * Comprehension question model
   */
  var Question = Backbone.Model.extend({
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
    listFields: ['authors', 'dependencies', 'extra', 'note'],

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
        dependencies: [],
        extra: [],
        note: [],
        year: "",
        edition_years: []
      };
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
    Question: Question,
    Resource: Resource
  };

});
