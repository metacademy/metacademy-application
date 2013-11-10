define(["backbone", "underscore"], function(Backbone, _){

  var ConceptEditorView = (function(){
    var pvt = {};
    pvt.state = {
      visId: ""
    };
    pvt.viewConsts = {
      templateId: "full-screen-content-editor",
      contentItemClass: "ec-display-wrap"
    };

    return Backbone.View.extend({
      template: _.template(document.getElementById(pvt.viewConsts.templateId).innerHTML),

      events: {
        "blur .title-input": "changeTitleInput",
        "blur #summary textarea": "changeSummaryText",
        "click .ec-tabs button": "changeDisplayedSection"
      },

      render: function(){
        var thisView = this;
        pvt.state.visId = pvt.state.visId || "summary";

        thisView.$el.html(thisView.template(thisView.model.toJSON()));
        pvt.state.rendered = true;

        thisView.$el.find("#" + pvt.state.visId).addClass("active");
        thisView.$el.find("#btn-" + pvt.state.visId).addClass("active");
        return thisView;
      },

      changeDisplayedSection: function(evt){
        pvt.state.visId = evt.currentTarget.id.substr(4);
        this.render();
      },

      changeTitleInput: function(evt){
        this.model.set("title", evt.currentTarget.value);
      },

      changeSummaryText: function(evt){
        this.model.set("summary", evt.currentTarget.value);
      }

    });
  })();

  return ConceptEditorView;
});
