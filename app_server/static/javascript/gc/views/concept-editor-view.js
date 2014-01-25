
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
            thisModel = thisView.model,
            consts = pvt.consts;
        pvt.state.visId = pvt.state.visId || "summary";
        thisView.isRendered = false;

        // check the structure of goals, resources, problems, and relevant software
        // convert to free-form text for now
        // TODO extract this to a utils function
        var freeFormFields = ["goals", "pointers", "exercises"];
        var ffl = freeFormFields.length,
            httpRe = /http:/;
        while( ffl -- ){
          var qfield = thisModel.get(freeFormFields[ffl]);

          // if the field does not exist: set to ""
          if (qfield === undefined){
            thisModel.set(freeFormFields[ffl], "");
            qfield = "";
          }

          if (typeof qfield !== "string") {
            // make field into a string for editing purposes
            var convArr = [],
                i = qfield.length,
                prevDepth = 0,
                liStr;
            // convert array to displayable string
            while( i -- ){
              var line = qfield[i],
                  depth = line.depth,
                  items = line.items,
                  j = -1,
                  itemsLen = line.items.length,
                  retStr = Array(depth + 1).join("*") + " ";
              while (++j < itemsLen ){
                var item = line.items[j];
                if (item.link) {
                  if (httpRe.test(item.link)) {
                    retStr += item.text + "[" + item.link + "]";
                  } else {
                    retStr += '"' + item.text + '":' + item.link;
                  }
                } else {
                  retStr += item.text;
                }
              } // end while j --
              convArr.unshift(retStr);
            } // end while i --
            thisModel.set(freeFormFields[ffl], convArr.join("\n"));
          } // end if typeof qfield !-- string
        } // end while ffl--

        // use attributes since toJSON changes the structure
        thisView.$el.html(thisView.template(thisModel.attributes));

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
        // should do create
        var newRes = new NodePropModels.Resource({id: "-new-" + Math.random().toString(36).substr(3)});
        newRes.parent = thisView.model;
        newRes.set("concept", thisView.model);
        newRes.save(null, {
          parse: false,
          success: function (mdl, resp) {
            newRes.set("id", resp.id);
          },
          error: function (mdl, resp) {
            console.error("unable to sync new resource -- TODO inform user -- msg: " + resp.responseText);
          }
        });
        thisView.model.get("resources").add(newRes, {at: 0});
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
