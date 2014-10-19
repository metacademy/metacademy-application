/**
 * This file contains the learning view and appropo subviews and must be loaded
 * after the models and collections
 */

/*global define*/

define(["backbone", "underscore", "jquery", "utils/utils"], function(Backbone, _, $, Utils){
  "use strict";

  /**
   * View to display detailed resource information
   */
  var ResourceView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.consts = {
      templateId: "resource-view-template",
      viewClass: "resource-view",
      viewIdPrefix: "resource-details-"
    };

    // return public object
    return Backbone.View.extend({
      template: _.template(document.getElementById( pvt.consts.templateId).innerHTML),
      id: function(){ return pvt.consts.viewIdPrefix +  this.model.cid;},
      className: pvt.consts.viewClass,

      /**
       * Render the learning view given the supplied model
       */
      render: function(){
        var thisView = this;
        var temp = _.extend(thisView.model.attributes, {GRAPH_CONCEPT_PATH: window.GRAPH_CONCEPT_PATH,
                                                      yearString: this.model.getYearString()});
        thisView.$el.html(thisView.template(temp));
        return thisView;
      }
    });
  })();

  /**
   * Wrapper view to display all dependencies
   */
  var ResourcesSectionView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.consts = {
      templateId: "resources-section-view-template",
      viewClass: "resources-wrapper",
      viewIdPrefix: "resources-wrapper-"
    };

    // return public object
    return Backbone.View.extend({
      template: _.template(document.getElementById( pvt.consts.templateId).innerHTML),
      id: function(){ return pvt.consts.viewIdPrefix +  this.options.conceptId;},
      className: pvt.consts.viewClass,

      /**
       * Render the learning view given the supplied model
       */
      render: function(){
        var thisView = this;
        var coreResources = thisView.model.getCore(),
            suppResources = thisView.model.getSupplemental(),
            fcResources = coreResources.getFreeResources(),
            scResources = coreResources.getFreeSignupResources(),
            pcResources = coreResources.getPaidResources(),
            fsResources = suppResources.getFreeResources(),
            ssResources = suppResources.getFreeSignupResources(),
            psResources = suppResources.getPaidResources();

        var tempVars = {
          'coreResources': coreResources,
          'suppResources': suppResources,
          'freeCoreResources': fcResources,
          'freeSignupCoreResources': scResources,
          'paidCoreResources': pcResources,
          'freeSuppResources': fsResources,
          'freeSignupSuppResources': ssResources,
          'paidSuppResources': psResources,
          'id': this.options.conceptId
        };
        thisView.$el.html(thisView.template(_.extend(thisView.model.toJSON(), tempVars)));

        var fcEl = thisView.$el.find(".free-core-resources-wrap");
        fcResources.each(function(itm){
          fcEl.append(new ResourceView({model: itm}).render().el);
        });

        var scEl = thisView.$el.find(".free-signup-core-resources-wrap");
        scResources.each(function(itm){
          scEl.append(new ResourceView({model: itm}).render().el);
        });

        var pcEl = thisView.$el.find(".paid-core-resources-wrap");
        pcResources.each(function(itm){
          pcEl.append(new ResourceView({model: itm}).render().el);
        });

        var fsEl = thisView.$el.find(".free-supp-resources-wrap");
        fsResources.each(function(itm){
          fsEl.append(new ResourceView({model: itm}).render().el);
        });

        var ssEl = thisView.$el.find(".free-signup-supp-resources-wrap");
        ssResources.each(function(itm){
          ssEl.append(new ResourceView({model: itm}).render().el);
        });

        var psEl = thisView.$el.find(".paid-supp-resources-wrap");
        psResources.each(function(itm){
          psEl.append(new ResourceView({model: itm}).render().el);
        });

        thisView.delegateEvents();
        return thisView;
      }
    });
  })();

  /**
   * Return view that displays the detailed node information
   */
  return  (function(){
    // define private variables and methods
    var pvt = {};

    pvt.consts = {
      templateId: "node-detail-view-template", // name of view template (warning: hardcoded in html)
      viewTag: "section",
      viewIdPrefix: "node-detail-view-",
      viewClass: "node-detail-view",
      resourcesLocClass: 'resources-wrap', // classes are specified in the node-detail template
      learnViewCheckClass: 'learn-view-check',
      learnViewStarClass: 'learn-view-star',
      learnedClass: "learned-concept",
      starredClass: "starred-concept", // TODO this needs to be refactored with learn view title
      implicitLearnedClass: "implicit-learned-concept",
      internalLinkClass: "internal-link",
      missingLinkClass: "missing-link"

    };

    // return public object for detailed node view
    return Backbone.View.extend({
      template: _.template(document.getElementById( pvt.consts.templateId).innerHTML),
      id: function(){ return pvt.consts.viewIdPrefix + this.model.get("id");},

      events: {
        "click .learn-view-check": function(evt){
          evt.stopPropagation();
          this.toggleConceptState(evt, "learn");
        },
        "click .learn-view-star": function(evt){
          evt.stopPropagation();
          this.toggleConceptState(evt, "star");
        },
        "mousedown .focus-link": "changeFocusNode"
      },

      tagName: pvt.consts.viewTag,

      className: function(){
        var consts = pvt.consts,
            thisView = this,
            thisModel = thisView.model,
            id = thisModel.id,
            aux = window.agfkGlobals.auxModel;

        return pvt.consts.viewClass
          + (aux.conceptIsStarred(id) ? " " + consts.starredClass : "")
          + (aux.conceptIsLearned(id) ? " " + consts.learnedClass : "")
          + (thisModel.getImplicitLearnStatus() ? " " + consts.implicitLearnedClass : "");
      },

      initialize: function(inp){
        var consts = pvt.consts,
            thisView = this,
            aux = window.agfkGlobals.auxModel,
            nodeTag = thisView.model.id,
            gConsts = aux.getConsts();
            thisView.appRouter = inp.appRouter;

        function changeClass(sel, className, status){
          if(status){
            thisView.$el.addClass(className);
          }
          else{
            thisView.$el.removeClass(className);
          }
        }

        // TODO refactor this code if we keep the star and check in current location
        thisView.listenTo(aux, gConsts.learnedTrigger + nodeTag, function(nodeId, status){
          changeClass("." + consts.learnViewCheckClass, consts.learnedClass, status);
        });
        thisView.listenTo(aux, gConsts.starredTrigger + nodeTag, function(nodeId, status){
          changeClass("." + consts.starViewStarClass, consts.starredClass, status);
        });

      },

      /**
       * Render the learning view given the supplied model TODO consider using setElement instead of html
       * TODO try to reduce the boiler-plate repetition in rendering this view
       */
      render: function(){
        var thisView = this,
            consts = pvt.consts,
            assignObj = {},
            resourcesLocClass = "." + consts.resourcesLocClass;

        if (thisView.model.get("is_partial")) {
          thisView.model.fetch({remove:false,  success: function (resp) {
            thisView.model.set("is_partial", false);
            thisView.render();
          }});
        }

        thisView.isRendered = false;
        var templateVars = _.extend(thisView.model.attributes, {
                             "notes": thisView.notesList(),
                             "time": Utils.formatTimeEstimate(thisView.model.get("learn_time")),
                             "displayTitle": thisView.model.getLearnViewTitle()});

        if (!thisView.parsedPointers) {
          thisView.parsedPointers = Utils.simpleMdToHtml(thisView.model.get("pointers"));
          var checkTags = [];
          $(thisView.parsedPointers).find("." + pvt.consts.internalLinkClass).each(function (i, ael) {
            checkTags.push(ael.getAttribute("data-tag"));
          });
          if (checkTags.length) {
            // TODO remove hardcoded url
            $.ajax({
              dataType: "json",
              url: "/graphs/tagschecker/",
              data: {"tags": window.JSON.stringify(checkTags)},
              success: function (resp) {
                for (var tag in resp) {
                  if (!resp[tag]) {
                    thisView.$el.find("[data-tag=" + tag + "]").addClass(pvt.consts.missingLinkClass);
                  }
                };
              }
            });
          }

          // check that all pointer tags exist
        }

        thisView.$el.html(thisView.template(templateVars));
        thisView.resources = thisView.resources
            || new ResourcesSectionView({model: thisView.model.get("resources"),
                                                                             conceptId: thisView.model.get("id")});
        if (thisView.resources.model.length > 0){
          assignObj[resourcesLocClass] = thisView.resources;
        }

        // update the hovertext when nodes are marked learned/unlearned
        var aux = window.agfkGlobals.auxModel;

        thisView.assign(assignObj);
        thisView.delegateEvents();
        thisView.$el.scrollTop(0);

        thisView.isRendered = true;
        return thisView;
      },

      /**
       * Assign subviews: method groked from http://ianstormtaylor.com/assigning-backbone-subviews-made-even-cleaner/
       */
      assign: function (selector, view) {
        var selectors;
        if (_.isObject(selector)) {
          selectors = selector;
        }
        else {
          selectors = {};
          selectors[selector] = view;
        }
        if (!selectors) return;
        _.each(selectors, function (view, selector) {
          view.setElement(this.$(selector)).render();
        }, this);
      },

      /**
       * Toggle speficied state of given concept
       */
      toggleConceptState: function(evt, state){
        evt.stopPropagation();
        var aux = window.agfkGlobals.auxModel,
            nodeTag = this.model.id;
        state === "learn" ? aux.toggleLearnedStatus(nodeTag) : aux.toggleStarredStatus(nodeTag);
      },

      /**
       * Set the focus node
       */
      changeFocusNode: function (evt) {
        var thisView = this,
            focus = $(evt.currentTarget).data("focus");
        evt.preventDefault();
        thisView.appRouter.changeUrlParams({focus: focus});
      },

      /**
       * Compute the list of notes to display.
       */
      notesList: function() {
        var thisView = this,
            notes = [];
        if (thisView.model.get("is_shortcut")) {
          notes.push(thisView.shortcutNote());
        }
        if (thisView.model.get("flags")) {
          notes = notes.concat(thisView.model.get("flags"));
        }
        if (!thisView.model.get("is_partial") && !thisView.model.isFinished()) {
          notes.push("This concept is still under construction.");
        }
        return notes;
      },

      /**
       * Clean Up the view properly
       */
      close: function(){
        this.unbind();
        this.remove();
      },

      /**
       * Return true if the view has been rendered
       */
      isViewRendered: function(){
        return this.isRendered;
      }
    });
  })();
});
