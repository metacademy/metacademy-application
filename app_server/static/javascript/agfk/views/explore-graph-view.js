/*global define*/
// TODO do we still want to dim "implicitly learned nodes?"
define(["backbone", "d3", "jquery", "underscore", "base/views/graph-view", "base/utils/utils", "base/utils/errors"], function(Backbone, d3, $, _, GraphView, Utils, ErrorHandler){
  "use strict";

  return (function(){
    /**
     * Private methods and variables
     */
    var pvt = {};

    // FIXME refactor these names given the names in graph-view.js, also look for unused css
    pvt.consts = _.extend(GraphView.prototype.getConstsClone(), {
      // ----- class and id names ----- //
      viewId: "explore-graph-view", // id of view element (div by default) must change in CSS as well
      wispGClass: "wispG",
      startWispPrefix: "startp-",
      endWispPrefix: "endp-",
      startWispClass: "start-wisp",
      endWispClass: "end-wisp",
      wispWrapperClass: "short-link-wrapper",
      linkWrapHoverClass: "link-wrapper-hover",
      depLinkWrapHoverClass: "ol-show",
      longEdgeClass: "long-edge",
      wispDashArray: "3,3",
      exploreSvgId: "explore-svg",
      learnedClass: "learned",
      implicitLearnedClass: "implicit-learned",
      dataHoveredProp: "data-hovered",
      elIconClass: "e-to-l-icon",
      starClass: "node-star",
      starHoveredClass: "node-star-hovered",
      starredClass: "starred",
      checkClass: "checkmark",
      depCircleClass: "dep-circle",
      olCircleClass: "ol-circle",
      checkHoveredClass: "checkmark-hovered",
      summaryDivSuffix: "-summary-txt",
      summaryWrapDivSuffix: "-summary-wrap",
      summaryTextClass: "summary-text",
      summaryWrapClass: "summary-wrap",
      summaryLeftClass: "tleft",
      summaryRightClass: "tright",
      locElemId: "invis-loc-elem", // invisible location element
      locElemClass: "invis-loc",
      eToLConceptTxtClass: "exp-to-learn-txt",
      learnIconName: "glasses-icon.svg",
      dataConceptTagProp: "data-concept",
      infoBoxId: "explore-info-box",
      NO_SUMMARY_MSG: "-- Sorry, this concept is under construction and currently does not have a summary. --", // message to display in explore view when no summary is present
      renderEvt: "viewRendered",
      scopeClass: "scoped",
      scopeCircleGClass: "scoped-circle-g",
      focusCircleGClass: "focused-circle-g",
      // ----- rendering options ----- //
      defaultScale: 0.54,
      numWispPts: 10,
      wispLen: 80,
      defaultExpandDepth: 1, // default number of dependencies to show on expand
      defaultGraphOrient: "BT", // orientation of graph ("BT", "TB", "LR", or "RL")
      defaultNodeSepDist: 1.7, // separation of graph nodes
      defaultNodeWidth: 2.7, // diameter of graph nodes
      edgeLenThresh: 250, // threshold length of edges to be shown by default
      numCharLineDisplayNode: 14, // max number of characters to display per title line of graph nodes
      summaryWidth: 350, // px width of summary node (TODO can we move this to css and obtain the width after setting the class?)
      summaryArrowWidth: 32, // summary triangle width
      summaryArrowTop: 28, // top distance to triangle apex
      summaryAppearDelay: 250, // delay before summary appears (makes smoother navigation)
      summaryHideDelay: 100,
      summaryFadeInTime: 50, // summary fade in time (ms)
      SQRT2DIV2: Math.sqrt(2)/2, // FIXME use Math.SQRT1_2
      maxZoomScale: 5, // maximum zoom-in level for graph
      minZoomScale: 0.05, //maximum zoom-out level for graph
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
    pvt.summaryDisplays = {}; // FIXME this won't work with multiple views
    pvt.summaryTOKillList = {}; // FIXME this won't work with multiple views
    pvt.summaryTOStartList = {}; // FIXME this won't work with multiple views

    pvt.$hoverTxtButtonEl = $("#" + pvt.consts.hoverTextButtonsId);

    /**
     * return <function> isEdgeVisible function with correct "this"
     * and transitivity not taken into account
     */
    pvt.getEdgeVisibleNoTransFun = function(){
      var thisView = this;
      return function(e){
        return thisView.isEdgeVisible.call(thisView,  e, false);
      };
    };

    /**
     * Change the scope node classes for the corresponding g elements
     */
    pvt.changeNodeClasses = function (prevD, nextD, classVal) {
      var thisView = this,
          gId;
      if (prevD) {
        gId = thisView.getCircleGId(prevD.id);
        d3.select("#" + gId).classed(classVal, false);
      }
      if (nextD) {
        gId = thisView.getCircleGId(nextD.id);
        d3.select("#" + gId).classed(classVal, true);
      }
    };

    /**
     * Returns the path of the starting wisp
     */
    pvt.getPathWispD = function (svgPath, isStart) {
      var consts = pvt.consts,
          distances = [],
          dt = consts.wispLen/consts.numWispPts,
          endDist = isStart ? consts.wispLen : svgPath.getTotalLength(),
          i = isStart ? 0 :  endDist - consts.wispLen + consts.nodeRadius; // TODO subtract node radius

      distances.push(i);
      while ((i += dt) < endDist) distances.push(i);
      var points = distances.map(function(dist){
        return svgPath.getPointAtLength(dist);
      });
      if (!isStart) points.push(svgPath.getPointAtLength(10000000)); // FIXME hack for firefox support (how to get the last point?)
      return "M" + points.map(function(p){ return p.x + "," + p.y;}).join("L");

    };

    /**
     * Get summary box placement (top left) given node placement
     */
    pvt.getSummaryBoxPlacement = function(nodeRect, placeLeft){
      var consts = pvt.consts,
          leftMultSign = placeLeft ? -1: 1,
          shiftDiff = (1 + leftMultSign*consts.SQRT2DIV2)*nodeRect.width/2 + leftMultSign*consts.summaryArrowWidth;
      if (placeLeft){shiftDiff -= consts.summaryWidth;}
      return {
        top:  (nodeRect.top + (1-consts.SQRT2DIV2)*nodeRect.height/2 - consts.summaryArrowTop) + "px",
        left:  (nodeRect.left + shiftDiff) + "px"
      };
    };

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
            + (numEls-1)*consts.nodeIconsPerYOffset*(numEls > consts.reduceNodeTitleLength ? 2/3 : 1) + consts.elIconYOffset; // TODO fix this hack for large titles
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
     * Helper function to obtain id of summary txt div for a given node in the exporation view
     */
    pvt.getSummaryIdForDivTxt = function(node) {
      return pvt.getIdOfNodeType.call(this, node) + pvt.consts.summaryDivSuffix;
    };

    /**
     * Helper function to obtain id of wrapper div of summary txt for a given node in the exporation view
     */
    pvt.getSummaryIdForDivWrap = function(node) {
      return pvt.getIdOfNodeType.call(this, node) + pvt.consts.summaryWrapDivSuffix;
    };

    /**
     * Get id of node element (d3, dom, or model)
     */
    pvt.getIdOfNodeType = function(node) {
      var nodeFun = node.attr || node.getAttribute || node.get;
      return nodeFun.call(node, "id");
    };

    /**
     * Hide long paths and show wisps
     */
    pvt.handleLongPaths = function (d, d3this) {
      var consts = pvt.consts,
          stPathD = pvt.getPathWispD(d3this.select("path").node(), true),
          endPathD = pvt.getPathWispD(d3this.select("path").node(), false),
          wispsG,
          longPaths;

      // hide long paths
      longPaths = d3this.selectAll("path");
      longPaths.on("mouseout", function(d){
        d3this.classed("link-wrapper-hover", false);
      });
      if (!d3this.classed(consts.linkWrapHoverClass)){
        longPaths.attr("opacity", 1)
          .transition()
          .attr("opacity", 0)
          .each("end", function(){
            longPaths.classed(consts.longEdgeClass, true)
              .attr("opacity", 1);
          });
      } else {
        longPaths.classed(consts.longEdgeClass, true);
      }

      // TODO remove hardcoding to consts
      wispsG = d3this.insert("g", ":first-child")
        .classed(consts.wispGClass, true);
      wispsG.append("path")
        .attr("id", consts.startWispPrefix + d3this.attr("id"))
        .attr("d", stPathD)
        .attr("stroke-dasharray", consts.wispDashArray)
        .classed(consts.startWispClass, true);
      wispsG.append("path")
        .attr("d", stPathD)
        .classed("short-link-wrapper", true);

      wispsG.append("path")
        .attr("id", consts.endWispPrefix + d3this.attr("id"))
        .attr("d", endPathD)
        .attr("stroke-dasharray", consts.wispDashArray)
        .style('marker-end','url(#end-arrow)')
        .classed(consts.endWispClass, true);

      wispsG.append("path")
        .attr("d", endPathD)
        .classed(consts.wispWrapperClass, true);

      wispsG.selectAll("path")
        .on("mouseover", function(){
          d3this.classed(consts.linkWrapHoverClass, true);
        });
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

        // attach listeners here FIXME do we have to attach these individually here?
        newGs.on("mouseover", function(d) {
          thisView.circleMouseOver.call(thisView, d, this);
        })
          .on("mouseout", function(d) {
            thisView.circleMouseOut.call(thisView, d, this);
          })
          .on("mouseup", function (d) {
            thisView.circleMouseUp.call(thisView, d, this);
          });

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
      svgMouseUp: function () {
        var thisView = this;
        // reset the states here
        thisView.state.justDragged = false;
        thisView.state.iconClicked = false;
      },

      /**
       * Mouse up on the concept circle
       */
      circleMouseUp: function (d, domEl) {
        var thisView = this;

        if (thisView.state.justDragged || thisView.state.iconClicked) {
          return false;
        }

        thisView.model.expandGraph();

        if (thisView.scopeNode && thisView.scopeNode.id === d.id) {
          thisView.nullScopeNode();
          thisView.centerForNode(d).each("end", function () {
            thisView.optimizeGraphPlacement(true, false, d.id);
          });
          return false;
        } else {
          thisView.setScopeNode(d);
        }

        // change node
        thisView.appRouter.changeUrlParams({focus: d.id});

        // contract the graph from the deps and ols
        var edgeShowList = [],
            nodeShowList = [d.id];

        var showOLs = d.get("outlinks").filter(function(ol){
          return thisView.isEdgeVisible(ol);
        });
        showOLs.forEach(function(ol){
          nodeShowList.push(ol.get("target").id);
        });
        edgeShowList = edgeShowList.concat(showOLs.map(function(ol){return ol.id;}));
        var showDeps = d.get("dependencies")
              .filter(function(dep){
                return thisView.isEdgeVisible(dep);
              });
        showDeps.forEach(function(dep){
          nodeShowList.push(dep.get("source").id);
        });
        edgeShowList = edgeShowList.concat(showDeps.map(function(dep){return dep.id;}));

        // contract edges
        var edges = thisView.model.getEdges();
        thisView.model.getEdges()
          .each(function (edge) {
            edge.set("isContracted", edgeShowList.indexOf(edge.id) === -1);
          });
        // contract nodes
        var nodes = thisView.model.getNodes();
        nodes
          .forEach(function (node) {
            node.set("isContracted", nodeShowList.indexOf(node.id) === -1);
          });

        // update data for the info box (# of hidden nodes/edges)
        thisView.numHiddenNodes = nodes.length - nodeShowList.length;
        thisView.numHiddenEdges = edges.length - edgeShowList.length;

        // transition the g so the node is centered
        thisView.centerForNode(d).each("end", function () {
          thisView.optimizeGraphPlacement(true, false, d.id, true);
        });
        return true;
      },

      /**
       * Add visual mouse over properties to the explore nodes
       */
      circleMouseOver: function(d, nodeEl) {
        var thisView = this,
            consts = pvt.consts,
            hoveredClass = consts.hoveredClass,
            d3node = d3.select(nodeEl);

        if (d3node.classed(hoveredClass)){
          d3node.classed(hoveredClass, true);
          return false;
        }

        var nodeId = nodeEl.id;

        // add the appropriate class
        d3node.classed(hoveredClass, true);

        // show/emphasize connecting edges
        // TODO move object refs outside of loop FIXME
        d.get("outlinks").each(function (ol) {
          d3.select("#" + consts.edgeGIdPrefix + ol.id)
            .classed(consts.linkWrapHoverClass, true)
            .classed(consts.depLinkWrapHoverClass, true);
          if (thisView.isEdgeVisible(ol)){
            d3.select("#" + consts.circleGIdPrefix + ol.get("target").id)
              .select("circle")
              .classed(consts.olCircleClass, true);
          }
        });
        d.get("dependencies").each(function (dep) {
          d3.select("#" + consts.edgeGIdPrefix + dep.id)
            .classed(consts.linkWrapHoverClass, true);
          if (thisView.isEdgeVisible(dep)){
            d3.select("#" + consts.circleGIdPrefix + dep.get("source").id)
              .select("circle")
              .classed(consts.depCircleClass, true);
          }
        });

        // TODO find a different way to present summaries on mouse over (e.g. with a button click)
        // // add node summary if not already present
        // if (pvt.summaryTOKillList.hasOwnProperty(nodeId)){
        //   window.clearInterval(pvt.summaryTOKillList[nodeId]);
        //   delete pvt.summaryTOKillList[nodeId];
        // }
        // thisView.attachNodeSummary(d, d3node);

        // add node-hoverables if not already present
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
       * Remove mouse over properties from the explore nodes
       */
      circleMouseOut:  function(d, nodeEl) {
        var relTarget = d3.event.relatedTarget;

        // check if we're in a semantically related el
        if (!relTarget || $.contains(nodeEl, relTarget) || (relTarget.id && relTarget.id.match(nodeEl.id))){
          return;
        }

        var thisView = this,
            d3node = d3.select(nodeEl),
            summId = pvt.getSummaryIdForDivWrap.call(thisView, d3node),
            consts = pvt.consts,
            hoveredClass = consts.hoveredClass,
            nodeId = nodeEl.id;

        d3node.classed(hoveredClass, false); // FIXME align class options once summary display is figured out
        // show/emphasize connecting edges
        d.get("outlinks").each(function (ol) {
          d3.select("#" + consts.edgeGIdPrefix + ol.id)
            .classed(consts.linkWrapHoverClass, false)
            .classed(consts.depLinkWrapHoverClass, false);
          d3.select("#" + consts.circleGIdPrefix + ol.get("target").id)
            .select("circle")
            .classed(consts.olCircleClass, false);

        });
        d.get("dependencies").each(function (dep) {
          d3.select("#" + consts.edgeGIdPrefix + dep.id)
            .classed(consts.linkWrapHoverClass, false);
          d3.select("#" + consts.circleGIdPrefix + dep.get("source").id)
            .select("circle")
            .classed(consts.depCircleClass, false);

        });

        if(pvt.summaryTOStartList.hasOwnProperty(nodeId)){
          window.clearInterval(pvt.summaryTOStartList[nodeId]);
          delete pvt.summaryTOStartList[nodeId];
          d3node.classed(hoveredClass, false);
        }
        else{
          // wait a bit before removing the summary
          pvt.summaryTOKillList[nodeId] = window.setTimeout(function(){
            delete pvt.summaryTOKillList[nodeId];
            if (pvt.summaryDisplays[summId] && !pvt.summaryDisplays[summId].$wrapDiv.hasClass(hoveredClass)){
              d3.select("#" + summId).remove(); // use d3 remove for x-browser support
              delete pvt.summaryDisplays[summId];
              d3node.classed(hoveredClass, false);
            }
          }, consts.summaryHideDelay);
        }
      },

      /**
       * Helper function to attach the summary div and add an event listener  leaving the summary
       */
      attachNodeSummary: function(d, d3node){
        // display the node summary
        var $wrapDiv = this.showNodeSummary(d, d3node);
        var hoveredClass = pvt.consts.hoveredClass;

        $wrapDiv.on("mouseenter", function(){
          $(this).addClass(hoveredClass);
        });
        // add listener to node summary so mouseouts trigger mouseout on node
        $wrapDiv.on("mouseleave", function(evt) {
          $(this).removeClass(hoveredClass);
          Utils.simulate(d3node.node(), "mouseout", {
            relatedTarget: evt.relatedTarget
          });
        });
      },

      /**
       * @Override
       * called after all animations
       */
      postRenderEdge: function (d, d3El) {
        var consts = pvt.consts;
        d3El.select("." + consts.wispGClass).remove();
        d3El.select("." + consts.longEdgeClass).classed(consts.longEdgeClass, false);
        var thisView = this;
        if (thisView.doClipEdge(d) && !thisView.scopeNode) {
          pvt.handleLongPaths(d, d3El);
        }
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
       * setup the appropriate event listers -- this should probably be called on initial render?
       */
      firstRender: function(){
        // build initial graph based on input collection
        var thisView = this,
            consts = pvt.consts,
            nodes = thisView.model.getNodes(),
            aux = window.agfkGlobals.auxModel,
            gConsts = aux.getConsts(),
            thisModel = thisView.model;

        // listen for mouse events on svg
        thisView.d3Svg.on("mouseup", function(){
          thisView.svgMouseUp.apply(thisView, arguments);
        });

        thisView.dzoom = d3.behavior.zoom();
        var dzoom = thisView.dzoom;
        // make graph zoomable/translatable
        var vis = thisView.d3Svg
              .attr("pointer-events", "all")
              .attr("viewBox", null)
              .call(dzoom.on("zoom", redraw))
              .select("g");

        // set the zoom scale
        dzoom.scaleExtent([consts.minZoomScale, consts.maxZoomScale]);
        var summaryDisplays = pvt.summaryDisplays,
            nodeLoc,
            d3event,
            currentScale;

        // helper function to redraw svg graph with correct coordinates
        function redraw() {
          // transform the graph
          thisView.state.justDragged = true;
          d3event = d3.event;
          currentScale = d3event.scale;
          thisView.prevScale = currentScale;
          vis.attr("transform", "translate(" + d3event.translate + ")" + " scale(" + currentScale + ")");
          // move the summary divs if needed
          $.each(summaryDisplays, function(key, val){
            nodeLoc = pvt.getSummaryBoxPlacement(val.d3circle.node().getBoundingClientRect(), val.placeLeft);
            val.$wrapDiv.css(nodeLoc);
          });
        }

        thisView.optimizeGraphPlacement(false, false, thisView.model.get("root"));
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
        pvt.summaryTOStartList[circleId] = window.setTimeout(function(){
          delete pvt.summaryTOStartList[circleId];
          $wrapDiv.appendTo("#" + consts.viewId).fadeIn(consts.summaryFadeInTime);
        }, consts.summaryAppearDelay);

        pvt.summaryDisplays[wrapDiv.id] = {"$wrapDiv": $wrapDiv, "d3circle": circle, "placeLeft": placeLeft};
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
        pvt.attachIconToNode.call(this, d3node, d, window.agfkGlobals.auxModel.toggleStarredStatus, appendObj, xOff, yOff, consts.starGScale, consts.starClass);
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
          && ( !node.isLearnedOrImplicitLearned() ||  thisView.model.get("options").get("showLearnedConcepts")); // FIXME change this logic after removing options model
      },

      /**
       * @Override
       * @param edge
       * @param <boolean> useTrans: take into account transitivity? {default: true}
       * @return <boolean> true if the edge path is visible
       */
      isEdgeVisible: function(edge, useVisTrans){
        var thisView = this;
        useVisTrans = useVisTrans === undefined ? true : useVisTrans;
        return (!useVisTrans || !thisView.isEdgeVisiblyTransitive(edge))
          && !edge.get("isContracted")
          && (thisView.isNodeVisible(edge.get("source")) && thisView.isNodeVisible(edge.get("target")));

      },

      /**
       * @Override
       * include the given edge in the optimization placement?
       */
      includeEdgeInOpt: function (edge) {
        return !edge.get("isContracted") && !edge.get("isTransitive");
      },

      /**
       * Determines if the edge should be clipped
       *
       */
      doClipEdge: function(edge) {
        var thisView = this;
        return !(thisView.isEdgeShortestOutlink(edge) || thisView.isEdgeLengthBelowThresh(edge));
      },

      /**
       * Determines if an edge is transitive given that other edges may be hidden
       */
      isEdgeVisiblyTransitive: function (edge) {
        var thisView = this;
        return edge.get("isTransitive")
          && thisView.model.checkIfTransitive(edge, pvt.getEdgeVisibleNoTransFun.call(thisView));
      },

      /**
       * Detect if the given edge is shorter than the threshold specified in pvt.consts
       * TODO use getTotalLength on svg path
       */
      isEdgeLengthBelowThresh: function (edge) {
        var src = edge.get("source"),
            tar = edge.get("target");
        return Math.sqrt(Math.pow(src.get("x") - tar.get("x"), 2)  + Math.pow(src.get("y") - tar.get("y"), 2)) <= pvt.consts.edgeLenThresh;
      },

      /**
       * Detect if the given edge is the shortest outlink from the source node
       */
      isEdgeShortestOutlink: function (edge) {
        var thisView = this,
            source = edge.get("source"),
            srcX = source.get("x"),
            srcY = source.get("y"),
            curMinSqDist = Number.MAX_VALUE,
            distSq,
            tar,
            minId;
        source.get("outlinks").each(function (ol) {
          tar = ol.get("target"),
          distSq = Math.pow(tar.get("x") - srcX, 2) + Math.pow(tar.get("y") - srcY, 2);
          if (distSq <= curMinSqDist && !thisView.isEdgeVisiblyTransitive(ol)){
            minId = tar.id;
            curMinSqDist = distSq;
          }
        });
        return minId === edge.get("target").id;
      },

      handleShowAllClick: function (evt) {
        var thisView = this;
        Utils.simulate(document.getElementById(thisView.getCircleGId(thisView.focusNode)), "mouseup");
      },

      setFocusNode: function (d) {
        var thisView = this;
        pvt.changeNodeClasses.call(thisView, thisView.focusNode, d, pvt.consts.focusCircleGClass);
        thisView.focusNode = d;
      },

      /**
       * Set the scope node
       */
      setScopeNode: function (d) {
        var thisView = this;
        pvt.changeNodeClasses.call(thisView, thisView.scopeNode, d, pvt.consts.scopeCircleGClass);
        thisView.scopeNode = d;
        // delay info box so that animations finish
        window.setTimeout(function () {
          thisView.$el.addClass(pvt.consts.scopeClass);
        }, 800);
      },

      /**
       * Remove the current scope node
       */
      nullScopeNode: function (d) {
        var thisView = this;
        pvt.changeNodeClasses.call(thisView, thisView.scopeNode, null, pvt.consts.scopeCircleGClass);
        thisView.scopeNode = null;
        thisView.$el.removeClass(pvt.consts.scopeClass);
      }
    }); // end Backbone.View.extend({
  })();

});
