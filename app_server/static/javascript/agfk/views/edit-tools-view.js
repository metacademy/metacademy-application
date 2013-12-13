/*global define*/
define(["jquery", "backbone", "base/utils/errors"], function($, Backbone, ErrorHandler){
  "use strict";

  /**
   * Application Tools View
   */
  return (function(){
    var pvt = {};
    pvt.consts = {
      showClass: "show",
      backToEditingButtonId: "back-to-editing",
      apptoolsButtonId: "apptools-button",
      expandButtonClass: "expanded",
      disabledClass: "disabled",
      viewId: "content-editing-tools"
    };
    pvt.isRendered = true; // view is prerendered

    return Backbone.View.extend({
      appRouter: null,

      events: {
        "click #upload-input": function(){ document.getElementById("hidden-file-upload").click();},
        "change #hidden-file-upload": "uploadGraph",
        "click #download-input": "downloadGraph",
        "click #delete-graph": "clearGraph",
        "click #preview-graph": "previewGraph",
        "click #back-to-editing": "returnToEditor",
        "keyup #add-concept-input": "addConceptKeyUp"
      },

       initialize: function(inp){
         var thisView = this;
        //     consts = pvt.consts;
         thisView.setElement("#" + pvt.consts.viewId);
         thisView.appRouter = inp.appRouter;
       },

      /**
       * Return true if the view has been rendered
       */
      isViewRendered: function(){
        return pvt.isRendered;
      },


      /**
       * Render the apptools view
       */
      render: function(){
        pvt.viewRendered = true;
        return this;
      },

      /**
       * Close and unbind views to avoid memory leaks
       */
      close: function() {
        this.remove();
        this.unbind();
      },

      uploadGraph: function(evt){
        if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
          alert("Your browser won't let you load a graph -- try upgrading your browser to IE 10+ or Chrome or Firefox.");
          return;
        }
        var thisView = this,
            uploadFile = evt.currentTarget.files[0],
            filereader = new window.FileReader();

        filereader.onload = function(){
          var txtRes = filereader.result;
          try{
            var jsonObj = JSON.parse(txtRes);
            // thisView.deleteGraph(true);
            thisView.model.addJsonNodesToGraph(jsonObj);
            thisView.model.trigger("render");
          }catch(err){
            // FIXME better/more-informative error handling
            alert("Error parsing uploaded file\nerror message: " + err.message);
            return;
          }
        };
        filereader.readAsText(uploadFile);
      },

      previewGraph: function () {
        var thisView = this;
        $("#" + pvt.consts.backToEditingButtonId).show();
        thisView.appRouter.changeUrlParams({mode: "explore"});
      },

      returnToEditor: function () {
        var thisView = this;
        // FIXME this is an ugly hack
        thisView.appRouter.navigate("", {trigger: true});
      },


      downloadGraph: function(){
        var outStr = JSON.stringify(this.model.toJSON()),
            blob = new window.Blob([outStr], {type: "text/plain;charset=utf-8"});
        window.saveAs(blob, "mygraph.json"); // TODO replace with title once available
      },

      clearGraph: function(confirmDelete){
        if (!confirmDelete || confirm("Press OK to clear this graph")){
          this.model.clear().set(this.model.defaults());
          this.model.trigger("render"); // FIXME this is a hack
        }
      },

      addConceptKeyUp: function (evt) {
        var thisView = this,
            keyCode = evt.keyCode;
        if (keyCode === 13) {
          var inpText = evt.target.value;
          if (inpText) {
            var aux = window.agfkGlobals.auxModel,
            // try to find the tag and add to graph
            res = aux.get("nodes").filter(function(d){
              return d.get("title") === inpText || d.id === inpText;
            });
            if (res.length) {
              var fetchNodeId = res[0].id;
              thisView.model.set("root", fetchNodeId);
              thisView.model.fetch({
                success: function () {
                  // need to contract
                  var fetchNode = thisView.model.getNode(fetchNodeId);
                  fetchNode.set("x", 200);
                  fetchNode.set("y", 200); // FIXME figure out a better positioning system for the fetched node
                  fetchNode.contractDeps();
                  thisView.model.trigger("render");
                  evt.target.value = "";
                }
              });
              //thisView.model.addServerDepGraphToGraph(res[0].id); // TODO resolve ambiguities
              // How to optimize and render? Oh no... - no optimize - just set initial coordinates and collapse all nodes - go!
            } else {
              // TODO let the user know that no matching concept was found
            }
          }
        }
      }

    });
  })();
});
