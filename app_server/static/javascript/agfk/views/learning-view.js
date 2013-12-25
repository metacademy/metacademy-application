/**
 * This file contains the learning view and appropo subviews and must be loaded
 * after the models and collections
 */

/*global define*/

define(["backbone", "underscore", "jquery", "utils/utils"], function(Backbone, _, $, Utils){
  "use strict";

  /**
   * Main content display view
   */
  var LearnView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.viewConsts = {
      viewId: "learn-view",
      clickedItmClass: "clicked-title",
      conceptDisplayWrapId: "learn-concept-wrapper",
      learnedClass: "learned-concept",
      starredClass: "starred-concept",
      dataTagName: "data-tag",
      showClass: "show"
    };

    // return public object
    return Backbone.View.extend({
      id: pvt.viewConsts.viewId,

      events: {
        "click .learn-view-check": function(evt){this.toggleConceptState(evt, "learn");},
        "click .learn-view-star": function(evt){this.toggleConceptState(evt, "star");}
      },

     // /**
     //   * Toggle speficied state of given concept
     //   */
     //  toggleConceptState: function(evt, state){
     //    evt.stopPropagation();
     //    var aux = window.agfkGlobals.auxModel,
     //        nodeTag = evt.currentTarget.getAttribute(pvt.viewConsts.dataTagName);
     //    state === "learn" ? aux.toggleLearnedStatus(nodeTag) : aux.toggleStarredStatus(nodeTag);
     //  },

      // /**
      //  * Expand/collapse the clicked concept title
      //  */
      // showNodeDetailsFromEvt: function(evt){
      //   var $curTarget = $(evt.currentTarget),
      //       clickedItmClass = pvt.viewConsts.clickedItmClass;
      //   if (this.appRouter && !$curTarget.hasClass(clickedItmClass)){
      //     var titleId = $curTarget.attr("id"),
      //         nid = titleId.split("-").pop();
      //     this.appRouter.changeUrlParams({focus: nid});
      //   } else{
      //     this.showConceptDetailsForTitleEl(null, $curTarget);
      //   }
      // },

      // /**
      //  * Show the given concept details FIXME
      //  */
      // showConceptDetailsForTitleEl: function(titleEl, $titleEl){
      //     var nid,
      //       clickedItmClass = pvt.viewConsts.clickedItmClass,
      //       thisView = this,
      //       titleId;
      //   $titleEl = $titleEl || $(titleEl);
      //   if ($titleEl.hasClass(clickedItmClass)){
      //     return false;
      //   }
      //   if (thisView.expandedNode !== null){
      //     thisView.$expandedTitle.removeClass(clickedItmClass);
      //     thisView.expandedNode.close();
      //   }
      //   $titleEl.addClass(clickedItmClass);
      //   titleId = $titleEl.attr("id");

      //   nid = titleId.split("-").pop();
      //   var dnode = thisView.showConceptDetails(thisView.model.getNodes().get(nid));
      //   thisView.expandedNode = dnode;
      //   thisView.$expandedTitle = $titleEl;
      //   return true;
      // },

      /**
       * Show the concept detail of the given nodeModel
       * Returns the view object for the shown concept FIXME this should be the render
       */
      showConceptDetails: function(nodeModel){
        var thisView = this,
        dNodeView = new DetailedNodeView({model: nodeModel});
        pvt.conceptDisplayWrap.appendChild(dNodeView.render().el);
        $(pvt.conceptDisplayWrap).scrollTop(0);
        return dNodeView;
      },

      // expandConcept: function(conceptTag){
      //   this.showConceptDetailsForTitleEl(null, this.idToTitleView[conceptTag].$el);
      // },

      initialize: function(inp){
        var thisView = this;
        thisView.isRendered = false;
        thisView.appRouter = inp.appRouter;
        // FIXME UPDATE
        // thisView.listenTo(thisView.model.get("options"), "change:showLearnedConcepts", thisView.render); // TODO any zombie listeners?
      },

      /**
       * Render the learning view given the supplied collection
       * TODO rerender (the appropriate section) when the model changes
       */
      render: function(){
        var thisView = this,
            $el = thisView.$el,
            $expandedTitle = thisView.$expandedTitle,
            viewConsts = pvt.viewConsts,
            clkItmClass = viewConsts.clickedItmClass,
            nodes = thisView.model.getNodes(),
            timeEstimate;
        thisView.isRendered = false;

        $el.html('');

        // // build the sidebar TODO refactor into a view
        // var $div = $(document.createElement("div"));
        // $div.attr("id", (pvt.viewConsts.titleListId));
        // thisView.nodeOrdering = thisView.model.getTopoSort();
        // var titlesTitle = document.createElement("h1");
        // titlesTitle.textContent = "Learning Plan";
        // thisView.$el.prepend(titlesTitle);
        // $div.append(titlesTitle);

//        var timeEstimateEl = document.createElement("div");
//        timeEstimateEl.className = viewConsts.timeEstimateClass;

        // var lpButton = document.createElement("div");
        // lpButton.id = viewConsts.lpButtonId;
        // lpButton.className = "small-vp-button";
        // lpButton.textContent = "Learning Plan";
        // // TODO move hard coding
        // $(lpButton).on("click", function(){
        //   $div.toggleClass(viewConsts.showClass);
        //   $(this).toggleClass("expanded");
        // });
        // $el.append(lpButton);

        // $div.append(timeEstimateEl);
        // var $titlesEl = thisView.renderTitles();
        // $div.append($titlesEl);

        // thisView.$el.append($div);
        // thisView.updateTimeEstimate();

        pvt.conceptDisplayWrap = document.createElement("div");
        pvt.conceptDisplayWrap.id =  pvt.viewConsts.conceptDisplayWrapId;
        thisView.$el.append(pvt.conceptDisplayWrap);
        // recapture previous expand/collapse state TODO is this desirable behavior?
        if ($expandedTitle){
          // check that new title is in group
          var $newTitle = thisView.$el.find("#" + $expandedTitle.attr("id"));
          if ($newTitle.length > 0){
            thisView.$expandedTitle = $newTitle;
            thisView.showConceptDetailsForTitleEl(null, $newTitle);
          }
          else{
            thisView.$expandedTitle = null;
            thisView.expandedNode = null;
          }
        }

        thisView.delegateEvents();
        thisView.isRendered = true;
        return thisView;
      },


      /**
       * Clean up the view
       */
      close: function(){
        this.expandedNode.close();
        this.remove();
        this.unbind();
      },

      /**
       * Return true if the view has been rendered
       */
      isViewRendered: function(){
        return this.isRendered;
      }
    });
  })();

  // return require.js object:
  return LearnView;
});
