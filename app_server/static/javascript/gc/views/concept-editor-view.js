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
        "blur .ec-display-wrap > textarea": "changeTextField",
        "blur input.dep-reason": "changeDepReason",
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

      /**
       * Changes text field values for simple attributes of models
       * the id of the containing element must match the attribute name
       */
      changeTextField: function(evt){
        this.model.set(evt.currentTarget.parentElement.id, evt.currentTarget.value);
      },

      changeDepReason: function(evt){
        var curTarget = evt.currentTarget,
            cid = curTarget.id.split("-")[0], // cid-reason
            reason = curTarget.value;        
        this.model.get("dependencies").get(cid).set("reason", reason);        
      }

    });
  })();

  return ConceptEditorView;
});
