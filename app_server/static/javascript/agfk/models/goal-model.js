
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

    toJSON: function () {
      var thisModel = this;
        return {
          id: thisModel.id,
          text: thisModel.get("text")
        };
    },

    getParsedText: function () {
        return Utils.simpleMdToHtml(this.get("text"));
    }
  });
});
