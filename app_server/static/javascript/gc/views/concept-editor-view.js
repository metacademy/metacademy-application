
/*global define*/
define(["jquery", "backbone", "underscore", "gc/views/resource-editor-view", "agfk/models/concept-resource-model"], function($, Backbone, _, ResourceEditorView, ConceptResource){

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
        var thisView = this,
            rid = Math.random().toString(36).substr(3),
            grid = Math.random().toString(36).substr(3),
            newRes = new ConceptResource({id: rid});
        newRes.get("global_resource").set("id", grid);
        newRes.parent = thisView.model;
        newRes.set("concept", thisView.model);
        // make sure the id works

        // TODO fix hardcoded URLS!
        var failFun = function (resp){
          // failure
          console.error("unable to verify new resource id -- TODO inform user -- msg: "
                        + resp.responseText);
        };

        $.get("http://127.0.0.1:8080/graphs/idchecker/", {id: rid, type: "resource" })
        .success(function (resp) {
            newRes.set("id", resp.id);
        })
        .fail(failFun);

        $.get("http://127.0.0.1:8080/graphs/idchecker/", {id: grid, type: "global_resource" })
          .success(function (resp) {
            // change the id if it hasn't taken on a different global resource
            var gresource = newRes.get("global_resource");
            if (gresource.id === grid && resp.id != grid) {
              gresource.set("id", resp.id);
            }
          })
          .fail(failFun);

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
