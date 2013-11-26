// FIXME remove window
window.define(["backbone", "d3",  "filesaver"], function(Backbone, d3){

  var pvt = {}; 

  pvt.consts = {
    gcWrapId: "gc-wrap",
    svgId: "gc-svg",
    toolboxId: "toolbox",
    selectedClass: "selected",
    connectClass: "connect-node",
    depIconGClass: "dep-icon-g",
    olIconGClass: "ol-icon-g",
    toEditCircleRadius: 10,
    toEditCircleClass: "to-edit-circle",
    gHoverClass: "hover-g",
    circleGClass: "conceptG",
    graphClass: "graph",
    activeEditId: "active-editing",
    expandCrossClass: "exp-cross",
    contractMinusClass: "contract-minus",
    BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13,
    nodeRadius: 50,
    exPlusWidth: 5, // expand plus sign width in pixels
    minusRectW: 11,
    minusRectH: 5.5
  };

  pvt.plusPts = "0,0 " +
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
    .x(function(d){return d.x === undefined ? d.get("x") : d.x;})
    .y(function(d){return d.y === undefined ? d.get("y") : d.y;})
    .interpolate('bundle')
    .tension(1);

  pvt.dragmove = function(d) {
    var thisView = this;
    if (thisView.state.shiftNodeDrag){
      thisView.dragLine.attr('d', 'M' + d.get("x") + ',' + d.get("y") + 'L' + d3.mouse(thisView.d3SvgG.node())[0] + ',' + d3.mouse(thisView.d3SvgG.node())[1]);
    } else{
      d.set("x", d.get("x") +  d3.event.dx);
      d.set("y", d.get("y") + d3.event.dy);
      thisView.render();
    }
  };

  pvt.selectElementContents = function(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };

  /* insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts */
  pvt.insertTitleLinebreaks = function (gEl, title) {
    var words = title.split(/\s+/g),
        nwords = words.length;
    var el = gEl.append("text")
          .attr("text-anchor","middle")
          .attr("dy", "-" + (nwords-1)*7.5);

    for (var i = 0; i < words.length; i++) {
      var tspan = el.append('tspan').text(words[i]);
      if (i > 0)
        tspan.attr('x', 0).attr('dy', '15');
    }
  };

  pvt.replaceSelectEdge = function(d3Path, edgeData){
    var thisView = this;
    d3Path.classed(pvt.consts.selectedClass, true);
    if (thisView.state.selectedEdge){
      pvt.removeSelectFromEdge.call(thisView);
    }
    thisView.state.selectedEdge = edgeData;
  };

  pvt.replaceSelectNode = function(d3Node, nodeData){
    var thisView = this;
    d3Node.classed(pvt.consts.selectedClass, true);
    if (thisView.state.selectedNode){
      pvt.removeSelectFromNode.call(thisView);
    }
    thisView.state.selectedNode = nodeData;
  };

  pvt.removeSelectFromNode = function() {
    var thisView = this;
    thisView.circles.filter(function(cd){
      return cd.id === thisView.state.selectedNode.id;
    }).classed(pvt.consts.selectedClass, false);
    thisView.state.selectedNode = null;
  };

  pvt.removeSelectFromEdge = function() {
    var thisView = this;
    thisView.gPaths.filter(function(cd){
      return cd === thisView.state.selectedEdge;
    }).classed(pvt.consts.selectedClass, false);
    thisView.state.selectedEdge = null;
  };

  // helper function for addNodeIcons
  pvt.addExpContIcon = function(d3Icon, iconGClass, hasExpOrContrName, expandFun, contractFun, placeAtBottom, d3this, thisView, d, consts){
    if (d.get(hasExpOrContrName) 
        && (!d3Icon.node() || !d3Icon.classed(consts.expandCrossClass))) {
      // place plus sign
      d3Icon.remove();
      d3Icon = d3this.append("g")
        .classed(iconGClass, true)
        .classed(consts.expandCrossClass, true);
      var yplace = placeAtBottom ? (consts.nodeRadius - consts.minusRectH*3 - 8) : (-consts.nodeRadius + consts.minusRectH*3 - 8);
      d3Icon.append("polygon")
        .attr("points", pvt.plusPts)
        .attr("transform", "translate(" + (-consts.exPlusWidth/2) + ","
              + yplace + ")")
        .on("mouseup", function(){
          if (!thisView.state.justDragged) {
            thisView.state.expOrContrNode = true;
            expandFun.call(d);
            thisView.optimizeGraphPlacement(false, d.id);
          }
        });
    } else if (!d.get(hasExpOrContrName) && (!d3Icon.node() || !d3Icon.classed(consts.contractMinusClass))) {
      // place minus sign
      d3Icon.remove();
      d3Icon = d3this.append("g")
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

  // add node icons (e.g. expand/contract) to the circle
  pvt.addNodeIcons = function(thisView, d){
    if (!d.isVisible()) return;

    var d3this = d3.select(this),
        hasDeps = d.get("dependencies").length > 0,
        hasOLs =  d.get("outlinks").length > 0,
        consts = pvt.consts,
        state = thisView.state,
        d3DepIcon = d3this.selectAll("." + consts.depIconGClass),
        d3OLIcon = d3this.selectAll("." + consts.olIconGClass);

    // expand/contract dependencies icon
    if (hasDeps){
      pvt.addExpContIcon(d3DepIcon, consts.depIconGClass, "hasContractedDeps",
                         d.expandDeps, d.contractDeps, true, d3this, thisView, d, consts);
    } else {
      d3DepIcon.remove();
    }
    // expand/contract outlinks icon
    if (hasOLs) {
      pvt.addExpContIcon(d3OLIcon, consts.olIconGClass, "hasContractedOLs",
                         d.expandOLs, d.contractOLs, false, d3this, thisView, d, consts);
    } else {
      d3OLIcon.remove();
    }
  };


  var GraphEditor = Backbone.View.extend({
    el: document.getElementById(pvt.consts.gcWrapId),

    events: {
      "click #optimize": "optimizeGraphPlacement",
      "click #upload-input": function(){ document.getElementById("hidden-file-upload").click();},
      "change #hidden-file-upload": "uploadGraph",
      "click #download-input": "downloadGraph",
      "click #delete-graph": "clearGraph"
    },
    
    initialize: function() {
      var thisView = this;
      thisView.state = {
        selectedNode: null,
        selectedEdge: null,
        mouseDownNode: null,
        mouseDownLink: null,
        justDragged: false,
        justScaleTransGraph: false,
        lastKeyDown: -1,
        shiftNodeDrag: false,
        selectedText: null,
        expOrContrNode: false,
        doCircleTrans: false,
        doPathsTrans: false,
        toNodeEdit: false
      };

      thisView.idct = 0;

      // get svg and append static content
      thisView.d3Svg = d3.select("#" + pvt.consts.svgId);
      var d3Svg = thisView.d3Svg;
      // define arrow markers for graph links
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

      /******
       * Setup d3-based event listeners
       ******/

      // displayed when dragging between nodes
      thisView.dragLine = d3SvgG.append('svg:path')
        .attr('class', 'link dragline hidden')
        .attr('d', 'M0,0L0,0')
        .style('marker-end', 'url(#end-arrow)');

      // svg nodes and edges 
      thisView.gPaths = d3SvgG.append("g").selectAll("g");
      thisView.circles = d3SvgG.append("g").selectAll("g");
      
      thisView.drag = d3.behavior.drag()
        .origin(function(d){
          return {x: d.x, y: d.y};
        })
        .on("drag", function(args){
          thisView.state.justDragged = true;
          pvt.dragmove.call(thisView, args);
        })
        .on("dragstart", function() {
          // remove connecting intermediate pts
          var state = thisView.state;
          if (!state.shiftNodeDrag){
            state.mouseDownNode.get("dependencies").each(function(d){
              d.set("middlePts", []);
            });
            state.mouseDownNode.get("outlinks").each(function(d){
              d.set("middlePts", []);
            });
          }
        })
        .on("dragend", function() {
          // todo check if edge-mode is selected
        });

      // listen for key events on the window
      d3.select(window).on("keydown", function() { 
        thisView.windowKeyDown.call(thisView);
      })
        .on("keyup", function() {
          thisView.windowKeyUp.call(thisView);
        });

      // TODO place these listeners using backbone?
      d3Svg.on("mousedown", function(d){thisView.svgMouseDown.call(thisView, d);});
      d3Svg.on("mouseup", function(d){thisView.svgMouseUp.call(thisView, d);});

      // zoomed function used for dragging behavior below
      function zoomed() {
        thisView.state.justScaleTransGraph = true;
        d3.select("." + pvt.consts.graphClass)
          .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")"); 
      };

      // listen for dragging
      var dragSvg = d3.behavior.zoom()
            .on("zoom", function() {
              if (d3.event.sourceEvent.shiftKey){
                // TODO  the internal d3 state is still changing
                return false;
              } else{
                zoomed.call(thisView);
              }
              return true;
            })
            .on("zoomstart", function() {
              var ael = d3.select("#" + pvt.consts.activeEditId).node();
              if (ael){
                ael.blur();
              }
              if (!d3.event.sourceEvent.shiftKey) d3.select('body').style("cursor", "move");
            })
            .on("zoomend", function() {
              d3.select('body').style("cursor", "auto");
            });      
      d3Svg.call(dragSvg).on("dblclick.zoom", null);

      // rerender when the graph model changes from server data
      thisView.listenTo(thisView.model, "loadedServerData", thisView.render);
    },


    render: function() {      
      var thisView = this,
          consts = pvt.consts,
          state = thisView.state;

      thisView.gPaths = thisView.gPaths
        .data(thisView.model.get("edges").filter(function(mdl){
          return mdl.isVisible();
        }), function(d){
          return d.id;
        });
      
      var gPaths = thisView.gPaths;
      
      // update existing paths
      gPaths.classed(consts.selectedClass, function(d){
        return d === state.selectedEdge;
      });

      if (thisView.state.doPathsTrans){
        gPaths.each(function(d){
          var d3el = d3.select(this),
              edgePath = getEdgePath(d);
          d3el.selectAll("path") // TODO don't transition the invisible path
            .transition()
            .attrTween("d", pathTween(edgePath, 4));
        });
        thisView.state.doPathsTrans = false;
      }
      else{
        gPaths.each(function(d){
          // FIXME: remove code repetition with above conditional
          var d3el = d3.select(this),
              edgePath = getEdgePath(d);
          d3el.selectAll("path")
            .attr("d", edgePath);
        });
      }

      // add new paths
      gPaths.enter()
        .append("g")
        .each(function(d){
          var d3el = d3.select(this),
              edgePath = getEdgePath(d);

          // apend display path
          d3el.append("path")
            .style('marker-end','url(#end-arrow)')
            .classed("link", true)
            .attr("d", edgePath );
          // append onhover path
          d3el.append("path")
            .attr("d", edgePath )          
            .classed("link-wrapper", true)
            .on("mousedown", function(d){
              thisView.pathMouseDown.call(thisView, d3el, d);
            })
            .on("mouseup", function(d){
              state.mouseDownLink = null;
            });
        });

      function getEdgePath(d){
        var pathPts = [].concat(d.get("middlePts"));        
        pathPts.unshift(d.get("source"));        
        // TODO only compute if node position changed
        pathPts.push(computeEndPt(pathPts[pathPts.length-1], d.get("target"))); 
        return pvt.d3Line(pathPts);
      }

      // from http://bl.ocks.org/mbostock/3916621
      function pathTween(d1, precision) {
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
      }

      // computes intersection points for two circular nodes (simple geometry)
      function computeEndPt(src, tgt){
        var srcX = src.x === undefined ? src.get("x") : src.x,
            srcY =  src.y === undefined ? src.get("y") : src.y,
            tgtX = tgt.get("x"),
            tgtY = tgt.get("y"),
            ratio = Math.pow((srcY - tgtY)/(srcX - tgtX), 2),
            r = pvt.consts.nodeRadius,
            offX = r/Math.sqrt(1 + ratio) * (srcX > tgtX ? -1 : 1),
            offY = r/Math.sqrt(1 + 1/ratio) * (srcY > tgtY ? -1 : 1);

        // keep source at origin since we don't have an end marker
        return {x: tgtX - offX, y: tgtY - offY};
      }

      // remove old links
      gPaths.exit().remove(); // TODO add appropriate animation
      
      // update existing nodes
      thisView.circles = thisView.circles
        .data(thisView.model.get("nodes").filter(function(mdl){return mdl.isVisible();}),
              function(d){
                return d.id;
              });
      
      thisView.circles.exit().remove(); // TODO add appropriate animation
      
      if (thisView.state.doCircleTrans){
        thisView.circles
          .transition()
          .attr("transform", function(d){
            return "translate(" + d.get("x") + "," + d.get("y") + ")";
          });
        thisView.state.doCircleTrans = false;
      }
      else {
        thisView.circles
          .attr("transform", function(d){
            return "translate(" + d.get("x") + "," + d.get("y") + ")";
          });
      }

      // add new nodes
      var newGs = thisView.circles.enter()
            .append("g");

      newGs.classed(consts.circleGClass, true)
        .attr("transform", function(d){return "translate(" + d.get("x") + "," + d.get("y") + ")";})
        .on("mouseover", function(d){        
          if (state.shiftNodeDrag){
            d3.select(this).classed(consts.connectClass, true);
          }
          else{
            d3.select(this).classed(consts.gHoverClass, true);
          }
        })
        .on("mouseout", function(d){
          d3.select(this).classed(consts.connectClass, false);
          d3.select(this).classed(consts.gHoverClass, false);
        })
        .on("mousedown", function(d){
          thisView.circleMouseDown.call(thisView, d3.select(this), d);
        })
        .on("mouseup", function(d){
          thisView.circleMouseUp.call(thisView, d3.select(this), d);
        })
        .call(thisView.drag);

      // setup event listener for changing title
      newGs.each(function(d){
        var d3el = d3.select(this);
        thisView.listenTo(d, "change:title", function() {
          d3el.selectAll("text").remove();
          pvt.insertTitleLinebreaks(d3el, d.get("title"));
        });
      });
      
      // add big circle to represent the concept node
      newGs.append("circle")
        .attr("r", consts.nodeRadius);

      // add small circle link for editing
      newGs.append("circle")
        .attr("r", consts.toEditCircleRadius)
        .attr("cx", consts.nodeRadius*0.707)
        .attr("cy", -consts.nodeRadius*0.707)
        .classed(consts.toEditCircleClass, true)
        .on("mouseup", function(d){
          if (!thisView.state.justDragged){
            thisView.state.toNodeEdit = true;
            document.location = document.location.pathname + "#" + d.get("id");
          }
        });

      newGs.each(function(d){
        pvt.insertTitleLinebreaks(d3.select(this), d.get("title"));
      });


      thisView.circles.each(function(d){
        pvt.addNodeIcons.call(this, thisView, d);
      });
    },

    pathMouseDown: function(d3path, d){
      var thisView = this,
          state = thisView.state;
      d3.event.stopPropagation();
      state.mouseDownLink = d;

      if (state.selectedNode){
        pvt.removeSelectFromNode.call(thisView);
      }
      
      var prevEdge = state.selectedEdge;  
      if (!prevEdge || prevEdge !== d){
        pvt.replaceSelectEdge.call(thisView, d3path, d);
      } else{
        pvt.removeSelectFromEdge.call(thisView);
      }
    },

    circleMouseDown: function(d3node, d){
      var thisView = this,
          state = thisView.state;
      d3.event.stopPropagation();
      state.mouseDownNode = d;
      if (d3.event.shiftKey){
        state.shiftNodeDrag = d3.event.shiftKey;
        // reposition dragged directed edge
        thisView.dragLine.classed('hidden', false)
          .attr('d', 'M' + d.get("x") + ',' + d.get("y") + 'L' + d.get("x") + ',' + d.get("y"));
        return;
      }
    },

    circleMouseUp: function(d3node, d){
      var thisView = this,
          state = thisView.state,
          consts = pvt.consts;

      // clicked edit node button or expand/contract node
      if (state.toNodeEdit || state.expOrContrNode){
        state.expOrContrNode = false;
        state.toNodeEdit = false;
        return;
      }
      
      // reset the states
      state.shiftNodeDrag = false;    
      d3node.classed(consts.connectClass, false);
      
      var mouseDownNode = state.mouseDownNode;
      
      if (!mouseDownNode) return;

      thisView.dragLine.classed("hidden", true);

      if (mouseDownNode !== d){
        // we're in a different node: create new edge for mousedown edge and add to graph
        var newEdge = {source: mouseDownNode, target: d, id: thisView.idct++};
        var filtRes = thisView.gPaths.filter(function(d){
          if (d.get("source") === newEdge.target && d.get("target") === newEdge.source){
            thisView.model.removeEdge(d);
          }
          return d.get("source") === newEdge.source && d.get("target") === newEdge.target;
        });
        if (!filtRes[0].length){
          thisView.model.addEdge(newEdge); // todo switch to create
          thisView.render();
        } 
      } else {
        // we're in the same node
        if (state.justDragged) {
          // dragged, not clicked
          state.justDragged = false;
        } else{
          // clicked, not dragged
          if (d3.event.shiftKey){
            // shift-clicked node: edit text content
            var d3txt = thisView.changeTextOfNode(d3node, d);
            var txtNode = d3txt.node();
            pvt.selectElementContents(txtNode);
            txtNode.focus();
          } else{
            // normal click node
            if (state.selectedEdge){
              pvt.removeSelectFromEdge.call(thisView);
            }
            var prevNode = state.selectedNode;            
            
            if (!prevNode || prevNode.id !== d.id){
              pvt.replaceSelectNode.call(thisView, d3node, d);
            } else{
              pvt.removeSelectFromNode.call(thisView);
            }
          }
        }
      }
      state.mouseDownNode = null;
      return;
      
    }, // end of circles mouseup

    changeTextOfNode: function(d3node, d){
      var thisView= this,
          consts = pvt.consts,
          htmlEl = d3node.node();
      d3node.selectAll("text").style("display", "none");
      var nodeBCR = htmlEl.getBoundingClientRect(),
          curScale = nodeBCR.width/consts.nodeRadius,
          placePad  =  5*curScale,
          useHW = curScale > 1 ? nodeBCR.width*0.71 : consts.nodeRadius*1.42;
      // replace with editableconent text
      var d3txt = thisView.d3Svg.selectAll("foreignObject")
            .data([d])
            .enter()
            .append("foreignObject")
            .attr("x", nodeBCR.left + placePad )
            .attr("y", nodeBCR.top + placePad)
            .attr("height", 2*useHW)
            .attr("width", useHW)
            .append("xhtml:p")
            .attr("id", consts.activeEditId)
            .attr("contentEditable", "true")
            .text(d.get("title"))
            .on("mousedown", function(d){
              d3.event.stopPropagation();
            })
            .on("keydown", function(d){
              d3.event.stopPropagation();
              if (d3.event.keyCode == consts.ENTER_KEY && !d3.event.shiftKey){
                this.blur();
              }
            })
            .on("blur", function(d){
              d3node.selectAll("text").style("display", "block");
              d.set("title", this.textContent);
              d3.select(this.parentElement).remove();
            });
      return d3txt;
    },

    svgMouseDown: function() {
      this.state.graphMouseDown = true;
    },

    // mouseup on main svg
    svgMouseUp: function() {
      var thisView = this,
          state = thisView.state;

      if (state.justScaleTransGraph) {
        // dragged not clicked
        state.justScaleTransGraph = false;
      } else if (state.graphMouseDown && d3.event.shiftKey){
        // clicked not dragged from svg
        var xycoords = d3.mouse(thisView.d3SvgG.node()),
            d = {id: thisView.idct++, title: "concept title", x: xycoords[0], y: xycoords[1]},
            model = thisView.model;

        // add new node and make title immediently editable
        model.addNode(d); // todo switch to create once server is up
        d = model.getNode(d.id);
        thisView.render();
        var d3txt = thisView.changeTextOfNode(thisView.circles.filter(function(dval){
          return dval.id === d.id;
        }), d),
            txtNode = d3txt.node();
        pvt.selectElementContents(txtNode);
        txtNode.focus();
      } else if (state.shiftNodeDrag){
        // dragged from node
        state.shiftNodeDrag = false;
        thisView.dragLine.classed("hidden", true);
      }
      state.graphMouseDown = false;
    },

    // keydown on main svg
    windowKeyDown: function() {
      if (!this.$el.is(":visible")) { return; }
      
      var thisView = this,
          state = thisView.state,
          consts = pvt.consts;
      // make sure repeated key presses don't register for each keydown
      if(state.lastKeyDown !== -1) return;

      state.lastKeyDown = d3.event.keyCode;
      var selectedNode = state.selectedNode,
          selectedEdge = state.selectedEdge;

      switch(d3.event.keyCode) {
      case consts.BACKSPACE_KEY:
      case consts.DELETE_KEY:
        d3.event.preventDefault();
        if (selectedNode){
          if (confirm("delete node: " + selectedNode.get("title") + "?\nNote: all associated data will be removed")){
            thisView.model.removeNode(selectedNode);
            state.selectedNode = null;
            thisView.render();
          }
        } else if (selectedEdge){
          if (confirm("delete edge: " + selectedEdge.get("source").get("title") + " -> " + selectedEdge.get("target").get("title") + "?\nNote: all associated data will be removed")){
            thisView.model.removeEdge(selectedEdge);
            state.selectedEdge = null;
            thisView.render();
          }
        }
        break;
      }
    },

    // key up on main svg
    windowKeyUp: function() {
      this.state.lastKeyDown = -1;
    },

    /**
     * Optimize graph placement using dagre
     * TODO should this be moved to the graph object?
     *
     * @param <boolean> minSSDist: whether to miminize the squared distance of the
     * nodes moved in the graph by adding the mean distance moved in each direction -- defaults to true
     * @param <id> noMoveNodeId: node id of node that should not move during optimization
     * note: noMoveNodeId has precedent over minSSDist
     */
    optimizeGraphPlacement: function(minSSDist, noMoveNodeId) {
      var thisView = this;
      thisView.state.doCircleTrans = true;
      thisView.state.doPathsTrans = true;
      thisView.model.optimizePlacement(pvt.consts.nodeRadius, minSSDist, noMoveNodeId);
      thisView.render();

    },

    uploadGraph: function(evt){
      if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
        alert("Your browser won't let you load a graph -- try upgrading your browser to IE 10+ or Chrome or Firefox.");
        return;
      }
      var thisGraph = this,
          uploadFile = evt.currentTarget.files[0],
          filereader = new window.FileReader();
      
      filereader.onload = function(){
        var txtRes = filereader.result;        
        try{
          var jsonObj = JSON.parse(txtRes);
          // thisGraph.deleteGraph(true);
          thisGraph.model.addJsonNodesToGraph(jsonObj);
          thisGraph.render();
        }catch(err){
          // FIXME better/more-informative error handling
          alert("Error parsing uploaded file\nerror message: " + err.message);
          return;
        }
      };
      filereader.readAsText(uploadFile);
    },

    downloadGraph: function(){
      var outStr = JSON.stringify(this.model.toJSON()),
          blob = new window.Blob([outStr], {type: "text/plain;charset=utf-8"});
      window.saveAs(blob, "mygraph.json"); // TODO replace with title once available
    },

    clearGraph: function(confirmDelete){
      if (!confirmDelete || confirm("Press OK to clear this graph")){
        this.model.clear().set(this.model.defaults());
        this.render();
      }
    }    
  }); // end GraphEditor definition


  return GraphEditor;
  
});
