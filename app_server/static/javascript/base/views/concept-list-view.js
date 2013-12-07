/*global define*/

define(["backbone", "underscore", "jquery", "base/utils/utils"], function (Backbone, _, $, Utils) {

  /**
   * Display the concepts as an item in the node list
   */
  var NodeListItemView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.viewConsts = {
      templateId: "node-title-view-template", // name of view template (warning: hardcoded in html)
      implicitLearnedClass: "implicit-learned-concept-title",
      viewClass: "learn-title-display",
      viewIdPrefix: "node-title-view-", // must also change in parent
      learnedCheckClass: "lcheck",
      learnedClass: "learned-concept-title",
      starredClass: "starred-concept-title"
    };

    // return public object for node list item view
    return Backbone.View.extend({
      template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),

      id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.id;},

      tagName: "li",

      events: {
        "click .learn-view-check": function(evt){
          evt.stopPropagation();
          this.toggleConceptState(evt, "learn");
        },
        "click .learn-view-star": function(evt){
          evt.stopPropagation();
          this.toggleConceptState(evt, "star");
        },
        "click": function(){
          this.appRouter.changeUrlParams({focus: this.model.id});
        }
      },

      className: function(){
        var viewConsts = pvt.viewConsts,
            thisView = this,
            thisModel = thisView.model,
            aux = window.agfkGlobals.auxModel,
            id = thisModel.id;
        return pvt.viewConsts.viewClass
          + (aux.conceptIsStarred(id) ? " " + viewConsts.starredClass : "")
          + (aux.conceptIsLearned(id) ? " " + viewConsts.learnedClass : "")
          + (thisModel.getImplicitLearnStatus() ? " " + viewConsts.implicitLearnedClass : "");
      },

      /**
       * Initialize the view with appropriate listeners
       */
      initialize: function(inp){
        var thisView = this,
            viewConsts = pvt.viewConsts,
            learnedClass = viewConsts.learnedClass,
            implicitLearnedClass = viewConsts.implicitLearnedClass,
            starredClass = viewConsts.starredClass,
            nodeTag = thisView.model.id,
            aux = window.agfkGlobals.auxModel,
            gConsts = aux.getConsts();
        // set the app router
        thisView.appRouter = inp.appRouter;

        thisView.listenTo(aux, gConsts.learnedTrigger + nodeTag, function(nodeId, nodeSid, status){
          thisView.changeTitleClass(learnedClass, status);
        });
        thisView.listenTo(aux, gConsts.starredTrigger + nodeTag, function(nodeId, nodeSid, status){
          thisView.changeTitleClass(starredClass, status);
        });
        thisView.listenTo(thisView.model, "change:implicitLearnStatus", function(nodeId, nodeSid, status){
          thisView.changeTitleClass(implicitLearnedClass, status);
        });
      },

      /**
       * Render the learning view given the supplied model
       */
      render: function(){
        var thisView = this;
        var thisModel = thisView.model;
        var h = _.clone(thisModel.toJSON());
        h.title = thisModel.getLearnViewTitle();
        thisView.$el.html(thisView.template(h));
        return thisView;
      },

      /**
       * Change the title display properties given by prop
       */
      changeTitleClass: function(classVal, status){
        if (status){
          this.$el.addClass(classVal);
        }
        else{
          this.$el.removeClass(classVal);
        }
      },

      /**
       * Toggle speficied state of given concept
       */
      toggleConceptState: function(evt, state){
        evt.stopPropagation();
        var aux = window.agfkGlobals.auxModel,
            nodeTag = this.model.id;
        state === "learn" ? aux.toggleLearnedStatus(nodeTag) : aux.toggleStarredStatus(nodeTag);
      }
    });
  })();

  return (function(){

  // private class variables and methods
    var pvt = {};
    pvt.consts = {
      templateId : "concept-list-template",
      viewId: "concept-list",
      clickedItmClass: "clicked-title",
      titleIdPrefix: "node-title-view-"
    };

    return Backbone.View.extend({

      template: _.template(document.getElementById(pvt.consts.templateId).innerHTML),

      initialize: function (inp) {
        var thisView = this,
            gConsts = window.agfkGlobals.auxModel.getConsts();
        thisView.idToTitleView = {};
        thisView.listenTo(window.agfkGlobals.auxModel,
                          gConsts.learnedTrigger, thisView.updateTimeEstimate);
        thisView.listenTo(thisView.model.getNodes(), "sync", thisView.updateTimeEstimate);
        if (inp !== undefined) {
          thisView.appRouter = inp.appRouter;
        }
      },

      render: function () {
        var thisView = this,
            appRouter = thisView.appRouter,
            nodes = thisView.model.getNodes(),
            $list = $(document.createElement("ol")),
            curNode,
            nliview;
        thisView.isRendered = false;

        // I'm going to add the jquery events here
        thisView.$el.html(thisView.template());
        // TODO consider an update-based rendering

        var nodeOrdering = thisView.model.getTopoSort();
        // add the list elements with the correct properties
        var i = -1, len = nodeOrdering.length;
        for(; ++i < len;){
          curNode = nodes.get(nodeOrdering[i]);
          nliview = new NodeListItemView({model: curNode, appRouter: appRouter});
          thisView.idToTitleView[curNode.id] = nliview;
          $list.append(nliview.render().el);
        }
        thisView.$el.find("#concept-list").append($list);

        thisView.isRendered = true;

        return thisView;
      },

      updateTimeEstimate: function(){
        var thisView = this,
            nodes = thisView.model.getNodes(),
            timeEstimate,
            timeStr;
        if (nodes.getTimeEstimate){
          timeEstimate = nodes.getTimeEstimate();
          if (timeEstimate) {
            timeStr = "Completion Time: " + Utils.formatTimeEstimate(timeEstimate);
          } else {
            timeStr = "All done!";
          }
        } else {
          timeStr = "---";
        }
        thisView.$el.find(".time-estimate").html(timeStr); // TODO move hardcoding
      },

      /**
       *
       */
      changeSelectedTitle: function (selId) {
        var thisView = this,
            clickedItmClass = pvt.consts.clickedItmClass;
        thisView.$el.find("." + clickedItmClass).removeClass(clickedItmClass);
        $("#" + thisView.getDomIdFromId(selId)).addClass(clickedItmClass);
      },

      getDomIdFromId: function (id) {
        return pvt.consts.titleIdPrefix + id;
      },

      /**
       * Return true if the view has been rendered
       */
      isViewRendered: function(){
        return this.isRendered;
      },

      /**
       * Clean up the view
       */
      close: function(){
        this.remove();
        this.unbind();
      }
    });
  })(); // end of return statement
});
