/**
 * This base graph view expects the following from all subviews:
 * - copy pvt using getBasePvt method -- make sure to copy pvt.consts if you define your own consts, e.g. pvt.consts = _.extend(globalConsts, myconsts)
 * -el should be a container element that will render the svg
 *
 * NOTE: You should not (!) override the render or initialize method
 *        -- use prerender and postrender and handleNewPaths and handleNewCircles
 *           and preinitialize and postinitialize
 *
 * After first render (even in prerender on first render) the following elements are available
 * - this.d3Svg
 * - this.gPaths: block g element for the paths
 *    (paths when dealing with svg and edges when dealing with data model)
 *    where you can append a new g with this.gPaths.data(someData).append("g")
 * - this.gCircles: block g element for the circles
 *    (circles when dealing with svg and nodes when dealing with data model)
 *    where you can append a new g with this.gCircles.data(someData).append("g")
 *
 * Some general notes:
 * + d3 should handle all svg-related events, while backbone should handle all other events
 * + use handleNewPaths and handleNewCircles to attach listeners during calls to render
 */
 /*global define*/
define(["base/utils/utils", "backbone", "d3", "underscore", "dagre", "jquery"], function(Utils, Backbone, d3, _, dagre, $) {

  /**********************
   * private class vars *
   **********************/

  var pvt = {};

  pvt.consts = {
    exPlusWidth: 5, // expand plus sign width in pixels
    minusRectW: 11,
    minusRectH: 5.5,
    exPlusWidth: 5,
    nodeRadius: 50,
    graphClass: "graph",
    hoveredClass: "hovered",
    pathWrapClass: "link-wrapper",
    pathClass: "link",
    expandCrossClass: "exp-cross",
    contractMinusClass: "contract-minus",
    circleGClass: "concept-g",
    circleGIdPrefix: "circlgG-",
    edgeGIdPrefix: "edgeG-",
    depIconGClass: "dep-icon-g",
    olIconGClass: "ol-icon-g",
    doBTOpt: true,
    graphDirection: "TB" // BT TB LR RL TODO consider making an option for the user
  };

  pvt.consts.plusPts = "0,0 " +
    pvt.consts.exPlusWidth + ",0 " +
    pvt.consts.exPlusWidth + "," + pvt.consts.exPlusWidth + " " +
    (2 * pvt.consts.exPlusWidth) + "," + pvt.consts.exPlusWidth + " " +
    (2 * pvt.consts.exPlusWidth) + "," + (2 * pvt.consts.exPlusWidth) + " " +
    pvt.consts.exPlusWidth + "," + (2 * pvt.consts.exPlusWidth) + " " +
    pvt.consts.exPlusWidth + "," + (3 * pvt.consts.exPlusWidth) + " " +
    "0," + (3 * pvt.consts.exPlusWidth) + " " +
    "0," + (2 * pvt.consts.exPlusWidth) + " " +
    (-pvt.consts.exPlusWidth) + "," + (2 * pvt.consts.exPlusWidth) + " " +
    (-pvt.consts.exPlusWidth) + "," + pvt.consts.exPlusWidth + " " +
    "0," + pvt.consts.exPlusWidth + " " +
    "0,0";

  pvt.d3Line = d3.svg.line()
    .x(function(d) {return d.x === undefined ? d.get("x") : d.x;})
    .y(function(d) {return d.y === undefined ? d.get("y") : d.y;})
    .interpolate('bundle')
    .tension(0.85);

  /*******************
   * private methods *
   *******************/

  /**
   * First render renders the svg and sets up all of the listeners
   */
  pvt.firstRenderBase = function(){
    var thisView = this;

    var d3Svg = d3.select(thisView.el).append("svg:svg");
    thisView.d3Svg = d3Svg;

    var defs = d3Svg.append('svg:defs');
    defs.append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('markerWidth', 5.5)
      .attr('markerHeight', 5.5)
      .attr('refX', 8)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

    thisView.d3SvgG = thisView.d3Svg.append("g")
      .classed(pvt.consts.graphClass, true);

    var d3SvgG = thisView.d3SvgG;

    // svg nodes and edges
    thisView.gPaths = d3SvgG.append("g").selectAll("g");
    thisView.gCircles = d3SvgG.append("g").selectAll("g");

    // set initial position of root elements
    // var rootNode = thisView.model.getNode(thisView.model.get("root")), // TODO handle multiple roots
    //   // hack since svg width is not yet available
    //     useWidth = window.innerWidth - $("#concept-list-wrapper").outerWidth(true);
    // rootNode.set("x", useWidth/2);
    // rootNode.set("y", 150);
  };

  // from http://bl.ocks.org/mbostock/3916621
  pvt.pathTween = function (d1, precision) {
    return function() {
      var path0 = this,
          path1 = path0.cloneNode(),
          n0 = path0.getTotalLength(),
          n1 = (path1.setAttribute("d", d1), path1).getTotalLength();

      // Uniform sampling of distance based on specified precision.
      var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
      while ((i += dt) < 1) distances.push(i);
      distances.push(1);

      // Compute point-interpolators at each distance.
      var points = distances.map(function(t) {
        var p0 = path0.getPointAtLength(t * n0),
            p1 = path1.getPointAtLength(t * n1);
        return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
      });

      return function(t) {
        return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : d1;
      };
    };
  };

  pvt.addECIcon = function(d, d3el, isDeps){
    var thisView = this,
        consts = pvt.consts,
        iconGClass,
        hasExpOrContrName,
        expandFun,
        contractFun,
        placeAtBottom,
        d3Icon;

    if (isDeps) {
      iconGClass = consts.depIconGClass;
      hasExpOrContrName = "hasContractedDeps";
      expandFun = d.expandDeps;
      contractFun = d.contractDeps;
      placeAtBottom = true;
      d3Icon = d3el.selectAll("." + consts.depIconGClass);
    } else {
      iconGClass = consts.olIconGClass;
      hasExpOrContrName = "hasContractedOLs";
      expandFun = d.expandOLs;
      contractFun = d.contractOLs;
      placeAtBottom = false,
      d3Icon = d3el.selectAll("." + consts.olIconGClass);
    }

    if (d.get(hasExpOrContrName)
        && (!d3Icon.node() || !d3Icon.classed(consts.expandCrossClass))) {
      // place plus sign
      d3Icon.remove();
      d3Icon = d3el.append("g")
        .classed(iconGClass, true)
        .classed(consts.expandCrossClass, true);
      var yplace = placeAtBottom ? (consts.nodeRadius - consts.minusRectH*3 - 8) : (-consts.nodeRadius + consts.minusRectH*3 - 8);
      d3Icon.append("polygon")
        .attr("points", consts.plusPts)
        .attr("transform", "translate(" + (-consts.exPlusWidth/2) + ","
              + yplace + ")")
        .on("mouseup", function(){
          if (!thisView.state.justDragged) {
            thisView.state.expOrContrNode = true;
            expandFun.call(d);
            thisView.optimizeGraphPlacement(true, false, d.id);
          }
        });
    } else if (!d.get(hasExpOrContrName) && (!d3Icon.node() || !d3Icon.classed(consts.contractMinusClass))) {
      // place minus sign
      d3Icon.remove();
      d3Icon = d3el.append("g")
        .classed(iconGClass, true)
        .classed(consts.contractMinusClass, true);
      d3Icon.append("rect")
        .attr("x", -consts.minusRectW/2)
        .attr("y", placeAtBottom ? consts.nodeRadius - consts.minusRectH*3 : -consts.nodeRadius + consts.minusRectH*3)
        .attr("width", consts.minusRectW)
        .attr("height", consts.minusRectH)
        .on("mouseup", function(){
          if (!thisView.state.justDragged) {
            thisView.state.expOrContrNode = true;
            contractFun.call(d);
            //thisView.optimizeGraphPlacement(false, d.id);
            thisView.render();
          }
        });
    }
  };

  pvt.getEdgePath = function(d){
    var pathPts = [].concat(d.get("middlePts"));
    // TODO only compute if node position changed
    var srcPt = d.get("source"),
        targetPt = d.get("target"),
        //        secPt = pathPts.length ? pathPts[0] : targetPt,
        penUltPt = pathPts.length ? pathPts[pathPts.length - 1] : srcPt;
    //    var srcEndPt = pvt.computeEndPt(srcPt, secPt).source,
    var targetEndPt = pvt.computeEndPt(penUltPt, targetPt).target;
    pathPts.unshift(srcPt);
    pathPts.push(targetEndPt);
    return pvt.d3Line(pathPts);
  };

  // computes intersection points for two circular nodes (simple geometry)
  pvt.computeEndPt = function (src, tgt){
    var srcX = src.x === undefined ? src.get("x") : src.x,
        srcY =  src.y === undefined ? src.get("y") : src.y,
        tgtX = tgt.x === undefined ? tgt.get("x") : tgt.x,
        tgtY =  tgt.y === undefined ? tgt.get("y") : tgt.y,
        ratio = Math.pow((srcY - tgtY)/(srcX - tgtX), 2),
        r = pvt.consts.nodeRadius,
        offX = r/Math.sqrt(1 + ratio) * (srcX > tgtX ? -1 : 1),
        offY = r/Math.sqrt(1 + 1/ratio) * (srcY > tgtY ? -1 : 1);

    // keep source at origin since we don't have an end marker
    return {source: {x: srcX + offX, y: srcY + offY}, target: {x: tgtX - offX, y: tgtY - offY}};
  };


  return Backbone.View.extend({

    // hack to call appRouter from view (must pass in approuter)
    appRouter: null,

    /**
     * Initialize function
     * This function should not be overwritten in subclasses
     * Use preinitialize and postinitialize to perform the desired actions
     * TODO throw error if in subclass version (how?)
     */
    initialize: function(inp){
      var thisView = this;
      thisView.preinitialize();
      thisView.isFirstRender = true;
      thisView.isRendered = false;
      thisView.state = {
        doCircleTrans: false,
        doPathsTrans: false
      };

      thisView.listenTo(thisView.model, "render", thisView.render);

      d3.select("#optimize").on("click", function(){thisView.optimizeGraphPlacement.call(thisView, true);});


      if (inp !== undefined){
        thisView.appRouter = inp.appRouter;
      }
      thisView.postinitialize();
    },

    /**
     * Base render function
     * This function should not be overwritten in subclasses
     * Use `prerender` and `postrender` to perform actions before/after the basic graph rendering
     * TODO throw error if in subclass version (how?)
     */
    render: function() {
      var thisView = this,
          consts = pvt.consts;

      thisView.isRendered = false;

      if (thisView.isFirstRender) {
        pvt.firstRenderBase.call(thisView);
        thisView.firstRender.call(thisView);
        thisView.isFirstRender = false;
      }

      //***********
      // PRERENDER
      //***********
      thisView.prerender();
      //***********

      //*************
      // Render Paths
      //*************

      // set the paths to only contain visible paths FIXME do edges always have ids?
      thisView.gPaths = thisView.gPaths
        .data(thisView.model.get("edges")
        .filter(function(mdl){
          return thisView.isEdgeVisible(mdl);
        }), function(d){
          return d.id;
        });

      var gPaths = thisView.gPaths;

      if (thisView.state.doPathsTrans){ // TOMOVE do we want to use state?
        gPaths.each(function(d){
          var d3el = d3.select(this),
              edgePath = pvt.getEdgePath(d);
          d3el.selectAll("path") // ." + consts.pathClass)
            .transition()
            .duration(500)
            .attrTween("d", pvt.pathTween(edgePath, 4))
            .each("end", function (d) {
              thisView.postRenderEdge.call(thisView, d, d3.select(this.parentElement));
            });
        });
        thisView.state.doPathsTrans = false;
      }
      else{
        gPaths.each(function(d){
          // FIXME: remove code repetition with above conditional
          var d3el = d3.select(this),
              edgePath = pvt.getEdgePath(d);
          d3el.selectAll("path")
            .attr("d", edgePath)
            .each(function (d) {
              thisView.postRenderEdge.call(thisView, d, d3.select(this.parentNode));
            });
        });
      }

      // add new paths
      var newPathsG = gPaths.enter().append("g");
      newPathsG
        .attr("opacity", 0)
        .attr("id", function (d) { return  thisView.getPathGId(d); })
        .each(function(d){
          var d3el = d3.select(this),
              edgePath = pvt.getEdgePath(d);

          // append display path
          d3el.append("path")
            .style('marker-end','url(#end-arrow)')
            .classed(consts.pathClass, true)
            .attr("d", edgePath );
          // append onhover path
          d3el.append("path")
            .attr("d", edgePath )
            .classed(pvt.consts.pathWrapClass, true);
        });

      newPathsG.transition()
      .delay(300)
      .duration(1000)
      .attr("opacity", 1)
      .each("end", function (d) {
        // call post render function for edge
        thisView.postRenderEdge.call(thisView, d, d3.select(this));
      });


      // call subview function
      thisView.handleNewPaths(newPathsG);

      // remove old links
      gPaths.exit()
      .transition()
      .duration(500)
      .attr("opacity", 0)
      .remove(); // TODO add appropriate animation

      //***************
      // Render Circles
      //***************
      // update existing nodes
      thisView.gCircles = thisView.gCircles
        .data(thisView.model.getNodes().filter(function(mdl){return thisView.isNodeVisible(mdl);}),
              function(d){
                return d.id;
              });

      thisView.gCircles.exit()
        .transition()
        .duration(500)
        .attr("opacity", 0)
        .remove(); // TODO add appropriate animation

      if (thisView.state.doCircleTrans){
        thisView.gCircles
          .transition()
          .duration(500)
          .attr("transform", function(d){
            return "translate(" + d.get("x") + "," + d.get("y") + ")";
          })
          .each("end", function (d) {
            thisView.postRenderNode.call(thisView, d, d3.select(this));
          });
        thisView.state.doCircleTrans = false;
      }
      else {
        thisView.gCircles
          .attr("transform", function(d){
            return "translate(" + d.get("x") + "," + d.get("y") + ")";
          });
      }

      // add new nodes
      var newGs = thisView.gCircles
            .enter()
            .append("g")
            .attr("opacity", 0);

      newGs.classed(consts.circleGClass, true)
        .attr("id", function (d) { return thisView.getCircleGId(d); })
        .attr("transform", function(d){return "translate(" + d.get("x") + "," + d.get("y") + ")";})
        .append("circle")
        .attr("r", consts.nodeRadius);

      newGs.each(function(d){
        var d3this = d3.select(this);
        Utils.insertTitleLinebreaks(d3this, d.get("title"));
      });

      newGs.transition()
        .delay(200)
        .duration(800)
        .attr("opacity", 1)
        .each("end", function (d) {
          thisView.postRenderNode.call(thisView, d, d3.select(this));
        });


      thisView.handleNewCircles(newGs);

      // TODO FIXME -- don't always add expand/contract
      // // handle expand contract icons last
      // thisView.gCircles.each(function(d){
      //   thisView.addExpContIcons(d, d3.select(this), thisView);
      // });

      //***********
      // POSTRENDER
      //***********
      thisView.postrender();
      //***********
      thisView.isRendered = true;
    },

    /**
     * called for each edge after it has been rendered (all animations have been applied)
     */
    postRenderEdge: function () {},


    /**
     * called for each node after it has been rendered (all animations have been applied)
     */
    postRenderNode: function () {},

    /**
     * Optimize graph placement using dagre
     *
     * @param nodeWidth <number>: the width in px of each node
     * @param <boolean> minSSDist: whether to miminize the squared distance of the
     * nodes moved in the graph by adding the mean distance moved in each direction -- defaults to true
     * @param <id> noMoveNodeId: node id of node that should not move during optimization
     * note: noMoveNodeId has precedent over minSSDist
     */
    optimizeGraphPlacement: function(doRender, minSSDist, noMoveNodeId, orderNodesByX) {
      var thisView = this,
          thisGraph = thisView.model,
          dagreGraph = new dagre.Digraph(),
          nodeWidth = pvt.consts.nodeRadius,
          nodeHeight = pvt.consts.nodeRadius,
          nodes = thisGraph.get("nodes"),
          edges = thisGraph.get("edges"),
          transX = 0,
          transY = 0;

      thisView.state.doCircleTrans = true;
      thisView.state.doPathsTrans = true;

      minSSDist = minSSDist === undefined ? true : minSSDist;

      // input graph into dagre
      nodes.sortBy(function (n) {
        return orderNodesByX ? n.get("x") : -1;
      })
        .forEach(function(node){
          if (thisView.isNodeVisible(node)) {
            dagreGraph.addNode(node.id, {width: nodeWidth, height: nodeHeight});
          }
        });

      edges.each(function(edge){
        if (!edge.get("isContracted") && !edge.get("isTransitive")) {
          dagreGraph.addEdge(edge.id, edge.get("source").id, edge.get("target").id);
        }
      });
      var layout = dagre.layout()
            .rankSep(80)
            .nodeSep(120) // TODO move defaults to consts
            .rankDir(pvt.consts.graphDirection).run(dagreGraph);

      // determine average x and y movement
      if (noMoveNodeId === undefined && minSSDist) {
        layout.eachNode(function(n, inp){
          var node = nodes.get(n);
          transX +=  node.get("x") - inp.x;
          transY += node.get("y") - inp.y;
        });
        transX /= nodes.length;
        transY /= nodes.length;
      }
      // else, don't move a given node
      else if (noMoveNodeId !== undefined) {
        var node = nodes.get(noMoveNodeId),
            inp = layout._strictGetNode(noMoveNodeId);
        transX = node.get("x") - inp.value.x;
        transY = node.get("y") - inp.value.y;
      }

      layout.eachEdge(function(e, u, v, value) {
        var addPts = [];
        value.points.forEach(function(pt){
          addPts.push({x: pt.x + transX, y: pt.y + transY});
        });
        edges.get(e).set("middlePts",  addPts);
      });

      layout.eachNode(function(n, inp){
        var node = nodes.get(n);
        node.set("x", inp.x + transX);
        node.set("y", inp.y + transY);
      });

      if (doRender) {
        thisView.render();
      }
    },

    centerForNode:function (d) {
      var thisView = this;
      if (!thisView.isNodeVisible(d)){
        if (thisView.scopeNode) thisView.nullScopeNode();
        thisView.model.expandGraph();
        thisView.optimizeGraphPlacement(true, false, d.id);
      }
      return thisView.d3SvgG.transition()
        .attr("transform", function () {
          // TODO move this function to pvt
          var dzoom = thisView.dzoom,
              svgBCR = thisView.d3Svg.node().getBoundingClientRect(),
              curScale = dzoom.scale(),
              wx = svgBCR.width,
              wy = svgBCR.height,
              nextY = wy/2 - d.get("y")*curScale - pvt.consts.nodeRadius*curScale/2,
              nextX = wx/2 - d.get("x")*curScale;
          dzoom.translate([nextX, nextY]);
          return "translate(" + nextX + "," + nextY + ") scale(" + curScale + ")";
        });
    },

    /**
     * Add expand/contract icon to graph
     * @param d: the data element
     * @param d3el: d3 selection for the data element
     * @param thisView: current view reference
     * @param isDeps: set to true if working with dependencies (otherwise working with outlinks)
     */
    addExpContIcons: function(d, d3this, thisView){
      if (!thisView.isNodeVisible(d)) return;

      var hasDeps = d.get("dependencies").length > 0,
          hasOLs =  d.get("outlinks").length > 0,
          consts = pvt.consts,
          state = thisView.state;

      // expand/contract dependencies icon
      if (hasDeps){
        pvt.addECIcon.call(thisView, d, d3this, true);
      } else {
        d3this.selectAll("." + consts.depIconGClass).remove();
      }
      // expand/contract outlinks icon
      if (hasOLs) {
        pvt.addECIcon.call(thisView, d, d3this, false);
      } else {
        d3this.selectAll("." + consts.olIconGClass).remove();
      }
    },

    /**
     * Return the g element of the path from the given model
     *
     * @param eModel: the edge model
     */
    getD3PathGFromModel: function(eModel){
      return this.d3Svg.select("#" + this.getPathGId(eModel));
    },

    /**
     * Return the g element for the circle from the given model
     *
     * @param nModel: the node model
     */
    getD3CircleGFromModel: function(nModel){
      return this.d3Svg.select("#" + this.getCircleGId(nModel));
    },

    /**
     * Return the circleG id for a a nodeModel
     *
     * @return <string> the id of circleG
     */
    getCircleGId: function  (nodeModelOrId) {
      if (nodeModelOrId.id !== undefined){
        nodeModelOrId = nodeModelOrId.id;
      }
      return pvt.consts.circleGIdPrefix + nodeModelOrId;
    },

    /**
     * Return the edgeG id for a a nodeModel
     *
     * @return <string> the id of edgeG
     */
    getPathGId: function  (edgeModel) {
      return pvt.consts.edgeGIdPrefix + edgeModel.id;
    },

    /**
     * Returns a clone of the base private object
     *
     * @return {object} the base private object
     */
    getConstsClone: function() {
      return _.clone(pvt.consts);
    },

    /**
     * Return true if the view has been rendered
     */
    isViewRendered: function(){
      return this.isRendered;
    },

    /**
     * return the specified view constant
     */
    getViewConst: function(vc){
      return pvt.consts[vc];
    },

    /**
     * Close and unbind views to avoid memory leaks TODO make sure to unbind any listeners
     */
    close: function() {
      this.remove();
      this.unbind();
    },

    /**
     * @return {boolean} true if the node circle is visible
     */
    isNodeVisible: function(node){
      return true;
    },

    /**
     * @return {boolean} true if the edge path is visible
     */
    isEdgeVisible: function(edge){
      return true;
    },

    //********************
    // ABSTRACT METHODS
    //*******************

    /**
     * Function called before render actions
     * This function should be overwritten in subclasses if desired
     */
    prerender: function() {},

    /**
     * Function called after render actions
     * This function should be overwritten in subclasses if desired
     */
    postrender: function() {},

    /**
     * Function called before initialize actions
     * This function should be overwritten in subclasses if desired
     */
    preinitialize: function() {},

    /**
     * Function called after initialize actions
     * This function should be overwritten in subclasses if desired
     */
    postinitialize: function() {},

    // override in subclass
    windowKeyDown: function() {},

    // override in subclass
    windowKeyUp: function() {},

    // override in subclass
    handleNewPaths: function() {},

    // override in subclass
    firstRender: function(){

    }
  });

});
