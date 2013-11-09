// FIXME remove window
window.define(["backbone", "d3"], function(Backbone, d3){

  var pvt = {};

  pvt.consts = {
    selectedClass: "selected",
    connectClass: "connect-node",
    toEditCircleRadius: 10,
    toEditCircleClass: "to-edit-circle",
    circleGClass: "conceptG",
    graphClass: "graph",
    activeEditId: "active-editing",
    BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13,
    nodeRadius: 50
  };

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
      thisView.removeSelectFromEdge();
    }
    thisView.state.selectedEdge = edgeData;
  };

  pvt.replaceSelectNode = function(d3Node, nodeData){
    var thisView = this;
    d3Node.classed(pvt.consts.selectedClass, true);
    if (thisView.state.selectedNode){
      thisView.removeSelectFromNode();
    }
    thisView.state.selectedNode = nodeData;
  };

  pvt.removeSelectFromNode = function(){
    var thisView = this;
    thisView.circles.filter(function(cd){
      return cd.id === thisView.state.selectedNode.id;
    }).classed(pvt.consts.selectedClass, false);
    thisView.state.selectedNode = null;
  };

  pvt.removeSelectFromEdge = function(){
    var thisView = this;
    thisView.paths.filter(function(cd){
      return cd === thisView.state.selectedEdge;
    }).classed(pvt.consts.selectedClass, false);
    thisView.state.selectedEdge = null;
  };



  var GraphEditor = Backbone.View.extend({
    el: document.getElementById("gc-svg"),
    
    initialize: function(){
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
        selectedText: null
      };

      thisView.idct = 0;

      // get svg and append static content
      thisView.d3Svg = d3.select(thisView.el);
      var d3Svg = thisView.d3Svg;
      // define arrow markers for graph links
      var defs = d3Svg.append('svg:defs');
      defs.append('svg:marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', "32")
        .attr('markerWidth', 3.5)
        .attr('markerHeight', 3.5)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5');

      // define arrow markers for leading arrow
      defs.append('svg:marker')
        .attr('id', 'mark-end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 7)
        .attr('markerWidth', 3.5)
        .attr('markerHeight', 3.5)
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
        .style('marker-end', 'url(#mark-end-arrow)');

      // svg nodes and edges 
      thisView.paths = d3SvgG.append("g").selectAll("g");
      thisView.circles = d3SvgG.append("g").selectAll("g");
      
      thisView.drag = d3.behavior.drag()
        .origin(function(d){
          return {x: d.x, y: d.y};
        })
        .on("drag", function(args){
          thisView.state.justDragged = true;
          pvt.dragmove.call(thisView, args);
        })
        .on("dragend", function() {
          // todo check if edge-mode is selected
        });

      // listen for key events
      d3.select(window).on("keydown", function(){
        thisView.svgKeyDown.call(thisView);
      })
        .on("keyup", function(){
          thisView.svgKeyUp.call(thisView);
        });

      // Place these listeners using backbone!
      d3Svg.on("mousedown", function(d){thisView.svgMouseDown.call(thisView, d);});
      d3Svg.on("mouseup", function(d){thisView.svgMouseUp.call(thisView, d);});

      // zoomed function used for dragging behavior below
      function zoomed(){
        thisView.state.justScaleTransGraph = true;
        d3.select("." + pvt.consts.graphClass)
          .attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")"); 
      };

      // listen for dragging
      var dragSvg = d3.behavior.zoom()
            .on("zoom", function(){
              if (d3.event.sourceEvent.shiftKey){
                // TODO  the internal d3 state is still changing
                return false;
              } else{
                zoomed.call(thisView);
              }
              return true;
            })
            .on("zoomstart", function(){
              var ael = d3.select("#" + pvt.consts.activeEditId).node();
              if (ael){
                ael.blur();
              }
              if (!d3.event.sourceEvent.shiftKey) d3.select('body').style("cursor", "move");
            })
            .on("zoomend", function(){
              d3.select('body').style("cursor", "auto");
            });
      
      d3Svg.call(dragSvg).on("dblclick.zoom", null);
    },


    render: function(){
      
      var thisView = this,
          consts = pvt.consts,
          state = thisView.state;

      // NOWTODO fix all paths and circles and nodes and edges to use models
      thisView.paths = thisView.paths.data(thisView.model.get("edges").models, function(d){
        return d.id;
      });
      var paths = thisView.paths;
      // update existing paths
      paths.style('marker-end', 'url(#end-arrow)')
        .classed(consts.selectedClass, function(d){
          return d === state.selectedEdge;
        })
        .attr("d", function(d){
          return "M" + d.get("source").get("x") + "," + d.get("source").get("y") + "L" + d.get("target").get("x") + "," + d.get("target").get("y");
        });

      // add new paths
      paths.enter()
        .append("path")
        .style('marker-end','url(#end-arrow)')
        .classed("link", true)
        .attr("d", function(d){
          return "M" + d.get("source").get("x") + "," + d.get("source").get("y") + "L" + d.get("target").get("x") + "," + d.get("target").get("y");
        })
        .on("mousedown", function(d){
          thisView.pathMouseDown.call(thisView, d3.select(this), d);
        }
           )
        .on("mouseup", function(d){
          state.mouseDownLink = null;
        });

      // remove old links
      paths.exit().remove();
      
      // update existing nodes
      thisView.circles = thisView.circles.data(thisView.model.get("nodes").models, function(d){
        return d.id;
      });
      thisView.circles.attr("transform", function(d){return "translate(" + d.get("x") + "," + d.get("y") + ")";});

      // add new nodes
      var newGs= thisView.circles.enter()
            .append("g");

      newGs.classed(consts.circleGClass, true)
        .attr("transform", function(d){return "translate(" + d.get("x") + "," + d.get("y") + ")";})
        .on("mouseover", function(d){        
          if (state.shiftNodeDrag){
            d3.select(this).classed(consts.connectClass, true);
          }
        })
        .on("mouseout", function(d){
          d3.select(this).classed(consts.connectClass, false);
        })
        .on("mousedown", function(d){
          thisView.circleMouseDown.call(thisView, d3.select(this), d);
        })
        .on("mouseup", function(d){
          thisView.circleMouseUp.call(thisView, d3.select(this), d);
        })
        .call(thisView.drag);

      // add big circle to represent the concept node
      newGs.append("circle")
        .attr("r", consts.nodeRadius);

      // add small circle link for editing
      newGs.append("circle")
        .attr("r", consts.toEditCircleRadius)
        .attr("cx", consts.nodeRadius*0.707)
        .attr("cy", -consts.nodeRadius*0.707)
        .classed(consts.toEditCircleClass, true)
        .on("click", function(d){
          // send to editor TODO make this less hacky
          d3.event.preventDefault();
          document.location = document.location + "#" + d.get("id");
        });

      newGs.each(function(d){
        pvt.insertTitleLinebreaks(d3.select(this), d.get("title"));
      });

      // remove old nodes
      thisView.circles.exit().remove();
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
      // reset the states
      state.shiftNodeDrag = false;    
      d3node.classed(consts.connectClass, false);
      
      var mouseDownNode = state.mouseDownNode;
      
      if (!mouseDownNode) return;

      thisView.dragLine.classed("hidden", true);

      if (mouseDownNode !== d){
        // we're in a different node: create new edge for mousedown edge and add to graph
        var newEdge = {source: mouseDownNode, target: d, id: thisView.idct++};
        var filtRes = thisView.paths.filter(function(d){
          if (d.get("source") === newEdge.target && d.get("target") === newEdge.source){
            thisView.model.get("edges").remove(d);
          }
          return d.source === newEdge.source && d.target === newEdge.target;
        });
        if (!filtRes[0].length){
          thisView.model.get("edges").add(newEdge); // todo switch to create
          newEdge = thisView.model.get("edges").get(newEdge.id);
          // add dependency to appropriate node
          d.get("dependencies").add(newEdge);
          mouseDownNode.get("outlinks").add(newEdge);
          thisView.render();
        }
      } else{
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
      d3node.selectAll("text").remove();
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
              d.set("title", this.textContent);
              pvt.insertTitleLinebreaks(d3node, d.get("title"));
              d3.select(this.parentElement).remove();
            });
      return d3txt;
    },

    svgMouseDown: function(){
      this.state.graphMouseDown = true;
    },

    // mouseup on main svg
    svgMouseUp: function(){
      var thisView = this,
          state = thisView.state;
      if (state.justScaleTransGraph) {
        // dragged not clicked
        state.justScaleTransGraph = false;
      } else if (state.graphMouseDown && d3.event.shiftKey){
        // clicked not dragged from svg
        var xycoords = d3.mouse(thisView.d3SvgG.node()),
            d = {id: thisView.idct++, title: "new concept", x: xycoords[0], y: xycoords[1]};
        var nodes = thisView.model.get("nodes");
        nodes.add(d); // todo switch to create once server is up
        d = nodes.get(d.id);
        thisView.render();
        // make title of text immediently editable
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
    svgKeyDown: function() {
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
          thisView.model.get("nodes").remove(selectedNode);
          // remove associate edges
          var edges = thisView.model.get("edges");
          selectedNode.get("dependencies").each(function(d){
            edges.remove(d);
            d.get("source").get("outlinks").remove(d);
          });
          selectedNode.get("outlinks").each(function(d){
            edges.remove(d);
            d.get("target").get("dependencies").remove(d);
          });

          state.selectedNode = null;
          thisView.render();
        } else if (selectedEdge){
          thisView.model.get("edges").remove(selectedEdge);
          selectedEdge.get("source").get("outlinks").remove(selectedEdge);
          selectedEdge.get("target").get("dependencies").remove(selectedEdge);
          state.selectedEdge = null;
          thisView.render();
        }
        break;
      }
    },

    // key up on main svg
    svgKeyUp: function() {
      this.state.lastKeyDown = -1;
    }
    
  });


  return GraphEditor;
  
});
