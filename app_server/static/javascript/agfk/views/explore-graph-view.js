
/*global define*/
// TODO do we still want to dim "implicitly learned nodes?"
define(["backbone", "d3", "jquery", "underscore", "lib/kmapjs/views/graph-view", "utils/utils", "utils/errors"], function(Backbone, d3, $, _, GraphView, Utils, ErrorHandler){
  "use strict";

  return (function(){
    /**
     * Private methods and variables
     */
    var pvt = {};

    // FIXME refactor these names given the names in graph-view.js, also look for unused css
    pvt.consts = _.extend(GraphView.prototype.getConstsClone(), {
      // ----- class and id names ----- //
      viewId: "graph-view", // id of view element (div by default) must change in CSS as well
      exploreSvgId: "explore-svg",
      learnedClass: "learned",
      implicitLearnedClass: "implicit-learned",
      dataHoveredProp: "data-hovered",
      elIconClass: "e-to-l-icon",
      starClass: "node-star",
      starHoveredClass: "node-star-hovered",
      starredClass: "starred",
      checkClass: "checkmark",
      checkHoveredClass: "checkmark-hovered",
      summaryDivSuffix: "-summary-txt",
      summaryWrapDivSuffix: "-summary-wrap",
      summaryTextClass: "summary-text",
      summaryWrapClass: "summary-wrap",
      summaryLeftClass: "tleft",
      summaryRightClass: "tright",
      dataConceptTagProp: "data-concept",
      infoBoxId: "explore-info-box",
      // message to display in explore view when no summary is present
      NO_SUMMARY_MSG: "-- Sorry, this concept is under construction and currently does not have a summary. --",
      // ----- rendering options ----- //
      summaryWidth: 350, // px width of summary node (TODO can we move this to css and obtain the width after setting the class?)
      summaryArrowWidth: 32, // summary triangle width
      summaryArrowTop: 28, // top distance to triangle apex
      summaryAppearDelay: 250, // delay before summary appears (makes smoother navigation)
      summaryHideDelay: 100,
      summaryFadeInTime: 50, // summary fade in time (ms)
      elIconScale: 1,
      elIconHeight: 18,
      elIconWidth: 18,
      elIconXOffset: -32,
      elIconYOffset: -10,
      starPts: "350,75 379,161 469,161 397,215 423,301 350,250 277,301 303,215 231,161 321,161", // svg star path
      starXOffset: 0,
      starYOffset: -15,
      starGScale: 0.07, // relative size of "completed" star group
      checkCircleR: 15, // radius of circle around "completed" check
      checkXOffset: 0, // px offset of checkmark from longest text element
      checkYOffset: 0, // px offset of checkmark from longest text element
      checkPath: "M -12,4 L -5,10 L 13,-6", // svg path to create check mark
      checkGScale: 0.55, // relative size of "completed" check group
      nodeIconsConstYOffset: 15, // constant y offset for the node icons
      nodeIconsPerYOffset: 7 // y offset for each text element for the node icons
    });

    pvt.$hoverTxtButtonEl = $("#" + pvt.consts.hoverTextButtonsId);

    /**
     * Adds the explore-to-learn node icons TODO shouldn't be a pvt fun
     */
    pvt.addEToLIcon = function(d, d3node){
      var thisView = this,
          consts = pvt.consts;

      var iconG = d3node.append("svg:image")
            .attr("xlink:href", window.STATIC_PATH + "images/list-icon.png") // TODO move hardcoding
            .attr("class", consts.elIconClass)
            .attr("height", consts.elIconHeight + "px")
            .attr("width", consts.elIconWidth + "px")
            .attr(consts.dataConceptTagProp, d.id)
            .on("mouseup", function () {
              thisView.handleEToLConceptClick.call(thisView, this.getAttribute(consts.dataConceptTagProp), this);
            }
               );

      var numEls = d3node.selectAll("tspan")[0].length,
          elIconX = consts.elIconXOffset,
          elIconY = consts.nodeIconsConstYOffset
            + (numEls-1)*consts.nodeIconsPerYOffset
            *(numEls > consts.reduceNodeTitleLength ? 2/3 : 1)
            + consts.elIconYOffset; // TODO fix this hack for large titles
      iconG.attr("transform",
                 "translate(" + elIconX + "," + elIconY + ") "
                 + "scale(" + consts.elIconScale + ")");

    };

    pvt.attachIconToNode = function(d3node, d, mouseUpFun, appendObjs, xOff, yOff, scale, iconClass){
      var thisView = this,
          consts = pvt.consts,
          nodeId = d.id,
          aux = window.agfkGlobals.auxModel;

      var gEl = d3node.append("g")
            .attr("class", iconClass)
            .on("mouseup", function(){
              thisView.state.iconClicked = true;
              mouseUpFun.call(aux, nodeId);
            })
            .on("mouseover", function() {
              d3.select(this).classed(consts.hoveredClass, true);
            })
            .on("mouseout", function() {
              d3.select(this).classed(consts.hoveredClass, false);
            });

      appendObjs.forEach(function(obj){
        gEl.append(obj.svgEl)
          .attr(obj.attr, obj.attrVal);
      });

      var numEls = d3node.selectAll("tspan")[0].length;
      yOff += consts.nodeIconsConstYOffset
        + (numEls-1)*consts.nodeIconsPerYOffset*(numEls > consts.reduceNodeTitleLength ? 2/3 : 1);
      gEl.attr("transform",
               "translate(" + xOff + "," + yOff + ") "
               + "scale(" + scale + ")");
    };

    /**
     * Small helper function for attaching properties to dom els
     */
    pvt.addPropFunction = function (mdl, prop) {
      var thisView = this,
          d3node = thisView.d3Svg.select("#" + thisView.getCircleGId(mdl));
      if (d3node.node() !== null){
        thisView.toggleNodeProps(mdl, d3node, true, prop);
      }
    };

    /**
     * return public object
     */
    return GraphView.extend({
      // id of view element (div unless tagName is specified)
      id: pvt.consts.viewId,

      events: {
        "click #explore-info-box button": "handleShowAllClick"
      },

      /**
       * @Override
       * Function called after initialize actions
       */
      postinitialize: function() {
        // build initial graph based on input collection
        var thisView = this,
            nodes = thisView.model.getNodes(),
            aux = window.agfkGlobals.auxModel,
            gConsts = aux.getConsts(),
            thisModel = thisView.model;

        thisView.doAnims = true;
        thisView.scopeNode = null;

        // dim nodes that are [implicitly] learned or starred
        thisView.listenTo(aux, gConsts.learnedTrigger, function(nodeId, nodeSid, status){
          var d3El = d3.select("#" + thisView.getCircleGId(nodeId));
          if (d3El.node() !== null){
            thisView.toggleNodeProps(thisModel.getNode(nodeId), d3El, status, "learned");
          }
        });
        thisView.listenTo(aux, gConsts.starredTrigger, function(nodeId, nodeSid, status){
          var d3El = d3.select("#" + thisView.getCircleGId(nodeId));
          if (d3El.node() !== null){
            thisView.toggleNodeProps(thisModel.getNode(nodeId), d3El, status, "starred");
          }
        });
        thisView.listenTo(nodes, "change:implicitLearnStatus", function(nodeId, nodeSid, status){
          var d3El = d3.select("#" + thisView.getCircleGId(nodeId));
          if (d3El.node() !== null){
            thisView.toggleNodeProps(thisModel.getNode(nodeId), d3El, status, "implicitLearned");
          }
        });

        // rerender graph (for now) when clearing learned nodes
        // TODO do we need to clean up this view to avoid zombies?
        thisView.listenTo(thisView.model.get("options"), "change:showLearnedConcepts", thisView.render);
      },

      /**
       * @Override
       */
      handleNewCircles: function (newGs) {
        var thisView = this,
            thisNodes = thisView.model.getNodes(),
            aux = window.agfkGlobals.auxModel;

        // FIXME this will likely need to be refactored
        _.each(thisNodes.filter(function(nde){return aux.conceptIsLearned(nde.id);}), function(mnode){
          pvt.addPropFunction.call(thisView, mnode, "learned");
        });
        _.each(thisNodes.filter(function(nde){return nde.getImplicitLearnStatus();}), function(mnode){
          pvt.addPropFunction.call(thisView, mnode, "implicitLearned");
        });
        _.each(thisNodes.filter(function(nde){return aux.conceptIsStarred(nde.id);}), function(mnode){
          pvt.addPropFunction.call(thisView, mnode, "starred");
        });
      },

      /**
       * @Override
       */
      postSvgMouseUp: function () {
        var thisView = this;
      },

      /**
       * @Override
       */
      postrender: function () {
        // clip appropriate edges so we end up with a whisp effect
        var thisView = this,
            consts = pvt.consts;
        // create/change toast text
        if (!thisView.$infoTextBox) {
          var $infoTextBoxEl = $(document.createElement("div"));
          $infoTextBoxEl.attr("id", consts.infoBoxId);
          var $infoTextBox = $(document.createElement("div")).addClass("textbox");
          $infoTextBoxEl.append($infoTextBox);
          var $button = $(document.createElement("button"));
          $button.text("show all");
          $infoTextBoxEl.append($button);
          thisView.$el.append($infoTextBoxEl);
          thisView.$infoTextBox = $infoTextBox;
        }
        if (thisView.focusNode) {
          thisView.$infoTextBox.text(thisView.numHiddenNodes + " concepts currently hidden");
        }
      },

      /**
       * @Override
       * setup the appropriate event listers
       */
      firstRender: function(){
        // build initial graph based on input collection
        var thisView = this,
            consts = pvt.consts,
            nodes = thisView.model.getNodes(),
            aux = window.agfkGlobals.auxModel,
            gConsts = aux.getConsts(),
            thisModel = thisView.model;

        thisView.optimizeGraphPlacement(false, false, thisView.model.get("roots")[0]);
      },

      /**
       * Toggle propType properties for the given explore node
       * d3node: d3 selection for the given node
       * toggleOn: whether to toggle on (true) or off (false) the learned properties
       * propType: specify the property type: "learned", "implicitLearned", "starred"
       */
      toggleNodeProps: function(d, d3node, toggleOn, propType){
        var consts = pvt.consts,
            thisView = this,
            changeLearnStatus = propType === "learned" || propType === "implicitLearned",
            d3Svg = thisView.d3Svg;
        var propClass = {"learned": consts.learnedClass,
                         "implicitLearned": consts.implicitLearnedClass,
                         "starred": consts.starredClass
                        }[propType];

        if (changeLearnStatus){
          var hasCheck = d3node.select("." + consts.checkClass).node() !== null;
          // insert checkmark if needed
          if (propType === "learned" && toggleOn && !hasCheck){
            thisView.addCheckmarkIcon(d, d3node);
          }
          // toggle appropriate class for outlinks and inlinks
          thisView.changeEdgesClass(d.get("outlinks"), propClass, toggleOn, d3Svg);
          thisView.changeEdgesClass(d.get("dependencies"), propClass, toggleOn, d3Svg);
        }
        else{
          var hasStar =  d3node.select("." + consts.starClass).node() !== null;
          if (toggleOn && !hasStar){
            thisView.addStarIcon(d, d3node);
          }
        }

        d3node.classed(propClass, toggleOn);
      },

      /**
       * Change the class of the provided edge models
       * @param edgeCollections: a collection of DirectedEdge models
       * @param className: name of class to add/remove
       * @param addClass: true to add class, false to remove
       */
      changeEdgesClass: function(edgeCollections, className, addClass, d3Sel){
        var thisView = this,
            d3edge;
        edgeCollections.each(function(edge){
          d3edge = thisView.getD3PathGFromModel(edge);
          if (d3edge.node() !== null){
            d3edge.classed(className, addClass);
          }
        });
        return true;
      },

      /**
       * Handle explore-to-learn view event that scopees on the clicked concept
       *
       * @param evt: the click event
       */
      handleEToLConceptClick: function(conceptTag, imgEl){
        var thisView = this;
        thisView.transferToLearnViewForConcept(conceptTag);
        thisView.state.iconClicked = true;
        // simulate mouseout for explore-graph-view consistency
        Utils.simulate(imgEl.parentNode, "mouseout", {
          relatedTarget: document
        });
      },

      /**
       * Trigger transfer from explore view to learn view and scope on conceptTag
       *
       * @param conceptTag: the tag of the concept to show in the learn view
       */
      transferToLearnViewForConcept: function(conceptTag){
        this.appRouter.changeUrlParams({mode: "learn", focus: conceptTag});
      },

      /**
       * @Override
       */
      postCircleMouseOver: function (d, nodeEl) {
        // add node-hoverables if not already present
        var thisView = this,
            d3node = d3.select(nodeEl),
            consts = pvt.consts;

        if (!d3node.attr(consts.dataHoveredProp)) {
          // add checkmark if not present
          if (d3node.select("." + consts.checkClass).node() === null){
            thisView.addCheckmarkIcon(d, d3node);
          }
          // add node star if not already present
          if (d3node.select("." + consts.starClass).node() === null){
            thisView.addStarIcon(d, d3node);
          }

          // add e-to-l button if not already present
          if (d3node.select("." + consts.elIconClass).node() === null){
            pvt.addEToLIcon.call(thisView, d, d3node);
          }
          d3node.attr(consts.dataHoveredProp, true);
        }
        return 0;
      },


      /**
       * Show the node summary in "hover box" next to the node
       * TODO consider making this a view that monitors the nodes (i.e. event driven)
       */
      showNodeSummary: function(d, circle) {
        var thisView = this,
            consts = pvt.consts,
            div = document.createElement("div"),
            circleId = circle.attr("id"),
            summaryP = document.createElement("p"),
            summaryTxt;

        // add summary
        summaryTxt = d.get("summary");
        summaryP.textContent = summaryTxt.length > 0 ? summaryTxt : consts.NO_SUMMARY_MSG;

        div.appendChild(summaryP);
        div.id = pvt.getSummaryIdForDivTxt.call(thisView, circle);
        var $div = $(div);
        $div.addClass(consts.summaryTextClass);

        // add wrapper div so we can use "overflow" pseudo elements
        var wrapDiv = document.createElement("div"),
            d3wrapDiv = d3.select(wrapDiv);
        wrapDiv.id = pvt.getSummaryIdForDivWrap.call(thisView, circle);
        d3wrapDiv.classed(consts.summaryWrapClass, true);

        // place the summary box on the side with the most screen real-estate
        var circleRect = circle.node().getBoundingClientRect(),
            placeLeft = circleRect.left + circleRect.width / 2 > window.innerWidth / 2;
        d3wrapDiv.classed(placeLeft ? consts.summaryRightClass : consts.summaryLeftClass, true);
        wrapDiv.appendChild(div);

        // get/set location of box
        var sumLoc = pvt.getSummaryBoxPlacement(circleRect, placeLeft);
        wrapDiv.style.left = sumLoc.left;
        wrapDiv.style.top = sumLoc.top;
        wrapDiv.style.width = consts.summaryWidth + "px";
        wrapDiv.style.display = "none";

        // add box to document with slight fade-in
        var $wrapDiv = $(wrapDiv);
        thisView.summaryTOStartList[circleId] = window.setTimeout(function(){
          delete thisView.summaryTOStartList[circleId];
          $wrapDiv.appendTo("#" + consts.viewId).fadeIn(consts.summaryFadeInTime);
        }, consts.summaryAppearDelay);

        thisView.summaryDisplays[wrapDiv.id] = {"$wrapDiv": $wrapDiv, "d3circle": circle, "placeLeft": placeLeft};
        return $wrapDiv;
      },

      /**
       * Add bookmark star and associated properties to the given node
       */
      addStarIcon: function(d, d3node){
        var consts = pvt.consts,
            appendObj = [{
              svgEl: "polygon",
              attr: "points",
              attrVal: consts.starPts
            }],
            xOff = consts.starXOffset,
            yOff = consts.starYOffset;
        pvt.attachIconToNode.call(this, d3node, d, window.agfkGlobals.auxModel.toggleStarredStatus,
                                  appendObj, xOff, yOff, consts.starGScale, consts.starClass);
      },

      /**
       * Add the check mark and associated properties to the given node
       */
      addCheckmarkIcon: function(d, d3node){
        var consts = pvt.consts,
            appendObj = [{
              svgEl: "path",
              attr: "d",
              attrVal: consts.checkPath
            },
                         {
                           svgEl: "circle",
                           attr: "r",
                           attrVal: consts.checkCircleR
                         }],
            xOff = consts.checkXOffset,
            yOff = consts.checkYOffset;
        pvt.attachIconToNode.call(this, d3node, d,
                                  window.agfkGlobals.auxModel.toggleLearnedStatus, appendObj,
                                  xOff, yOff, consts.checkGScale, consts.checkClass);
      },

      /**
       * @Override
       * @return {boolean} true if the node is visible
       */
      isNodeVisible: function(node){
        var aux = window.agfkGlobals.auxModel,
            thisView = this;
        return !node.get("isContracted")
          && ( !node.isLearnedOrImplicitLearned()
               ||  thisView.model.get("options").get("showLearnedConcepts")); // FIXME change this logic after removing options model
      }
    }); // end Backbone.View.extend({
  })();
});
