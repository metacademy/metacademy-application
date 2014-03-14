
/*global define*/
define(["backbone", "utils/utils"], function(Backbone, Utils){
  return Backbone.Model.extend({
    defaults: function () {
      return {
        text: "",
        id: "",
        concept: null
      };
    },

    url: function () {
        return window.agfkGlobals.apiBase + "goal/" + this.id + "/";
    },

    parse: function (resp, xhr) {
      if (!xhr.parse) {
        return {};
      }
      resp.concept = this.collection.parent;
      return resp;
    },

    toJSON: function () {
      var thisModel = this;
        return {
          id: thisModel.id,
          text: thisModel.get("text"),
          concept: thisModel.get("concept").url()
        };
    },

    getParsedText: function () {
      var txt = this.get("text");
      if (txt[0] != "*") {
        txt = "*" + txt;
      }
        return Utils.simpleMdToHtml(txt);
    }
  });
});
