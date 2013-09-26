/**
 * This file contains the explore view
 */

// Global TODOS
// carefully refactor variables to distinguish nodes from tags
// -fully separate graph generation logic from view

define(["backbone", "d3", "jquery", "underscore", "agfk/utils/utils", "agfk/utils/errors"], function(Backbone, d3, $, _, Utils, ErrorHandler){
  "use strict";

  /*
   * View for knowledge map in exploration mode
   */
  var ExploreView = (function(){

    /**
     * Private methods and variables
     */
    var pvt = {};
    pvt.viewConsts = {
      // ----- class and id names ----- //
      viewId: "explore-view", // id of view element (div by default) must change in CSS as well
      // WARNING some changes must be propagated to the css file 
      graphClass: "graph", // WARNING currently determined by graph generation -- chaning this property will not change the class TODO fix
      nodeClass: "node", // WARNING currently determined by graph generation -- chaning this property will not change the class TODO fix
      edgeClass: "edge", // WARNING currently determined by graph generation -- chaning this property will not change the class TODO fix
      exploreSvgId: "explore-svg",
      hoveredClass: "hovered",
      useExpandClass: "use-expand",
      nodeLearnedClass: "node-learned",
      nodeImplicitLearnedClass: "implicit-learned",
      dataHoveredProp: "data-hovered",
      elIconClass: "e-to-l-icon",
      elIconNodeIdSuffix: "-el-icon",
      starClass: "node-star",
      starredClass: "node-starred",
      starHoveredClass: "node-star-hovered",
      checkClass: "checkmark",
      checkHoveredClass: "checkmark-hovered",
      checkNodeIdSuffix: "-check-g",
      starNodeIdSuffix: "-star-g",
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
      hoverTextButtonsId: "hovertext-buttons",
      NO_SUMMARY_MSG: "-- Sorry, this concept is under construction and currently does not have a summary. --", // message to display in explore view when no summary is present
      renderEvt: "viewRendered",
      // ----- rendering options ----- //
      defaultScale: 0.54,
      defaultGraphDepth: 200, // default depth of graph
      defaultExpandDepth: 1, // default number of dependencies to show on expand
      defaultGraphOrient: "BT", // orientation of graph ("BT", "TB", "LR", or "RL")
      defaultNodeSepDist: 1.7, // separation of graph nodes
      defaultNodeWidth: 2.7, // diameter of graph nodes
      numCharLineDisplayNode: 14, // max number of characters to display per title line of graph nodes
      summaryWidth: 350, // px width of summary node (TODO can we move this to css and obtain the width after setting the class?)
      summaryArrowWidth: 32, // summary triangle width
      summaryArrowTop: 28, // top distance to triangle apex 
      summaryAppearDelay: 250, // delay before summary appears (makes smoother navigation)
      summaryHideDelay: 100,
      summaryFadeInTime: 50, // summary fade in time (ms)
      SQRT2DIV2: Math.sqrt(2)/2,
      maxZoomScale: 5, // maximum zoom-in level for graph
      minZoomScale: 0.05, //maximum zoom-out level for graph
      elIconScale: 1,
      elIconHeight: 29,
      elIconWidth: 29,
      elIconXOffset: -54,
      elIconYOffset: -16,
      starPts: "350,75 379,161 469,161 397,215 423,301 350,250 277,301 303,215 231,161 321,161", // svg star path
      starXOffset: -3,
      starYOffset: -20,
      starGScale: 0.11, // relative size of "completed" star group
      checkCircleR: 16, // radius of circle around "completed" check
      checkXOffset: -2, // px offset of checkmark from longest text element
      checkPath: "M -12,4 L -5,10 L 13,-6", // svg path to create check mark
      checkGScale: 0.79, // relative size of "completed" check group
      nodeIconsConstYOffset: 28, // constant y offset for the node icons
      nodeIconsPerYOffset: 9 // y offset for each text element for the node icons
    };
    pvt.summaryDisplays = {};
    pvt.summaryTOKillList = {};
    pvt.summaryTOStartList = {};
    pvt.isRendered = false;

    pvt.$hoverTxtButtonEl = $("#" + pvt.viewConsts.hoverTextButtonsId);

    /**
     * Get summary box placement (top left) given node placement
     */
    pvt.getSummaryBoxPlacement = function(nodeRect, placeLeft){
      var viewConsts = pvt.viewConsts,
          leftMultSign = placeLeft ? -1: 1,
          shiftDiff = (1 + leftMultSign*viewConsts.SQRT2DIV2)*nodeRect.width/2 + leftMultSign*viewConsts.summaryArrowWidth;
      if (placeLeft){shiftDiff -= viewConsts.summaryWidth;}
      return {
        top:  (nodeRect.top + (1-viewConsts.SQRT2DIV2)*nodeRect.height/2 - viewConsts.summaryArrowTop) + "px",
        left:  (nodeRect.left + shiftDiff) + "px"
      };
    };

    /**
     * Preprocess the given d3 selection of nodes and edge from graphviz output
     * (1) set all ids to the titles and remove the title
     */
    pvt.preprocessNodesEdges = function(d3Sel){
      d3Sel.attr('id', function(){
        return d3.select(this).select('title').text().replace(/->/g, "TO"); // TODO remove all undesired characters from ID (chars that cause css problems like '>')
      });
      d3Sel.selectAll("title").remove(); // remove the title for a cleaner hovering experience
      return true;
    };
    
    /**
     * Helper function to attach the summary div and add an event listener for leaving the summary
     */
    pvt.attachNodeSummary = function(d3node){
      // display the node summary
      var $wrapDiv = this.showNodeSummary(d3node);
      var hoveredClass = pvt.viewConsts.hoveredClass;

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
    };

    /**
     * Adds the explore-to-learn node icons
     */
    pvt.addEToLIcon = function(d3node, svgSpatialInfo){
      var thisView = this,
          viewConsts = pvt.viewConsts;
          svgSpatialInfo = svgSpatialInfo || Utils.getSpatialNodeInfo(d3node.node());
      
      var iconG = d3node.append("svg:image")
                  .attr("xlink:href", window.STATIC_PATH + "images/list-icon.png") // TODO move hardcoding
                  .attr("class", viewConsts.elIconClass)
                  .attr("id", pvt.getELIconIdForNode.call(thisView, d3node))
                  .attr("height", viewConsts.elIconHeight + "px")
                  .attr("width", viewConsts.elIconWidth + "px")
                  .attr(viewConsts.dataConceptTagProp, d3node.attr("id"));

      var numEls = d3node.selectAll("text")[0].length,
          elIconX = svgSpatialInfo.cx + viewConsts.elIconXOffset,
          elIconY = svgSpatialInfo.cy + viewConsts.nodeIconsConstYOffset + (numEls-1)*viewConsts.nodeIconsPerYOffset + viewConsts.elIconYOffset; // TODO move hardcoding
      iconG.attr("transform", 
                "translate(" + elIconX + "," + elIconY + ") "
                + "scale(" + viewConsts.elIconScale + ")");      
      
    };
    
    /**
     * Add bookmark star and associated properties to the given node
     * TODO refactor with addCheckMark
     */
    pvt.addStar = function(d3node, svgSpatialInfo){
      var thisView = this,
          viewConsts = pvt.viewConsts,
          nodeId = d3node.attr("id"),
          mnode = thisView.model.get("nodes").get(nodeId),
          starHoveredClass = viewConsts.starHoveredClass;
      svgSpatialInfo = svgSpatialInfo || Utils.getSpatialNodeInfo(d3node.node());
      
      var starG = d3node.append("g")
                  .attr("class", viewConsts.starClass)
                  .attr("id", pvt.getStarIdForNode.call(thisView, d3node))
                  .on("click", function(){
                    // stop event from firing on the ellipse
                    d3.event.stopPropagation();
                    // change the starred status of the node model
                    mnode.setStarredStatus(!d3node.classed(viewConsts.starredClass));
                  })
                  .on("mouseover", function() {
                    d3.select(this).classed(starHoveredClass, true);
                  })
                  .on("mouseout", function() {
                    d3.select(this).classed(starHoveredClass, false);
                  });
      starG.append("polygon")
      .attr("points", viewConsts.starPts);

      var numEls = d3node.selectAll("text")[0].length,
          starX = svgSpatialInfo.cx + viewConsts.starXOffset,
          starY = svgSpatialInfo.cy + viewConsts.nodeIconsConstYOffset + (numEls-1)*viewConsts.nodeIconsPerYOffset + viewConsts.starYOffset; // TODO move hardcoding
      starG.attr("transform", 
                "translate(" + starX + "," + starY + ") "
                + "scale(" + viewConsts.starGScale + ")");      
    };
    
    /**
     * Add the check mark and associated properties to the given node
     * TODO refactor with addStar
     */
    pvt.addCheckMark = function(d3node, svgSpatialInfo){
      var viewConsts = pvt.viewConsts,
          thisView = this,
          nodeId = d3node.attr("id"),
          mnode = thisView.model.get("nodes").get(nodeId),
          checkHoveredClass = viewConsts.checkHoveredClass,
          nodeLearnedClass = viewConsts.nodeLearnedClass;
      svgSpatialInfo = svgSpatialInfo || Utils.getSpatialNodeInfo(d3node.node());

      var chkG = d3node.append("g")
            .attr("class", viewConsts.checkClass)
            .attr("id", pvt.getCheckIdForNode.call(thisView, d3node))
            .on("click", function() {
              // stop the event from firing on the ellipse
              d3.event.stopPropagation();
              // change the learned status on the node model
              mnode.setLearnedStatus(!d3node.classed(nodeLearnedClass));
            })
            .on("mouseover", function() {
              d3.select(this).classed(checkHoveredClass, true);
            })
            .on("mouseout", function() {
              d3.select(this).classed(checkHoveredClass, false);
            });
      chkG.append("circle")
        .attr("r", viewConsts.checkCircleR);
      chkG.append("path")
        .attr("d", viewConsts.checkPath);
      
      var numEls = d3node.selectAll("text")[0].length,
          chkX = svgSpatialInfo.cx + viewConsts.checkXOffset,
          chkY = svgSpatialInfo.cy + viewConsts.nodeIconsConstYOffset + (numEls-1)*viewConsts.nodeIconsPerYOffset; // TODO move hardcoding
      chkG.attr("transform", 
                "translate(" + chkX + "," + chkY + ") "
                + "scale(" + viewConsts.checkGScale + ")");      
    };
    
    /**
     * Add visual mouse over properties to the explore nodes
     */
    pvt.nodeMouseOver = function(nodeEl) {
      var thisView = this,
          viewConsts = pvt.viewConsts,
          hoveredClass = viewConsts.hoveredClass,
          d3node = d3.select(nodeEl);

      if (d3node.classed(hoveredClass)){
        d3node.classed(hoveredClass, true);
        return false;
      }

      var nodeId = nodeEl.id;
      
      // add the appropriate class
      d3node.classed(hoveredClass, true);

      // add node summary if not already present
      if (pvt.summaryTOKillList.hasOwnProperty(nodeId)){
        window.clearInterval(pvt.summaryTOKillList[nodeId]);
        delete pvt.summaryTOKillList[nodeId];
      }
      pvt.attachNodeSummary.call(thisView, d3node);

      var nodeSpatialInfo = null;
      // add node-hoverables if not already present
      if (!d3node.attr(viewConsts.dataHoveredProp)) {
        // add checkmark if not present
        nodeSpatialInfo = nodeSpatialInfo || Utils.getSpatialNodeInfo(nodeEl);
        if (d3node.select("." + viewConsts.checkClass).node() === null){
          pvt.addCheckMark.call(thisView, d3node, nodeSpatialInfo);
        }
        // add node star if not already present
        if (d3node.select("." + viewConsts.starClass).node() === null){
          nodeSpatialInfo = nodeSpatialInfo || Utils.getSpatialNodeInfo(nodeEl);
          pvt.addStar.call(thisView, d3node, nodeSpatialInfo);
        }

        // add e-to-l button if not already present
        if (d3node.select("." + viewConsts.elIconClass).node() === null){
          nodeSpatialInfo = nodeSpatialInfo || Utils.getSpatialNodeInfo(nodeEl);
          pvt.addEToLIcon.call(thisView, d3node, nodeSpatialInfo);
        }
        d3node.attr(viewConsts.dataHoveredProp, true);
      }
      return 0;
    };

    /**
     * Remove mouse over properties from the explore nodes
     */
    pvt.nodeMouseOut = function(nodeEl) {
      var relTarget = d3.event.relatedTarget;
      
      // check if we're in a semantically related el
      if (!relTarget || $.contains(nodeEl, relTarget) || (relTarget.id && relTarget.id.match(nodeEl.id))){
        return;
      }

      var thisView = this,
          d3node = d3.select(nodeEl),
          summId = pvt.getSummaryIdForDivWrap.call(thisView, d3node),
          viewConsts = pvt.viewConsts,
          hoveredClass = viewConsts.hoveredClass,
          nodeId = nodeEl.id;

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
        }, viewConsts.summaryHideDelay);
      }
    };

     
    /**
     * Return a dot string array from the specified keyNode 
     * depth: desired depth of dot string
     * keyNode: root keynode, defaults to graph keynode (if exists, otherwise throws an error)
     * checkVisible: true will only add nodes that are not already visible, defaults to false
     */
    pvt.getDSFromKeyArr = function(depth, keyNode, checkVisible, showLearned) {
      var dgArr = [],
          thisView = this,
          thisModel = thisView.model,
          thisNodes = thisModel.get("nodes"),
          curEndNodes = [keyNode], // this should generalize easily to multiple end nodes
          curNode;
      
      _.each(curEndNodes, function(node) {
        curNode = thisNodes.get(node.get("id"));
        if ((showLearned || !curNode.isLearnedOrImplicitLearned() ) && (!checkVisible || curNode.getVisibleStatus())){
          dgArr.unshift(pvt.fullGraphVizStr.call(thisView, node));
        }
      });

      // This is essentially adding nodes via a breadth-first search to the desired dependency depth
      // for each dependency depth level...
      var addedNodes = {},
          curDep,
          cenLen,
          node,
          depNode;
      for (curDep = 0; curDep < depth; curDep++) {
        // obtain number of nodes at given depth
        cenLen = curEndNodes.length;
        // iterate over the nodes
        while (cenLen--) {
          // grab a specific node at that depth
          node = curEndNodes.shift();
          // for each unqiue dependency for the specific node...
          _.each(node.getUniqueDependencies(), function(depNodeId) {
            // grab the dependency node
            depNode = thisNodes.get(depNodeId);

            if ((showLearned || !depNode.isLearnedOrImplicitLearned() ) && (!checkVisible || depNode.getVisibleStatus())){
              // add node strings to the front of the dgArr
              dgArr.unshift(pvt.fullGraphVizStr.call(thisView, depNode));
              // add edge string to the end
              dgArr.push(node.get("dependencies").get(depNodeId + node.get("id")).getDotStr());
              // then add dependency to the end of curEndNodes if it has not been previously added
              if (!addedNodes.hasOwnProperty(depNodeId)) {
                curEndNodes.push(depNode);
                addedNodes[depNodeId] = true;
              }
            }
          });
        }
      }
      return dgArr;
    };

    /**
     * Return full string representation of a node for graphviz
     */
    pvt.fullGraphVizStr = function(node, options) {
      var optionStr = "";
      if (options) {
        for (var opt in options) {
          if (options.hasOwnProperty(opt)) {
            optionStr += "," + opt + "=" + options[opt];
          }
        }
      }
      if (node.get("is_shortcut")) {
        optionStr += ",style=dashed";
      }
      return node.get("id") + ' [label="' + node.getNodeDisplayTitle(pvt.viewConsts.numCharLineDisplayNode) + '"' + optionStr + '];';
    };

    /**
     * Helper function to obtain checkmark element for the given node
     */
    pvt.getCheckIdForNode = function(node) {
      return pvt.getIdOfNodeType.call(this, node) + pvt.viewConsts.checkNodeIdSuffix;
    };

    /**
     * Helper function to obtain el-icon element for the given node
     */
    pvt.getELIconIdForNode = function(node) {
      return pvt.getIdOfNodeType.call(this, node) + pvt.viewConsts.elIconNodeIdSuffix;
    };

    /**
     * Helper function to obtain checkmark element for the given node
     */
    pvt.getStarIdForNode = function(node) {
      return pvt.getIdOfNodeType.call(this, node) + pvt.viewConsts.starNodeIdSuffix;
    };

    /**
     * Helper function to obtain id of summary txt div for a given node in the exporation view
     */
    pvt.getSummaryIdForDivTxt = function(node) {
      return pvt.getIdOfNodeType.call(this, node) + pvt.viewConsts.summaryDivSuffix;
    };

    /**
     * Helper function to obtain id of wrapper div of summary txt for a given node in the exporation view
     */
    pvt.getSummaryIdForDivWrap = function(node) {
      return pvt.getIdOfNodeType.call(this, node) + pvt.viewConsts.summaryWrapDivSuffix;
    };

    /**
     * Get id of node element (d3, dom, or model)
     */
    pvt.getIdOfNodeType = function(node) {
      var nodeFun = node.attr || node.getAttribute || node.get;
      return nodeFun.call(node, "id");
    };

    /**
     * return public object
     */
    return Backbone.View.extend({
      // id of view element (div unless tagName is specified)
      id: pvt.viewConsts.viewId,

      // most events are handled via d3; this is awkward for backbone, but jQuery isn't as reliable/east for SVG events
      // TODO try to be consistent with event handling
      events: {
        "click .e-to-l-icon": "handleEToLConceptClick"
      },

      // hack to call appRouter from view (must pass in approuter)
      appRouter: null,
      
      /**
       * Obtain initial kmap coordinates and render results
       */
      initialize: function(inp) {
        // build initial graph based on input collection
        var thisView = this,
            d3this = thisView.getd3El(),
            nodes = thisView.model.get("nodes");

        this.appRouter = inp.appRouter;
        
        // TODO this initialization won't work when expanding graphs
        
        // dim nodes that are [implicitly] learned
        thisView.listenTo(nodes, "change:learnStatus", function(nodeId, status){
          var d3El = d3this.select("#" + nodeId);
          if (d3El.node() !== null){
            thisView.toggleNodeProps(d3El, status, "learned", d3this);
          }
        });
        thisView.listenTo(nodes, "change:implicitLearnStatus", function(nodeId, status){
          var d3El = d3this.select("#" + nodeId);
          if (d3El.node() !== null){
            thisView.toggleNodeProps(d3El, status, "implicitLearned", d3this);
          }
        });
        thisView.listenTo(nodes, "change:starStatus", function(nodeId, status){
          var d3El = d3this.select("#" + nodeId);
          if (d3El.node() !== null){
            thisView.toggleNodeProps(d3El, status, "starred", d3this);
          }
        });
        
        // rerender graph (for now) when clearing learned nodes
        // TODO do we need to clean up this view to avoid zombies?
        thisView.listenTo(thisView.model.get("options"), "change:showLearnedConcepts", thisView.render);
        
      },
      
      /** 
       * Initial rendering for view (necessary because of particular d3 use case)
       */
      initialRender: function() {
        // unambiguous thisView reference
        var  thisView = this,
            // performace: grab object constants that are used multiple times
            viewConsts = pvt.viewConsts,
            nodeClass = viewConsts.nodeClass,
            edgeClass  = viewConsts.edgeClass,
            exploreSvgId = viewConsts.exploreSvgId,
            exPlusWidth = viewConsts.exPlusWidth,
            graphClass = viewConsts.graphClass,
            // other needed vars
            d3this = thisView.getd3El(),
            gelems = d3this.selectAll("." + nodeClass + ", ." + edgeClass);


        // remove unneeded background polygon from graphviz TODO make sure this is the correct polygon
        d3this.select("polygon").remove();

        // sort the svg such that the edges come before the nodes so mouseover on node doesn't activate edge
        var gdata = gelems[0].map(function(itm) {
          return d3.select(itm).classed(nodeClass);
        });
        // return if graph is empty (e.g. clear nodes after all nodes were learned)
        if (gdata.length === 0){
          return false;
        }
        gelems.data(gdata).sort();
        // change id to title, remove title, then
        pvt.preprocessNodesEdges(gelems);
        d3this.select('g').selectAll("title").remove(); // also remove title from graph

        // make the svg canvas fill the entire enclosing element
        d3this.select('svg')
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('id', exploreSvgId);

        // add node properties
        thisView.addGraphProps(d3this);

        // -- post processing of initial SVG -- //

        // obtain orginal transformation since graphviz produces unnormalized coordinates
        var d3graph =  d3this.select("." + graphClass),
            scaleVal = thisView.prevScale ? (thisView.prevScale > 1 ? 1 : thisView.prevScale) : viewConsts.defaultScale;

        var keyNode = thisView.model.get("aux").get("depRoot"),
            newtrans = new Array(2);
        if (keyNode) {
          var keyNodeLoc = Utils.getSpatialNodeInfo(d3this.select("#" + keyNode).node()),
              swx = window.innerWidth/scaleVal,
              swy = window.innerHeight/scaleVal;
          // set x coordinate so key node is centered on screen
          newtrans[0] = (swx / 2 - keyNodeLoc.cx)*scaleVal;
          newtrans[1] = (keyNodeLoc.ry + 5 - keyNodeLoc.cy)*scaleVal;
          // maintain the scale of the previous graph (helps transitions feel more fluid)
          var scale = thisView.prevScale || 0.2;
          d3this.select("." + graphClass)
            .attr("transform", "translate(" + newtrans[0] + "," + newtrans[1] + ") scale(" + scaleVal + ")");

          // add original transformation to the zoom behavior
          var dzoom = d3.behavior.zoom();
          dzoom.translate(newtrans).scale(scaleVal);
        }

        // make graph zoomable/translatable
        var vis = d3this.select("svg")
              .attr("pointer-events", "all")
              .attr("viewBox", null)
              .call(dzoom.on("zoom", redraw))
              .select("." + graphClass);

        // set the zoom scale
        dzoom.scaleExtent([viewConsts.minZoomScale, viewConsts.maxZoomScale]);
        var summaryDisplays = pvt.summaryDisplays,
            nodeLoc,
            d3event,
            currentScale;
        // helper function to redraw svg graph with correct coordinates
        function redraw() {
          // transform the graph
          d3event = d3.event;
          currentScale = d3event.scale;
          thisView.prevScale = currentScale;
          vis.attr("transform", "translate(" + d3event.translate + ")" + " scale(" + currentScale + ")");
          // move the summary divs if needed
          $.each(summaryDisplays, function(key, val){
            nodeLoc = pvt.getSummaryBoxPlacement(val.d3node.node().getBoundingClientRect(), val.placeLeft);
            val.$wrapDiv.css(nodeLoc);
          });
        }
        return true;
      },

      /**
       * Use D3 to add dynamic properties to the graph
       */
      addGraphProps: function(d3selection) {
        var thisView = this,
            viewConsts = pvt.viewConsts,
            d3this = d3selection || this.getd3El(),
            d3Nodes = d3this.selectAll("." + viewConsts.nodeClass),
            thisNodes = thisView.model.get("nodes");
        
        // add nodes to observed list TODO move this somewhere else
        d3Nodes.each(function(){
          thisNodes.get(this.id).setVisibleStatus(true);
        });
        
        // class the learned nodes TODO consider using node models as d3 data
        d3Nodes.on("mouseover", function() {
          pvt.nodeMouseOver.call(thisView, this);
        })
          .on("mouseout", function() {
            pvt.nodeMouseOut.call(thisView, this);
          });

            // short helper function only needed below
            var addPropFunction = function(nid, prop){
              var d3node = d3this.select("#" + nid);
              
              if (d3node.node() !== null){
                thisView.toggleNodeProps(d3node, true, prop, d3this);
              } 
            };


        _.each(thisNodes.filter(function(nde){return nde.getLearnedStatus();}), function(mnode){
          addPropFunction(mnode.get("id"), "learned");
        });
        _.each(thisNodes.filter(function(nde){return nde.getImplicitLearnStatus();}), function(mnode){
          addPropFunction(mnode.get("id"), "implicitLearned");
        });
        _.each(thisNodes.filter(function(nde){return nde.getStarredStatus();}), function(mnode){
          addPropFunction(mnode.get("id"), "starred");
        });
      },
      
      /**
       * Toggle propType properties for the given explore node
       * d3node: d3 selection for the given node
       * toggleOn: whether to toggle on (true) or off (false) the learned properties
       * propType: specify the property type: "learned", "implicitLearned", "starred"
       * d3sel: d3selection with graph nodes/edges as children (defaults to thisView.getd3El()
       */
      toggleNodeProps: function(d3node, toggleOn, propType, d3Sel){
        var viewConsts = pvt.viewConsts,
            thisView = this,
            mnode = thisView.model.get("nodes").get(d3node.attr("id")),
            changeLearnStatus = propType === "learned" || propType === "implicitLearned";
        var propClass = {"learned": viewConsts.nodeLearnedClass,
                         "implicitLearned": viewConsts.nodeImplicitLearnedClass,
                         "starred": viewConsts.starredClass
                        }[propType];
        d3Sel = d3Sel || thisView.getd3El();
        
        if (changeLearnStatus){
          var hasCheck = d3node.select("." + viewConsts.checkClass).node() !== null;
          // insert checkmark if needed
          if (propType === "learned" && toggleOn && !hasCheck){
            pvt.addCheckMark.call(thisView, d3node);
          }
          // toggle appropriate class for outlinks
          thisView.changeEdgesClass(mnode.get("outlinks"), propClass, toggleOn, d3Sel);
        }
        else{
          var hasStar =  d3node.select("." + viewConsts.starClass).node() !== null;
          if (toggleOn && !hasStar){
            pvt.addStar.call(thisView, d3node);
          }
        }
        
        d3node.classed(propClass, toggleOn);
      },      
      
      /**
       * Change the class of the provided edge models
       * edgeCollections: a collection of DirectedEdge models
       * className: name of class to add/remove
       * addClass: true to add class, false to remove
       */
      changeEdgesClass: function(edgeCollections, className, addClass, d3Sel){
        var d3edge,
            edgeId;
        d3Sel = d3Sel || d3.select("." + pvt.viewConsts.graphClass);
        edgeCollections.each(function(edge){
          edgeId = edge.get("from_tag") + "TO" + edge.get("to_tag");
          d3edge = d3Sel.select("#" + edgeId);
          if (d3edge.node() !== null){
            d3edge.classed(className, addClass);
          }
        });
        return true;
      },
      
      /**
       * Renders the explore view using the supplied collection
       */
      render: function() {
        var thisView = this,
            dotStr = thisView.collToDot(),
            d3this = thisView.getd3El();
        thisView.$el.empty();
        pvt.isRendered = false; // do async rendering to accomodate big Viz.js file
        thisView.initialSvg = true;
        thisView.createSvgGV(dotStr);
        thisView.delegateEvents();

        return thisView;
      },

      /**
       * Create dot string from the model
       * depth: depth from keyNode (if present); pvt.viewConsts.defaultGraphDepth
       * graphOrient: orientation of graph ("BT", "TB", "LR", or "RL"); default pvt.viewConsts.defaultGraphOrient
       * nodeWidth: width of node
       * nodeSep: node separation
       */
      collToDot: function(args){ 
        var thisView = this,
            thisModel = thisView.model,
            viewConsts = pvt.viewConsts,
            showLearned = thisModel.get("options").get("showLearnedConcepts"),
            dgArr,
            args = args || {},
            depth = args.depth || viewConsts.defaultGraphDepth,
            graphOrient = args.graphOrient || viewConsts.defaultGraphOrient,
            nodeSep = args.nodeSep || viewConsts.defaultNodeSepDist,
            nodeWidth = args.nodeWidth || viewConsts.defaultNodeWidth,
            keyNode = args.keyNode || thisModel.get("nodes").get(thisModel.get("aux").get("depRoot")),
            remVisible = args.remVisible || false; // TODO describe these params

        dgArr = pvt.getDSFromKeyArr.call(this, depth, keyNode, remVisible, showLearned);
        // include digraph options
        dgArr.unshift("rankdir=" + graphOrient);
        dgArr.unshift("nodesep=" + nodeSep); 
        dgArr.unshift("node [shape=circle, fixedsize=true, width=" + nodeWidth + "];");

        return "digraph G{\n" + dgArr.join("\n") + "}";
      },

      /**
       * Handle explore-to-learn view event that focuses on the clicked concept
       */
      handleEToLConceptClick: function(evt){
        var imgEl = evt.currentTarget,
            conceptTag = imgEl.getAttribute(pvt.viewConsts.dataConceptTagProp);
        this.transferToLearnViewForConcept(conceptTag);
        // simulate mouseout for explore-view consistency
        Utils.simulate(imgEl.parentNode, "mouseout", {
          relatedTarget: document
        }); 
      },

      /**
       * Trigger transfer from explore view to learn view and focus on conceptTag
       */
      transferToLearnViewForConcept: function(conceptTag){
        this.appRouter.changeUrlParams({mode: "learn", lfocus: conceptTag});
      },
      
      /**
       * Show the node summary in "hover box" next to the node
       * TODO consider making this a view that monitors the nodes (i.e. event driven)
       */  
      showNodeSummary: function(node) {
        var thisView = this,
            viewConsts = pvt.viewConsts,
            // add content div
            div = document.createElement("div"),
            nodeId = node.attr("id"),
            summaryP = document.createElement("p"),
            summaryTxt;

        // add summary
        summaryTxt = this.model.get("nodes").get(nodeId).get("summary");
        summaryP.textContent = summaryTxt.length > 0 ? summaryTxt : viewConsts.NO_SUMMARY_MSG;
        
        div.appendChild(summaryP);
        div.id = pvt.getSummaryIdForDivTxt.call(thisView, node);
        var $div = $(div);
        $div.addClass(viewConsts.summaryTextClass);

        // add wrapper div so we can use "overflow" pseudo elements
        var wrapDiv = document.createElement("div"),
            d3wrapDiv = d3.select(wrapDiv);
        wrapDiv.id = pvt.getSummaryIdForDivWrap.call(thisView, node);
        d3wrapDiv.classed(viewConsts.summaryWrapClass, true);

        // place the summary box on the side with the most screen real-estate
        var nodeRect = node.node().getBoundingClientRect(),
            placeLeft = nodeRect.left + nodeRect.width / 2 > window.innerWidth / 2;
        d3wrapDiv.classed(placeLeft ? viewConsts.summaryRightClass : viewConsts.summaryLeftClass, true);
        wrapDiv.appendChild(div);

        // get/set location of box
        var sumLoc = pvt.getSummaryBoxPlacement(nodeRect, placeLeft);
        wrapDiv.style.left = sumLoc.left;
        wrapDiv.style.top = sumLoc.top;
        wrapDiv.style.width = viewConsts.summaryWidth + "px";
        wrapDiv.style.display = "none";

        // add box to document with slight fade-in
        var $wrapDiv = $(wrapDiv);
        pvt.summaryTOStartList[nodeId] = window.setTimeout(function(){
          delete pvt.summaryTOStartList[nodeId];
          $wrapDiv.appendTo("#" + viewConsts.viewId).fadeIn(viewConsts.summaryFadeInTime);
        }, viewConsts.summaryAppearDelay);

        // TODO listen for translated graphs and translate accordingly
        pvt.summaryDisplays[wrapDiv.id] = {"$wrapDiv": $wrapDiv, "d3node": node, "placeLeft": placeLeft};
        return $wrapDiv;
      },

      /**
       * Finish rendering the view after obtaining the svg output from graphviz
       */
      finishRender: function(dot){
        var thisView = this;
        thisView.$el.html(thisView.svgGraph);
        thisView.initialRender();
        // trigger an event for the listening router
        pvt.isRendered = true;
        thisView.$el.trigger(pvt.viewConsts.renderEvt); // todo: this feels hacky, better way?
      },
      
      /**
       * Return an SVG representation of graph given a dot string
       * this function uses relies on the asynchronous loading
       * of Viz within router.js
       */
      createSvgGV: function(dotStr) {
        var thisView = this;
        
        function vizStr(){
          thisView.svgGraph = window.Viz(dotStr, "svg");
          thisView.finishRender();
        }
        
        if (typeof window.Viz === "function"){
          vizStr();
        }
        else{
          ErrorHandler.assert(window.vizPromise !== undefined, "vizPromise was not initalized before createSvgGv");
          window.vizPromise.done(vizStr);
        }
      },

      /**
       * Return true if the view has been rendered
       */
      isRendered: function(){
        return pvt.isRendered;
      },
      
      /**
       * Close and unbind views to avoid memory leaks TODO make sure to unbind any listeners
       */
      close: function() {
        this.remove();
        this.unbind();
      },

      /**
       * get d3 selection of this.el
       */
      getd3El: function() {
        this.d3El = this.d3El || d3.select(this.el);
        return this.d3El;
      },

      /**
       * return the specified view constant
       */
      getViewConst: function(vc){
        return pvt.viewConsts[vc];
      }
    });
  })();

  // return for require.js 
  return ExploreView;
});
