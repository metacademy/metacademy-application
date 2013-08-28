/**
 * This file contains the learning view and appropo subviews and must be loaded
 * after the models and collections
 */


window.define(["backbone", "underscore", "jquery", "agfk/utils/errors"], function(Backbone, _, $, ErrorHandler){
  "use strict";
  
  /**
   * Display the model as an item in the node list
   */
  var NodeListItemView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.parentView = null;
    
    pvt.viewConsts = {
      templateId: "node-title-view-template", // name of view template (warning: hardcoded in html)
      learnedClass: "learned-concept-title",
      implicitLearnedClass: "implicit-learned-concept-title",
      viewClass: "learn-title-display",
      viewIdPrefix: "node-title-view-div-",
      learnedCheckClass: "lcheck"
    };

    // return public object
    return Backbone.View.extend({
      template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),
      id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.id;},
      className: function(){
        var viewConsts = pvt.viewConsts,
            thisView = this,
            thisModel = thisView.model;
        return pvt.viewConsts.viewClass + (thisModel.getLearnedStatus() ? " " + viewConsts.learnedClass : "") + (thisModel.getImplicitLearnCt() > 0 ? " " + viewConsts.implicitLearnedClass : "");
      },

      events: {
        "click .learn-view-check": "toggleLearnedConcept"
      },

      /**
       * Initialize the view with appropriate listeners
       */
      initialize: function(){
        var thisView = this,
            viewConsts = pvt.viewConsts,
            learnClass = viewConsts.learnedClass,
            implicitLearnedClass = viewConsts.implicitLearnedClass;
        thisView.listenTo(thisView.model, "change:learnStatus", function(nodeId, status){
          thisView.changeTitleClass(learnClass, status);
        });
        thisView.listenTo(thisView.model, "change:implicitLearnStatus", function(nodeId, status){
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
       * Toggle learned state of given concept
       */
      toggleLearnedConcept: function(evt){
        evt.stopPropagation();
        var lclass = pvt.viewConsts.learnedClass;
        this.model.setLearnedStatus(!this.$el.hasClass(lclass));
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
       * Set the parent view
       */
      setParentView: function(pview){
        pvt.parentView = pview;
      },

      /**
       * Get the parent view
       */
      getParentView: function(){
        return pvt.pview;
      }
    });
  })();


  /**
   * View to display detailed resource information
   */
  var ResourceView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.viewConsts = {
      templateId: "resource-view-template",
      viewClass: "resource-view",
      viewIdPrefix: "resource-details-",
      extraResourceInfoClass: "extra-resource-details"
    };

    // return public object
    return Backbone.View.extend({
      template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),
      id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
      className: pvt.viewConsts.viewClass,

      events: {
        'click .more-resource-info': 'toggleAdditionalInfo'
      },
      
      /**
       * Render the learning view given the supplied model
       */
      render: function(){
        var thisView = this;
        var temp = _.extend(thisView.model.toJSON(), {GRAPH_CONCEPT_PATH: window.GRAPH_CONCEPT_PATH})
        thisView.$el.html(thisView.template(temp));
        return thisView;
      },

      toggleAdditionalInfo: function(evt){
        this.$el.find("." + pvt.viewConsts.extraResourceInfoClass).toggle();
        $(evt.currentTarget).remove();
      }

    });
  })();


  /**
   * Wrapper view to display all dependencies
   */
  var ResourcesSectionView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.viewConsts = {
      viewClass: "resources-wrapper",
      viewIdPrefix: "resources-wrapper-"
    };

    // return public object
    return Backbone.View.extend({
      id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
      className: pvt.viewConsts.viewClass,
      
      /**
       * Render the learning view given the supplied model
       */
      render: function(){
        var thisView = this;
        thisView.$el.html("");
        thisView.model.each(function(itm){
          thisView.$el.append(new ResourceView({model: itm}).render().el);
        });
        thisView.delegateEvents();
        return thisView;
      }

    });
  })();


  /**
   * View to display details of all provided resources (wrapper view)
   */
  var DependencyView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.viewConsts = {
      templateId: "dependency-view-template",
      viewClass: "dependency-view",
      viewIdPrefix: "dependency-details-"
    };

    // return public object
    return Backbone.View.extend({
      template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),
      id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
      className: pvt.viewConsts.viewClass,
      
      /**
       * Render the learning view given the supplied model
       */
      render: function(){
        var thisView = this,
            thisModel = thisView.model;
        // TODO this seems awkward
        thisView.$el.html(thisView.template(_.extend(thisModel.toJSON(), 
                                                     {fromTitle: thisModel.graphEdgeCollection.parentModel.get("aux").getTitleFromId(thisModel.get("from_tag"))}))); 
        return thisView;
      }

    });
  })();
  

  /**
   * Wrapper view to display all dependencies
   */
  var DependencySectionView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.viewConsts = {
      viewClass: "dependencies-wrapper",
      viewIdPrefix: "dependencies-wrapper-"
    };

    // return public object
    return Backbone.View.extend({
      id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
      className: pvt.viewConsts.viewClass,
      
      /**
       * Render the learning view given the supplied model
       */
      render: function(){
        var thisView = this;
        thisView.$el.html("");
        thisView.model.each(function(itm){
          thisView.$el.append(new DependencyView({model: itm}).render().el);
        });
        thisView.delegateEvents();
        return thisView;
      }

    });
  })();


  /**
   * View to display details of all provided resources (wrapper view)
   */
  var OutlinkView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.viewConsts = {
      templateId: "outlink-view-template",
      viewClass: "outlink-view",
      viewIdPrefix: "outlink-details-"
    };

    // return public object
    return Backbone.View.extend({
      template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),
      id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
      className: pvt.viewConsts.viewClass,
      
      /**
       * Render the learning view given the supplied model
       */
      render: function(){
        var thisView = this,
            thisModel = thisView.model;
        thisView.$el.html(thisView.template(_.extend(thisModel.toJSON(), {toTitle: thisModel.graphEdgeCollection.parentModel.get("aux").getTitleFromId(thisModel.get("to_tag"))})));
        return thisView;
      }

    });
  })();


  /**
   * Wrapper view to display all outlinks
   */
  var OutlinkSectionView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.viewConsts = {
      viewClass: "outlinks-wrapper",
      viewIdPrefix: "outlinks-wrapper-"
    };

    // return public object
    return Backbone.View.extend({
      id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
      className: pvt.viewConsts.viewClass,
      
      /**
       * Render the view given the supplied model
       */
      render: function(){
        var thisView = this;
        thisView.$el.html("");
        thisView.model.each(function(itm){
          thisView.$el.append(new OutlinkView({model: itm}).render().el);
        });
        thisView.delegateEvents();
        return thisView;
      }

    });
  })();


  /**
   * View to display additional notes/pointers
   * NOTE: expects a javascript model as input (for now) with one field: text
   */
  var PointersView = (function(){
    // define private variables and methods
    var pvt = {
    };

    pvt.viewConsts = {
      templateId: "pointers-view-template",
      viewClass: "pointers-view",
      viewIdPrefix: "pointers-view-"
    };

    pvt.itemToStr = function(item){
      if (item.link) {
        return '<a class="internal-link" href="' + window.GRAPH_CONCEPT_PATH + item.link + '#lfocus=' + item.link + '">' + item.text + '</a>';
      } else {
        return item.text;
      }
    }

    pvt.lineToStr = function(parts){
      var i, result = '';
      for (i = 0; i < parts.length; i++){
        result += pvt.itemToStr(parts[i]);
      }
      return result;
    }

    

    // return public object
    return Backbone.View.extend({
      template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),
      id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
      className: pvt.viewConsts.viewClass,
      
      /**
       * Render the learning view given the supplied model
       */
      render: function(){
        var thisView = this;
        thisView.$el.html(thisView.template({htmlStr: thisView.parsePtrTextToHtml(thisView.model.text)}));
        return thisView;
      },

      /**
       * Parse the markup-style pointer text to html list
       * TODO separate HTML generation better
       */
      parsePtrTextToHtml: function(lines){
        var i,
            prevDepth = 0,
            htmlStr = "<ul>",
            liStr;

        // array depth corresponds to list depth
        for (i = 0; i < lines.length; i++){
          var line = lines[i];
          
          var depth = line.depth;
          while (depth < prevDepth){
            htmlStr += '</ul>\n';
            depth++;
          }

          while (depth > prevDepth){
            htmlStr += '<ul>';
            depth--;
          }
          liStr = pvt.lineToStr(line.items);
          htmlStr += "<li>" + liStr + "</li>\n";
            
          prevDepth = line.depth;
          
        }

        while (prevDepth--){
          htmlStr += '</ul>\n';
        }
        htmlStr += "</ul>";

        return htmlStr;
      }
    });
  })();
  

  /**
   * Displays detailed node information
   */
  var DetailedNodeView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.viewConsts = {
      templateId: "node-detail-view-template", // name of view template (warning: hardcoded in html)
      viewTag: "section",
      viewIdPrefix: "node-detail-view-",
      viewClass: "node-detail-view",
      freeResourcesLocClass: 'free-resources-wrap', // classes are specified in the node-detail template
      paidResourcesLocClass: 'paid-resources-wrap',
      depLocClass: 'dep-wrap',
      ptrLocClass: 'pointers-wrap',
      outlinkLocClass: 'outlinks-wrap'
    };

    // return public object
    return Backbone.View.extend({
      template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),
      id: function(){ return pvt.viewConsts.viewIdPrefix + this.model.get("id");},
      tagName: pvt.viewConsts.viewTag,
      className: pvt.viewConsts.viewClass,
      
      /**
       * Render the learning view given the supplied model TODO consider using setElement instead of html
       * TODO try to reduce the boiler-plate repetition in rendering this view
       */
      render: function(){
        var thisView = this,
            viewConsts = pvt.viewConsts,
            assignObj = {},
            freeResourcesLocClass = "." + viewConsts.freeResourcesLocClass,
            paidResourcesLocClass = "." + viewConsts.paidResourcesLocClass,
            depLocClass = "." + viewConsts.depLocClass,
            outlinkLocClass = "." + viewConsts.outlinkLocClass,
            ptrLocClass = "." + viewConsts.ptrLocClass;
        
        var templateVars = _.extend(thisView.model.toJSON(), {"resourcesMsg": thisView.model.get("resources").getMessage()});
        thisView.$el.html(thisView.template(templateVars));
        thisView.fresources = thisView.fresource || new ResourcesSectionView({model: thisView.model.get("resources").getFreeResources()});
        thisView.presources = thisView.presources || new ResourcesSectionView({model: thisView.model.get("resources").getPaidResources()});
        thisView.dependencies = thisView.dependencies || new DependencySectionView({model: thisView.model.get("dependencies")});
        thisView.outlinks = thisView.outlinks || new OutlinkSectionView({model: thisView.model.get("outlinks")});
        thisView.pointers = thisView.pointers || new PointersView({model: {text: thisView.model.get("pointers")}});
        if (thisView.fresources.model.length > 0){
          assignObj[freeResourcesLocClass] = thisView.fresources;
        }
        if (thisView.presources.model.length > 0){
          assignObj[paidResourcesLocClass] = thisView.presources;
        }
        if (thisView.dependencies.model.length > 0){
          assignObj[depLocClass] = thisView.dependencies;
        }
        if (thisView.outlinks.model.length > 0){
          assignObj[outlinkLocClass] = thisView.outlinks;
        }
        if (thisView.pointers.model.text.length > 1){
          assignObj[ptrLocClass] = thisView.pointers;
        }

        thisView.assign(assignObj);
        thisView.delegateEvents();
        return thisView;
      },

      /**
       * Assign subviews: method groked from http://ianstormtaylor.com/assigning-backbone-subviews-made-even-cleaner/
       */
      assign : function (selector, view) {
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
       * Clean Up the view properly
       */
      close: function(){
        this.unbind();
        this.remove();
      }

    });
  })();


  /**
   * Main learning view
   */
  var LearnView = (function(){
    // define private variables and methods
    var pvt = {};

    pvt.isRendered = false;

    // keep track of expanded nodes: key: title node id, value: expanded view object
    pvt.expandedNodes = {};

    pvt.idToTitleView = {};
    
    pvt.nodeOrdering = null;

    pvt.viewConsts = {
      viewId: "learn-view",
      clickedItmClass: "clicked-title"
    };

    /**
     * Insert a given subview after the specified dom node
     */
    pvt.insertSubViewAfter = function(subview, domNode){
      domNode.parentNode.insertBefore(subview.render().el, domNode.nextSibling);
    };

    // return public object
    return Backbone.View.extend({
      id: pvt.viewConsts.viewId,

      events: {
        "click .learn-title-display": "showNodeDetailsFromEvt"
      },

      /**
       * Expand/collapse the clicked concept title
       */
      showNodeDetailsFromEvt: function(evt){
        this.toggleConceptDetails(evt.currentTarget);       
      },

      /**
       * Expand/collapse the given concept title
       */
      toggleConceptDetails: function(titleEl, $titleEl){
          var nid,
            clickedItmClass = pvt.viewConsts.clickedItmClass,
            thisView = this,
            titleId;
        $titleEl = $titleEl || $(titleEl);
        $titleEl.toggleClass(clickedItmClass);
        titleId = $titleEl.attr("id");
        
        if ($titleEl.hasClass(clickedItmClass)){ 
          nid = titleId.split("-").pop();
          var dnode = thisView.appendDetailedNodeAfter(thisView.model.get("nodes").get(nid), $titleEl.get(0));
          pvt.expandedNodes[titleId] = dnode;
        }
        else{
          if (pvt.expandedNodes.hasOwnProperty(titleId)){
            var expView = pvt.expandedNodes[titleId];
            expView.close();
            delete pvt.expandedNodes[titleId];
          }
        }       
      },

      /**
       * Append detailed node view to given element id that is a child of thisView
       * Returns the view object for the appended concept
       */
      appendDetailedNodeAfter: function(nodeModel, domNode){
        var thisView = this,
            dNodeView = new DetailedNodeView({model: nodeModel});
        pvt.insertSubViewAfter(dNodeView, domNode);
        return dNodeView;
      },

      /**
       * Set the scroll bar so that the top of domEl aligns with the top of the page (if possible)
       * NB the view must be rendered before this function will work TODO workarounds?
       */
      setScrollTop: function(domEl, $domEl){
        try{
          var parentNode = this.$el.parent(),
              scrollPos;
          $domEl = $domEl || $(domEl);

          ErrorHandler.assert(parentNode.length > 0, "parent node not present for setScrollTop in the learning view)");
          parentNode.scrollTop(0); // reset the scroll position
          scrollPos = $domEl.position().top - $domEl.outerHeight()/2;
          parentNode.scrollTop(scrollPos);
        }
        catch(err){
          window.console.warn("Error in setScrollTop (make sure view is rendered before calling): " + err.message);
        }
      },

      /**
       * Scroll the learning view so that the top of the input concept is 
       * aligned with the top of the view and expand the concept
       */
      scrollExpandToConcept: function(conceptTag){
        // get the dom el for the given concept tag
        var thisView = this,
            titleView = pvt.idToTitleView[conceptTag];
        if (titleView instanceof NodeListItemView){
          var $titleEl = $(titleView.el);
          // expand dom el
          if (!$titleEl.hasClass(pvt.viewConsts.clickedItmClass)){
            thisView.toggleConceptDetails(null, $titleEl);
          }
          // scroll to dom el
          thisView.setScrollTop(null, $titleEl);
          
        }
      },


      initialize: function(){
        this.listenTo(this.model.get("options"), "change:showLearnedConcepts", this.render); // TODO any zombie listeners?
      },
      
      /**
       * Render the learning view given the supplied collection
       * TODO rerender (the appropriate section) when the model changes
       */
      render: function(){
        pvt.isRendered = false;
        var thisView = this,
            $el = thisView.$el,
            expandedNodes = pvt.expandedNodes,
            clkItmClass = pvt.viewConsts.clickedItmClass;

        $el.html("");
        pvt.nodeOrdering = thisView.getTopoSortedConcepts();
        thisView.renderTitles();

        // recapture previous expand/collapse state TODO is this desirable behavior?
        for (var expN in expandedNodes){
          if (expandedNodes.hasOwnProperty(expN)){
            var domEl = document.getElementById(expN);
            if (domEl !== null){
              pvt.insertSubViewAfter(expandedNodes[expN], domEl);
              domEl.className += " " + clkItmClass;
            }
          }
        }
        thisView.delegateEvents();
        pvt.isRendered = true;
        return thisView;
      },

      /**
       * Render the learning view titles 
       */
      renderTitles: function(){
        var thisView = this,
            inum,
            noLen,
            nodeOrdering = pvt.nodeOrdering || thisView.getTopoSortedConcepts(),
            curNode,
            nliview,
            $el = thisView.$el,
            thisModel = thisView.model,
            nodes = thisModel.get("nodes");
        
        for (inum = 0, noLen = nodeOrdering.length; inum < noLen; inum++){
          curNode = nodes.get(nodeOrdering[inum]);
          nliview = new NodeListItemView({model: curNode});
          nliview.setParentView(thisView);
          pvt.idToTitleView[curNode.get("id")] = nliview;
          $el.append(nliview.render().el); 
        }
      },

      /**
       * Clean up the view
       */
      close: function(){
        var expN,
            expandedNodes = pvt.expandedNodes,
            domeEl;
        for (expN in expandedNodes){
          if (expandedNodes.hasOwnProperty(expN)){
            var domEl = document.getElementById(expN);
            expandedNodes[expN].close();
            delete expandedNodes[expN];
          }
        }
        this.remove();
        this.unbind();
      },

      /**
       * Compute the learning view ordering (topological sort)
       * TODO this function may be migrated 
       * if the view ordering is user-dependent
       */
      getTopoSortedConcepts: function(){
        var thisView = this,
            thisModel = thisView.model,
            keyTag = thisModel.get("aux").get("depRoot") || "",
            nodes = thisModel.get("nodes"),
            traversedNodes = {}, // keep track of traversed nodes
            startRootNodes,
            includeLearned = thisModel.get("options").get("showLearnedConcepts"); // nodes already added to the list

        if (keyTag === ""){
          // init: obtain node tags with 0 outlinks (root nodes)
          startRootNodes = _.map(nodes.filter(function(mdl){
            return mdl.get("outlinks").length == 0 && (!includeLearned || mdl.isLearnedOrImplicitLearned());
          }), function(itm){
            return itm.get("id");
          });
        }
        else if(includeLearned || !nodes.get(keyTag).isLearnedOrImplicitLearned()){
          // root node is the keyTag
          startRootNodes = [keyTag];
        }
        else{
          return [];
        }

        // recursive dfs topological sort
        function dfsTopSort (rootNodeTags){
          var curRootNodeTagDepth,
              returnArr = [],
              rootNodeRoundArr = [],
              curRootNodeTag,
              unqDepTags,
              curNode;

          // recurse on the input root node tags
          for(curRootNodeTagDepth = 0; curRootNodeTagDepth < rootNodeTags.length; curRootNodeTagDepth++){
            curRootNodeTag = rootNodeTags[curRootNodeTagDepth];
            curNode = nodes.get(curRootNodeTag);
            if (!traversedNodes.hasOwnProperty(curRootNodeTag) && (includeLearned || (curNode && !curNode.isLearnedOrImplicitLearned()))){
              unqDepTags = curNode.getUniqueDependencies();
              if (unqDepTags.length > 0){
                returnArr = returnArr.concat(dfsTopSort(unqDepTags));
              }
              returnArr.push(curRootNodeTag);
              traversedNodes[curRootNodeTag] = 1;
            }
          }
          return returnArr;
        };
        
        return dfsTopSort(startRootNodes);
      },

      /**
       * Return true if the view has been rendered
       */
      isRendered: function(){
        return pvt.isRendered;
      }
    });
  })();

  // return require.js object:
  return LearnView;
});
