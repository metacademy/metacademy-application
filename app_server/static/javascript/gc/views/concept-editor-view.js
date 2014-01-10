
/*global define*/
define(["backbone", "underscore", "gc/views/resource-editor-view", "agfk/models/node-property-models"], function(Backbone, _, ResourceEditorView, NodePropModels){

  return (function(){
    var pvt = {};
    pvt.state = {
      visId: ""
    };
    pvt.consts = {
      templateId: "full-screen-content-editor",
      contentItemClass: "ec-display-wrap",
      resourcesTidbitWrapId: "resources-tidbit-wrap"
    };

    return Backbone.View.extend({
      template: _.template(document.getElementById(pvt.consts.templateId).innerHTML),

      events: {
        "blur .title-input": "changeTitleInput",
        "blur .ec-display-wrap > textarea": "changeTextField",
        "blur input.dep-reason": "changeDepReason",
        "click .ec-tabs button": "changeDisplayedSection",
        "click #add-resource-button": "addResource"
      },

      render: function(){
        var thisView = this,
            consts = pvt.consts;
        pvt.state.visId = pvt.state.visId || "summary";
        thisView.isRendered = false;

        // use attributes since toJSON changes the structure
        thisView.$el.html(thisView.template(thisView.model.attributes));

        // add the resources (they're the tricky part)
        thisView.model.get("resources").each(function (res) {
          var rev = new ResourceEditorView({model: res});
          thisView.$el.find("#" + consts.resourcesTidbitWrapId).append(rev.render().$el);
        });

        pvt.state.rendered = true;

        thisView.$el.find("#" + pvt.state.visId).addClass("active");
        thisView.$el.find("#btn-" + pvt.state.visId).addClass("active");
        thisView.isRendered = true;
        return thisView;
      },

      addResource: function () {
        var thisView = this;
        thisView.model.get("resources").add(new NodePropModels.Resource(), {at: 0});
        thisView.render();
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
      },

      isViewRendered: function(){
        return this.isRendered;
      }

    });
  })();
});
