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
//      clearLearnedId: "button-clear-learned",
//      showLearnedId: "button-show-learned",
      disabledClass: "disabled",
      viewId: "content-editing-tools"
    };
    //pvt.numVisLearned = 0; // FIXME don't define instance vars on private
    //pvt.numLearned = 0;

    // /**
    //  * helper function to enable/disable the appropriate clear/show learned button
    //  */
    // pvt.changeShowHideButtons = function(elId, enable){
    //   var $el = $("#" + elId);
    //   if (enable){
    //     $el.removeClass(pvt.consts.disabledClass);
    //     $el.prop("disabled", false);
    //   } else{
    //     $el.addClass(pvt.consts.disabledClass);
    //     $el.prop("disabled", true);
    //   }
    // };

    // pvt.enableHide = function(){
    //   pvt.changeShowHideButtons(pvt.consts.clearLearnedId, true);
    // };

    // pvt.disableHide = function(){
    //   pvt.changeShowHideButtons(pvt.consts.clearLearnedId, false);
    // };

    // pvt.disableShow = function(){
    //   pvt.changeShowHideButtons(pvt.consts.showLearnedId, false);
    // };

    // pvt.enableShow = function(){
    //   pvt.changeShowHideButtons(pvt.consts.showLearnedId, true);
    // };

    pvt.isRendered = true; // view is prerendered

    return Backbone.View.extend({
      appRouter: null,

      events: {
        "click #upload-input": function(){ document.getElementById("hidden-file-upload").click();},
        "change #hidden-file-upload": "uploadGraph",
        "click #download-input": "downloadGraph",
        "click #delete-graph": "clearGraph",
        "click #preview-graph": "previewGraph",
        "click #back-to-editing": "returnToEditor"
      },

       initialize: function(inp){
         var thisView = this;
        //     consts = pvt.consts;
         thisView.setElement("#" + pvt.consts.viewId);
         thisView.appRouter = inp.appRouter;
       },

        // thisView.appRouter = inp.appRouter;
        // $('.' + consts.elNavButtonClass).on("click", function(evt){
        //   thisView.handleELButtonClick.call(thisView, evt);
        // });
        // $('#' + consts.clearLearnedId).on("click", function(evt){
        //   thisView.handleClearLearnedClick.call(thisView, evt);
        // });
        // $('#' + consts.showLearnedId).on("click", function(evt){
        //   thisView.handleShowLearnedClick.call(thisView, evt);
        // });
        // hide/show apptools for small view ports
        // $("#" + consts.apptoolsButtonId).on("click", function(){
        //   $(this).toggleClass(consts.expandButtonClass);
        //   $("#" + consts.viewId).toggleClass(consts.showClass);
        // });

        //var aux = window.agfkGlobals.auxModel;
        // enablje/disable the hide/show buttons
        // thisView.listenTo(thisView.model.get("options"), "change:showLearnedConcepts", thisView.changeShowHideState);
        // thisView.listenTo(aux, "change:learnedConcepts", thisView.handleChLearnStatus ); // listen for check clicks

        // FIXME probable initialization problem
        // thisView.listenTo(thisView.model, "sync", function(){
        //   thisView.model.getNodes().each(function(node){
        //     if (aux.conceptIsLearned(node.id)){
        //       thisView.handleChLearnStatus(node.id, node.get("sid"), true);
        //     };
        //   });
        // });
      //},

      // /**
      //  *  Change the show/hide learned concepts buttons state
      //  */
      // changeShowHideState: function(chmodel, chstate){
      //   if (chstate){
      //     // enables the "hide learned concepts" and disables "show learned concepts"
      //     pvt.numVisLearned = pvt.numLearned;
      //     pvt.enableHide();
      //     pvt.disableShow();
      //   } else{
      //     // enables the "show learned concepts" and disables "hide learned concepts"
      //     pvt.numVisLearned = 0;
      //     pvt.disableHide();
      //     pvt.enableShow();
      //   }
      // },

      // /**
      //  * Handle changing node status
      //  */
      // handleChLearnStatus: function(tag, nodesid, state){
      //  // keep count of the number of visible learned nodes
      //   if (state){
      //     pvt.numVisLearned++;
      //     pvt.numLearned++;
      //     if (pvt.numVisLearned === 1){
      //       pvt.enableHide();
      //     }
      //   }
      //   else{
      //     pvt.numVisLearned--;
      //     pvt.numLearned--;
      //     if(pvt.numVisLearned === 0){
      //       pvt.disableHide();
      //     }
      //   }
      // },

      /**
       * Return true if the view has been rendered
       */
      isViewRendered: function(){
        return pvt.isRendered;
      },

      // /**
      //  * Handle click event for showing the [implicitly] learned nodes
      //  */
      // handleClearLearnedClick: function(evt){
      //   if (!$(evt.currentTarget).hasClass(pvt.consts.disabledClass)){
      //     this.model.get("options").setLearnedConceptsState(false);
      //   }
      // },

      // /**
      //  * Handle click event for showing the [implicitly] learned nodes
      //  */
      // handleShowLearnedClick: function(evt){
      //   if (!$(evt.currentTarget).hasClass(pvt.consts.disabledClass)){
      //     this.model.get("options").setLearnedConceptsState(true);
      //   }
      // },


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
      }

    });
  })();
});
