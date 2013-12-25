/*global define*/
define(["jquery", "backbone", "utils/errors", "completely"], function($, Backbone, ErrorHandler){
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
        "keyup #add-concept-container input": "addConceptKeyUp"
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
        // setup autocomplete
        // TODO handle styles in css -- perhaps use a different library
        var auto = window.completely(document.getElementById('add-concept-container'), {
    	     fontSize : '0.9em'
         });
         auto.options = window.agfkGlobals.auxModel.get("nodes").map(function (node) {
           return node.get("title").toLowerCase();
         });
         auto.options.sort();
         auto.input.placeholder = "Search for a concept to add";
         var $auto = $(auto.input);
         $auto.css("border", "1px solid rgb(56, 49, 49)");
         $auto.css("padding", "0.2em");
        var $hint = $(auto.hint);
        $hint.css("padding", "0.3em");
         //auto.repaint();
        this.auto = auto;
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
        var inpText = evt.target.value;
        if (!inpText.length) {
          thisView.auto.hideDropDown();
          thisView.auto.hint.value = "";
          return;
        }
        if (keyCode === 13) {
          if (inpText) {
            var aux = window.agfkGlobals.auxModel,
            // try to find the tag and add to graph
            res = aux.get("nodes").filter(function(d){
              return d.get("title").toLowerCase() === inpText.toLowerCase() || d.id.toLowerCase() === inpText.toLowerCase();
            });
            if (res.length) {
              var fetchNodeId = res[0].id;
              thisView.model.set("roots", [fetchNodeId]);
              thisView.model.fetch({
                success: function () {
                  // need to contract
                  var fetchNode = thisView.model.getNode(fetchNodeId);
                  fetchNode.set("x", 200);
                  fetchNode.set("y", 200); // FIXME figure out a better positioning system for the fetched node
                  fetchNode.contractDeps();
                  thisView.model.trigger("render");
                  evt.target.value = "";

                  // TODO write your own autocomplete
                  thisView.auto.hideDropDown();
                  thisView.auto.hint.value = "";
                }
              });
            } else {
              // TODO let the user know that no matching concept was found
            }
          }
        }
      }

    });
  })();
});
