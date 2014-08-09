
/*global define*/
define(["jquery", "backbone", "d3",  "underscore", "lib/kmapjs/views/graph-view", "utils/utils", "filesaver"], function($, Backbone, d3, _, GraphView, Utils){
  var pvt = {};

  pvt.consts = _.extend(GraphView.prototype.getConstsClone(), {
    svgId: "gc-svg",
    titleId: "graph-title",
    expClass: "expanded",
    instructionsDivId: "create-instructions",
    instMinimizeClass: "instructions-minimize",
    instIconClass: "instructions-icon",
    toolboxId: "toolbox",
    selectedClass: "selected",
    connectClass: "connect-node",
    toEditCircleGClass: "to-edit-circle-g",
    activeEditId: "active-editing",
    localStoreShowInstsKey: "show-gc-inst",
    toEditCircleRadius: 14,
    BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13
  });


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
    thisView.gCircles.filter(function(cd){
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

  var GraphEditor = GraphView.extend({
    events: function () {
      var thisView = this,
          consts = pvt.consts,
          levts = {};

      levts["keydown #" + consts.titleId] = function (evt) {
        var keyCode = evt.keyCode;
        if (keyCode === consts.ENTER_KEY) {
          evt.currentTarget.blur();
        }
      };

      levts["click ." + consts.instMinimizeClass] = function (evt) {
        $(evt.currentTarget.parentNode).removeClass(consts.expClass);
        if(typeof(window.localStorage)!=="undefined")
        {
          window.localStorage.setItem(consts.localStoreShowInstsKey, 0);
        }
      };

      levts["click ." + consts.instIconClass] = function (evt) {
        $(evt.currentTarget.parentNode).addClass(consts.expClass);
        if(typeof(window.localStorage)!=="undefined")
        {
          window.localStorage.setItem(consts.localStoreShowInstsKey, 1);
        }
      };

      levts["blur #" + pvt.consts.titleId] = function (evt) {
        var title = evt.currentTarget.innerHTML;
        thisView.model.set("title", title);
        thisView.model.save({title: title}, {
          parse: false,
          success: function (mdl, resp) {
            Utils.urlFromNewToId(thisView.model.id);
          },
          error:function (mdl, resp) {
            Utils.errorNotify("unable to sync graph title - " + resp.responseText);
          }
        });
      };
      return _.extend(GraphView.prototype.events, levts);
    },

    // @override
    postinitialize: function() {
      var thisView = this;
      thisView.state = _.extend(thisView.state, {
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
        toNodeEdit: false
      });

      // use expand/contract icons in editor graph
      thisView.addECIcon = true;

      // change transition timing
      thisView.newPathTransDelay= 0;  // transition delay for new paths (lets nodes appear first)
      thisView.newPathTransTime= 0;  // fade in time of new paths
      thisView.rmPathTransTime= 0;  // fade out time of removed paths
      thisView.rmCircleTransTime= 0;  // fade out time of removed circles
      thisView.newCircleTransDelay= 0;  // trans delay for new circles
      thisView.newCircleTransTime= 0; // trans fade-in time for new circles

      // change vis settings
      var settings = thisView.settings;
      settings.useWisps = false;
      settings.showEdgeSummary = false;
      settings.showNodeSummary = false;
      thisView.settings = settings;

      /******
       * Setup=d3; based event listeners
       ******/
      // rerender when the graph model changes from server data TOMOVE
      thisView.listenTo(thisView.model, "loadedServerData", thisView.render);
    },

    // @override
    firstRender: function(){
      var thisView = this,
          d3Svg = thisView.d3Svg,
          d3SvgG = thisView.d3SvgG,
          consts = pvt.consts;

      // svg listeners
      d3Svg.on("mousedown", function(){thisView.svgMouseDown.apply(thisView, arguments);});
      d3Svg.on("mouseup", function(){thisView.svgMouseUp.apply(thisView, arguments);});

      var titleDiv = document.createElement("h1");
      titleDiv.id = consts.titleId;
      titleDiv.innerHTML = thisView.model.get("title");
      titleDiv.setAttribute("contentEditable", "true");
      thisView.$el.append(titleDiv);

      // add the instructions tab
      thisView.$el.append(document.getElementById(consts.instructionsDivId));

      // hide/show the ls depending on ls props
      var showInstr = true,
          instrDiv = thisView.$el.find("#" + consts.instructionsDivId);
      instrDiv.show();
      if (typeof(window.localStorage) !== "undefined" && window.localStorage.hasOwnProperty(consts.localStoreShowInstsKey)) {
        showInstr = Boolean(Number(window.localStorage[consts.localStoreShowInstsKey]));
      }
      showInstr ? instrDiv.addClass(consts.expClass) : instrDiv.removeClass(consts.expClass);

      // displayed when dragging between nodes
      thisView.dragLine = d3SvgG.insert('svg:path', ":first-child")
        .attr('class', 'link dragline hidden')
        .attr('d', 'M0,0L0,0')
        .style('marker-end', 'url(#end-arrow)');

      // dragging particular to edit view
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

      // listen for dragging
      thisView.dzoom = d3.behavior.zoom()
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
      d3Svg.call(thisView.dzoom).on("dblclick.zoom", null);

      // zoomed function used for dragging behavior above
      function zoomed() {
        thisView.state.justScaleTransGraph = true;
        d3SvgG.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
      };
    },

    // @override
    postrender: function() {
      var thisView = this,
          consts = pvt.consts;
      thisView.gPaths.classed(pvt.consts.selectedClass, function(d){
        return d === thisView.state.selectedEdge;
      });
      thisView.$el.find("#" + consts.titleId).html(thisView.model.get("title"));
    },

    // @override
    handleNewPaths: function(newGs){
      var thisView = this;
      newGs
        .on("mousedown", function(d){
          thisView.pathMouseDown.call(this, d, thisView);
        })
        .on("mouseup", function(d){
          thisView.state.mouseDownLink = null;
        });
    },

    // @override
    handleNewCircles: function(newGs){
      var thisView = this,
          state = thisView.state,
          consts = pvt.consts;

      newGs
        .on("mouseover", function(d){
          if (state.shiftNodeDrag){
            d3.select(this).classed(consts.connectClass, true);
          }
          else{
            d3.select(this).classed(consts.hoveredClass, true);
          }
        })
        .on("mouseout", function(d){
          d3.select(this).classed(consts.connectClass, false);
          d3.select(this).classed(consts.hoveredClass, false);
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
          d3el.selectAll("text." + consts.titleTextClass).remove();
          thisView.insertTitleLinebreaks(d3el, d.get("title"));
        });
      });

      // add small circle link for editing
      var newGG = newGs.append("g")
            .attr("transform", "translate(" + consts.nodeRadius*Math.SQRT1_2 + "," + (-consts.nodeRadius*Math.SQRT1_2) + ")")
            .classed(consts.toEditCircleGClass, true);

      newGG.append("circle")
        .attr("r", consts.toEditCircleRadius)
        .on("mouseup", function(d){
          if (!thisView.state.justDragged){
            thisView.state.toNodeEdit = true;
            thisView.appRouter.changeUrlParams({mode: "edit", focus: d.id});
          }
        });
      newGG.append("text")
        .attr("dy", 3)
        .attr("text-anchor", "middle")
        .text("edit");
    },

    pathMouseDown: function(d, thisView){
      var state = thisView.state,
          d3path = d3.select(this); // FIXME this is a problem !
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
        var newEdge = {source: mouseDownNode, target: d};
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
          nodeRadius = consts.nodeRadius;

      d3node.selectAll("text." + consts.titleTextClass).style("display", "none");
      var curTrans = thisView.dzoom.translate(),
          curScale = thisView.dzoom.scale(),//nodeBCR.width/consts.nodeRadius,
          placePad  =  10*curScale,
          useHW = curScale > 1 ? curScale*nodeRadius*0.71 : nodeRadius*1.42;
      // replace with editableconent text
      var d3txt = thisView.d3Svg.selectAll("foreignObject")
            .data([d])
            .enter()
            .append("foreignObject")
            .attr("x", curTrans[0] + (d.get("x") - nodeRadius) *curScale + placePad )
            .attr("y", curTrans[1] + (d.get("y") - nodeRadius) *curScale + placePad )// nodeBCR.top + placePad)
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
              d3node.selectAll("text." + consts.titleTextClass).style("display", "block");
              d.save({"title": this.textContent}, {patch: true, parse: false, error: function (robj, resp) {
                Utils.errorNotify("unable to save title to the server: "
                                  + (resp.status === 401 ? "you are not authorized to make these changes (are you logged in?)"
                                     : resp.responseText));
              }});
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
            d = {title: "concept title", x: xycoords[0], y: xycoords[1]},
            model = thisView.model;

        // add new node and make title immediently editable
        model.addNode(d); // todo switch to create once server is up
        d = model.getNode(d.id);
        thisView.render();
        var d3txt = thisView.changeTextOfNode(thisView.gCircles.filter(function(dval){
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
      if (!this.$el.is(":visible") || document.activeElement !== document.body) { return; }

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
          if (confirm("remove node: " + selectedNode.get("title") + " from the graph?\nNote: ALL associated data will be removed")){
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
     * @Override
     * @return {boolean} true if the node is visible
     */
    isNodeVisible: function(node){
      return !node.get("isContracted"); // TODO add learned/hidden properties as well
    },

    /**
     * @Override
     * @return {boolean} true if the edge path is visible
     */
    isEdgeVisible: function(edge){
      return !edge.get("isContracted"); // TODO add learned/hidden properties as well
    },

    /**
     * @Override
     * include the given edge in the optimization placement?
     */
    includeEdgeInOpt: function (edge) {
      return !edge.get("isContracted");
    }

  }); // end GraphEditor definition

  return GraphEditor;

});
