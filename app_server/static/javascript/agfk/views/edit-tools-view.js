/*global define*/
define(["jquery", "backbone", "utils/errors"], function($, Backbone, ErrorHandler){
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
        "click #preview-graph": "previewGraph",
        "click #back-to-editing": "returnToEditor",
        "click #save": "syncWithServer",
        "keyup #add-concept-input": "addConceptKeyUp"
        // Bad design note: #optimize listener is in graph-view
      },

      initialize: function(inp){
        var thisView = this;
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
        var thisView = this,
            topoSort = thisView.model.getTopoSort(),
            // TODO fix hardcoding!
            newWin = window.open("/graphs/concepts/" + topoSort[topoSort.length - 1], "_blank");
        newWin.focus();
      },

      returnToEditor: function () {
        var thisView = this;
        // FIXME this is an ugly hack
        thisView.appRouter.navigate("", {trigger: true});
      },

      // TODO use this function if the connection is lost
      syncWithServer: function () {
        var thisView = this,
            jsonObj = this.model.toJSON(),
            jsonConceptOnly = $.extend({}, jsonObj, {dependencies: []}),
            jsonEdgesOnly =  $.extend({}, jsonObj, {concepts: []});
        $.ajax({ type: "PUT",
                 // TODO move hardcoded url
                 url: thisView.model.url(),
                 contentType: "application/json; charset=utf-8",
                 data: JSON.stringify(jsonConceptOnly),
                 headers: {'X-CSRFToken': window.CSRF_TOKEN},
                 success: function (resp) {
                   $.ajax({ type: "PUT",
                            // TODO move hardcoded url
                            url: thisView.model.url(),
                            contentType: "application/json; charset=utf-8",
                            data: JSON.stringify(jsonObj),
                            headers: {'X-CSRFToken': window.CSRF_TOKEN},
                            success: function (resp) {
                              console.log("success!");
                              if (resp){
                                console.log(resp.responseText);
                              }
                              if (window.location.pathname.substr(-3) == "new") {
                                var newPath = window.location.pathname.split("/");
                                newPath.pop();
                                newPath = newPath.join("/") + "/" + thisView.model.id;
                                window.history.pushState({}, "", newPath);
                              }
                            },
                            error: function (resp) {
                              console.log(resp.responseText);
                            }
                          });
                 },
                 error: function (resp) {
                   console.log(resp.responseText);
                 }
               });
      },

      downloadGraph: function(){
        var outStr = JSON.stringify(this.model.toJSON()),
            blob = new window.Blob([outStr], {type: "text/plain;charset=utf-8"});
        window.saveAs(blob, "mygraph.json"); // TODO replace with title once available
      },

      addConceptKeyUp: function (evt) {
        var thisView = this,
            thisModel = thisView.model,
            keyCode = evt.keyCode;
        var inpText = evt.target.value;
        if (keyCode === 13) {
          // return key code
          if (inpText) {

            $.getJSON("/graphs/concept-triplet", {title: inpText})
              .done(function (robj) {
                if (robj && robj.id) {
                  console.log( "fetched id for: " + inpText );
                  var fetchNodeId = robj.id;
                  thisModel.fetchTag = fetchNodeId;
                  thisModel.fetch({
                    success: function () {
                      // need to contract
                      console.log( "fetched: " + inpText );
                      var fetchNode = thisModel.getNode(fetchNodeId);
                      fetchNode.set("x", 200);
                      fetchNode.set("y", 200); // TODO figure out a better positioning system for the fetched node
                      fetchNode.contractDeps();
                      thisView.model.trigger("render");
                      evt.target.value = "";
                    } // end success
                  });
                } else {
                  evt.target.blur();
                  alert("unable to fetch: " + inpText);
                }
              })
              .fail(function () {
                console.log("unable to fetch: " + inpText);
              });
          }
        }
      }
    });
  })();
});
