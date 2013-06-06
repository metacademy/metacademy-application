/**
 * This file contains the views and must be loaded after the models and collections
 */

// Global TODOS
// -fix hardcoded 10px summary display offset; produces strange results when zooming on graphs
// -move summaries with node on translations

/**
 * View constants -- TODO move these to main once complete or find a natural parameter in the view
 */

/*
 * View for knowledge map in exploration mode
 */
window.CKmapView = Backbone.View.extend({
    id: "kmview",

    /**
     * "Lookup table" for view naming schemes, placement dimensions, and classes
     */
    viewConsts: {
        // ----- class and id names ----- //   
        // WARNING some changes must be propagated to the css file 
        graphClass: "graph", // WARNING currently determined by graph generation -- chaning this property will not change the class
        nodeClass: "node", // WARNING currently determined by graph generation -- chaning this property will not change the class
        edgeClass: "edge", // WARNING currently determined by graph generation -- chaning this property will not change the class
        exploreSvgId: "explore-svg",
        expCrossClass: "expand-node",
        expCrossID: "expand-cross",
        hoveredClass: "hovered",
        clickedClass: "clicked",
        useExpandClass: "use-expand",
        nodeLearnedClass: "node-learned",
        dataHoveredProp: "data-hovered",
        checkClass: "checkmark",
        checkCircleClass: "checkmark-circle",
        checkHoveredClass: "checkmark-hovered",
        checkNodeIdSuffix: "-check-g",
        summaryDivSuffix: "-summary-txt",
        summaryWrapDivSuffix: "-summary-wrap",
        summaryTextClass: "summary-text",
        summaryWrapClass: "summary-wrap",
        summaryLeftClass: "tleft",
        summaryRightClass: "tright",
        // ----- rendering options ----- //
        defaultGraphDepth: 2, // default depth of graph
        defaultGraphOrient: "BT", // orientation of graph ("BT", "TB", "LR", or "RL")
        defaultNodeSepDist: 1.5, // separation of graph nodes
        defaultNodeWidth: 2.5, // diameter of graph nodes
        numCharLineDisplayNode: 10, // max number of characters to display per title line of graph nodes
        summaryWidth: 350, // px width of summary node (TODO can we move this to css and obtain the width after setting the class?)
        summaryAppearDelay: 250, // delay before summary appears (makes smoother navigation)
        summaryFadeInTime: 200, // summary fade in time (ms)
        exPlusWidth: 5.5, // px width of expand cross component
        edgePlusW: 28, // px distance of expand cross from circle edge
        maxZoomScale: 5, // maximum zoom-in level for graph
        minZoomScale: 0.05, //maximum zoom-out level for graph
        checkCircleR: 16, // radius of circle around "completed" check
        checkXOffset: 20, // px offset of checkmark from longest text element
        checkPath: "M -12,4 L -5,10 L 13,-6", // svg path to create check mark
        checkGScale: 0.7 // relative size of "completed" check group
    },

    /**
     * Maintain references to the user interactions with the view TODO move to the userState of the node wrapper collection
     */
    interactState: {
        lastNodeClicked: -1,
        lastNodeHovered: -1
    },

    /**
     * Obtain initial kmap coordinates and render results
     */
    initialize: function() {
        // build initial graph based on input collection
        var dotStr = this.collToDot();
        this.svgGraph = this.createSvgGV(dotStr);
        this.initialSvg = true;
    },

    /**
     * Initial rendering for view (necessary because of particular d3 use case)
     */
    initialRender: function() {
        var thisView = this;
        var d3this = this.getd3El(); //d3.select(this.$el[0]);
        var gelems = d3this.selectAll("." + this.viewConsts.nodeClass + ", ." + this.viewConsts.edgeClass);
        // sort the svg such that the edges come before the nodes so mouseover on node doesn't activate edge
        var gdata = gelems[0].map(function(itm) {
            return d3.select(itm).classed(thisView.viewConsts.nodeClass);
        });
        gelems.data(gdata).sort();
        // change id to title, remove title, then
        gelems.attr('id', function() {
            return d3.select(this).select('title').text();
        });
        gelems.selectAll("title").remove(); // remove the title for a cleaner hovering experience
        d3this.select('g').selectAll("title").remove(); // also remove title from graph

        // make the svg canvas fill the entire enclosing element
        d3this.select('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('id', this.viewConsts.exploreSvgId);

        // remove unneeded background polygon
        d3this.select("polygon").remove();

        // add reusable svg elements //
        // points to make a cross of width  exPlusWidth 
        var exPlusWidth = this.viewConsts.exPlusWidth;
        var plusPts = "0,0 " +
            exPlusWidth + ",0 " +
            exPlusWidth + "," + exPlusWidth + " " +
            (2 * exPlusWidth) + "," + exPlusWidth + " " +
            (2 * exPlusWidth) + "," + (2 * exPlusWidth) + " " +
            exPlusWidth + "," + (2 * exPlusWidth) + " " +
            exPlusWidth + "," + (3 * exPlusWidth) + " " +
            "0," + (3 * exPlusWidth) + " " +
            "0," + (2 * exPlusWidth) + " " +
            (-exPlusWidth) + "," + (2 * exPlusWidth) + " " +
            (-exPlusWidth) + "," + exPlusWidth + " " +
            "0," + exPlusWidth + " " +
            "0,0";


        // add reusable svg elements to defs
        d3this.select("#" + this.viewConsts.exploreSvgId)
            .insert("svg:defs", ":first-child")
            .append("polygon")
            .attr("points", plusPts)
            .attr("id", this.viewConsts.expCrossID)
            .classed(this.viewConsts.expCrossClass, true);

        // add node properties
        this.addNodeProps(d3this);

        // -- post processing of initial SVG -- //

        // obtain orginal transformation since graphviz produces unnormalized coordinates
        var transprops = d3this.select("." + this.viewConsts.graphClass).attr("transform").match(/[0-9]+( [0-9]+)?/g);
        var otrans = transprops[2].split(" ").map(Number);
        // front-and-center the key node if present
        var keyNode = this.model.get("keyNode");
        if (keyNode) {
            var keyNodeLoc = getSpatialNodeInfo(d3this.select("#" + keyNode).node());
            var swx = window.innerWidth;
            var swy = window.innerHeight;
            // set x coordinate so key node is centered on screen
            otrans[0] = swx / 2 - keyNodeLoc.cx;
            otrans[1] = keyNodeLoc.ry + 5 - keyNodeLoc.cy;
            d3this.select("." + this.viewConsts.graphClass)
                .attr("transform", "translate(" + otrans[0] + "," + otrans[1] + ")");
        }

        // add original transformation to the zoom behavior
        var dzoom = d3.behavior.zoom();
        dzoom.translate(otrans);

        // make graph zoomable/translatable
        var vis = d3this.select("svg")
            .attr("pointer-events", "all")
            .attr("viewBox", null)
            .call(dzoom.on("zoom", redraw))
            .select("." + this.viewConsts.graphClass);

        // set the zoom scale
        dzoom.scaleExtent([this.viewConsts.minZoomScale, this.viewConsts.maxZoomScale]);

        // helper function to redraw svg graph with correct coordinates

        function redraw() {
            // transform the graph
            vis.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        }
    },

    /**
     * Use D3 to add dynamic properties to the nodes
     */
    addNodeProps: function(d3selection) {
        var thisView = this;
        var d3this = d3selection || this.getd3El();

        d3this.selectAll("." + thisView.viewConsts.nodeClass)
            .on("mouseover", function() {
                thisView._nodeMouseOver(this);
            })
            .on("mouseout", function() {
                thisView._nodeMouseOut(this);
            })
            .on("click", function() {
                thisView._nodeClick(this);
            });
    },

    /**
     * Renders the kmap using the supplied features collection
     */
    render: function() {
        if (this.initialSvg) {
            //initial render
            this.$el.html(this.svgGraph);
            this.initialRender();
            this.initialSvg = false;
        } else {
            // TODO
        }

        return this;
    },

    /**
     * Create dot string from the model
     * depth: depth from keyNode (if present); this.viewConsts.defaultGraphDepth
     * graphOrient: orientation of graph ("BT", "TB", "LR", or "RL"); default this.viewConsts.defaultGraphOrient
     * nodeWidth: width of node
     * nodeSep: node separation
     */
    collToDot: function(depth, graphOrient, nodeWidth, nodeSep) {
        depth = depth || this.viewConsts.defaultGraphDepth;
        graphOrient = graphOrient || this.viewConsts.defaultGraphOrient;
        nodeSep = nodeSep || this.viewConsts.defaultNodeSepDist;
        nodeWidth = nodeWidth || this.viewConsts.defaultNodeWidth;

        var dgArr;
        if (this.model.get("keyNode")) {
            dgArr = this._getDSFromKeyArr(depth);
        } else {
            dgArr = this._getFullDSArr();
        }

        // include digraph options
        dgArr.unshift("rankdir=" + graphOrient);
        dgArr.unshift("nodesep=" + nodeSep); // encourage node separation TODO add as option        
        dgArr.unshift("node [shape=circle, fixedsize=true, width=" + nodeWidth + "];");

        return "digraph G{\n" + dgArr.join("\n") + "}";
    },

    /**
     * Show the node summary in "hover box" next to the node
     */  
    showNodeSummary: function(node) {
        var thisView = this;
        // add content div
        var div = document.createElement("div");
        div.textContent = this.model.get("nodes").get(node.attr("id")).get("summary");
        div.id = this._getSummaryIdForDivTxt(node);
        d3div = d3.select(div);
        d3div.classed(this.viewConsts.summaryTextClass, true);

        // add wrapper div so we can use "overflow" pseudo elements
        var wrapDiv = document.createElement("div");
        d3wrapDiv = d3.select(wrapDiv);
        wrapDiv.id = this._getSummaryIdForDivWrap(node);
        d3wrapDiv.classed(this.viewConsts.summaryWrapClass, true);

        // place the summary box on the side with the most screen real-estate
        var nodeRect = node.node().getBoundingClientRect();
        var placeLeft = nodeRect.left + nodeRect.width / 2 > window.innerWidth / 2;
        d3wrapDiv.classed(placeLeft ? this.viewConsts.summaryRightClass : this.viewConsts.summaryLeftClass, true);
        wrapDiv.appendChild(div);

        // calculate location of box
        var shiftDiff = placeLeft ? -this.viewConsts.summaryWidth + nodeRect.width * 0.03 : nodeRect.width * 0.97;
        wrapDiv.style.left = (nodeRect.left + shiftDiff) + "px";
        wrapDiv.style.top = nodeRect.top + "px";
        wrapDiv.style.width = this.viewConsts.summaryWidth + "px";
        wrapDiv.style.display = "none";

        // add box to document with slight fade-in
        $wrapDiv = $(wrapDiv);
        $wrapDiv .delay(200).queue(function(){
            if(node.classed(thisView.viewConsts.hoveredClass) || node.classed(thisView.viewConsts.clickedClass)){
                $wrapDiv.appendTo(document.body).fadeIn(thisView.viewConsts.summaryFadeInTime);
            }
            $(this).dequeue();
        });

        // TODO listen for translated graphs and translate accordingly

        return wrapDiv;
    },

    /**
     * Return an SVG representation of graph given a dot string
     */
    createSvgGV: function(dotStr) {
        return Viz(dotStr, 'svg');
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
     * Add visual mouse over properties to the explore nodes
     */
    _nodeMouseOver: function(nodeEl) {
        // Node mouseover: display node info and expand/contract options
        var thisView = this;
        var node = d3.select(nodeEl);

        // make sure we're not already hovered
        if (node.classed(thisView.viewConsts.hoveredClass) || node.classed(thisView.viewConsts.clickedClass)) {
            node.classed(thisView.viewConsts.hoveredClass, true);
            return;
        }

        // add the appropriate class
        node.classed(thisView.viewConsts.hoveredClass, true);

        // update last hovered node
        thisView.interactState.lastNodeHovered = node;

        // display the node summary
        var wrapDiv = thisView.showNodeSummary(node);

        // add listener to node summary so mouseouts trigger mouseout on node
        $(wrapDiv).on("mouseleave", function(evt) {
            window.simulate(node.node(), "mouseout", {
                relatedTarget: evt.relatedTarget
            }); 
        });

        // add node-hoverables if not already present
        if (!node.attr(thisView.viewConsts.dataHoveredProp)) { // TODO check if the node is already expanded
            var svgSpatialInfo = window.getSpatialNodeInfo(nodeEl);

            // display expand shape if not expanded
            var expX = svgSpatialInfo.cx - thisView.viewConsts.exPlusWidth / 2;
            var expY = svgSpatialInfo.cy + svgSpatialInfo.ry - thisView.viewConsts.edgePlusW;
            node.append("use")
                .attr("xlink:href", "#" + thisView.viewConsts.expCrossID)
                .attr("x", expX)
                .attr("y", expY)
                .attr("class", thisView.viewConsts.useExpandClass)
                .on("click", function() {
                    // don't propagate click to lower level objects
                    d3.event.stopPropagation();
                });

            // display checkmark
            var chkG = node.append("g")
                .attr("id", thisView._getCheckIdForNode(node))
                .on("click", function() {
                    // add/remove appropriate classses and entry from userData
                    var addClick = !node.classed(thisView.viewConsts.nodeLearnedClass);
                    node.classed(thisView.viewConsts.nodeLearnedClass, addClick);
                    thisView.model.get("userData")
                        .updateLearnedNodes(node.attr("id"), addClick);
                    // stop the event from firing on the ellipse
                    d3.event.stopPropagation();
                })
                .on("mouseover", function() {
                    d3.select(this).classed(thisView.viewConsts.checkHoveredClass, true);
                })
                .on("mouseout", function() {
                    d3.select(this).classed(thisView.viewConsts.checkHoveredClass, false);
                });
            chkG.append("circle")
                .attr("r", thisView.viewConsts.checkCircleR)
                .classed(thisView.viewConsts.checkCircleClass, true);
            chkG.append("path")
                .attr("d", thisView.viewConsts.checkPath)
                .attr("class", thisView.viewConsts.checkClass);
            
            // find the max width text element in box
            var maxTextLen = Math.max.apply(null, (node.selectAll("text")[0].map(function(itm){return itm.getComputedTextLength();})));
            var chkX = svgSpatialInfo.cx - maxTextLen/2 - thisView.viewConsts.checkXOffset;
            var chkY = svgSpatialInfo.cy;
            chkG.attr("transform", 
                      "translate(" + chkX + "," + chkY + ") "
                      + "scale(" + thisView.viewConsts.checkGScale + ")");

            node.attr(thisView.viewConsts.dataHoveredProp, true);
        }
        // else make the hoverables visible
        else {
            node.select("." + thisView.viewConsts.useExpandClass).attr("visibility", "visible");
            node.select("#" + thisView._getCheckIdForNode(node)).attr("visibility", "visible");
        }
    },

    /**
     * Remove mouse over properties from the explore nodes unless the node is clicked
     */
    _nodeMouseOut: function(nodeEl) {
        var relTarget = d3.event.relatedTarget;
        if (!relTarget) { 
            return;
        }
        // check if we're outside of the node but not in a semantically related element
        if (!nodeEl.contains(relTarget) && !relTarget.id.match(nodeEl.id)){
            var thisView = this;
            var node = d3.select(nodeEl);

            //remove hovered class
            node.classed(thisView.viewConsts.hoveredClass, false);

            // remove visual properties unless node is clicked
            if (!node.classed(thisView.viewConsts.clickedClass)) {
                if (!node.classed(thisView.viewConsts.nodeLearnedClass)) {
                    node.select("#" + thisView._getCheckIdForNode(node)).attr("visibility", "hidden");
                }
                node.select("." + thisView.viewConsts.useExpandClass).attr("visibility", "hidden");
                d3.select("#" + thisView._getSummaryIdForDivWrap(node)).remove(); // use d3 remove for x-browser support
            }
        }
    },

    /**
     * Add clicked to the node and remove the previous click state of lastNodeClicked TODO should we allow multiple clicked nodes?
     */
    _nodeClick: function(nodeEl) {
        var thisView = this;
        var node = d3.select(nodeEl);

        node.classed(thisView.viewConsts.clickedClass, true);
        if (thisView.interactState.lastNodeClicked === -1) {
            thisView.interactState.lastNodeClicked = node;
        } else {
            thisView.interactState.lastNodeClicked.classed(thisView.viewConsts.clickedClass, false);
            if (node.attr("id") === thisView.interactState.lastNodeClicked.attr("id")) {
                thisView.interactState.lastNodeClicked = -1;
            } else {
                // trigger mouseout event on last node
                window.simulate(thisView.interactState.lastNodeClicked.node(), "mouseout");
                thisView.interactState.lastNodeClicked = node;
            }
        }
    },



    /**
     * Return a dot string array from the entire model
     */
    _getFullDSArr: function() {
        var dgArr = [];
        var thisView = this;
        // add all node properties & edges
        this.model.get("nodes").each(function(node) {
            dgArr.unshift(thisView._fullGraphVizStr(node));
            node.get("dependencies").each(function(inlink) {
                if (node.isUniqueDependency(inlink.get("from_tag"))) {
                    dgArr.push(inlink.getDotStr());
                }
            });
        });
        return dgArr;
    },

    /**
     * Return a dot string array from keyNode and specified depth
     */
    _getDSFromKeyArr: function(depth) {
        var dgArr = [];
        var thisView = this;
        // build graph of appropriate depth from given keyNode
        var curEndNodes = [thisView.model.get("nodes").get(thisView.model.get("keyNode"))]; // this should generalize easily to multiple end nodes, if desired
        _.each(curEndNodes, function(node) {
            dgArr.unshift(thisView._fullGraphVizStr(node));
        });

        // This is essentially adding nodes via a breadth-first search to the desired dependency depth
        // for each dependency depth level...
        var addedNodes = {};
        for (var curDep = 0; curDep < depth; curDep++) {
            // obtain number of nodes at given depth
            var cenLen = curEndNodes.length;
            // iterate over the nodes
            while (cenLen--) {
                // grab a specific node at that depth
                var node = curEndNodes.shift();
                // for each unqiue dependency for the specific node...
                _.each(node.getUniqueDependencies(), function(depNodeId) {
                    // grab the dependency node
                    var depNode = thisView.model.get("nodes").get(depNodeId);
                    // add node strings to the front of the dgArr
                    dgArr.unshift(thisView._fullGraphVizStr(depNode));
                    // add edge string to the end
                    dgArr.push(node.get("dependencies").get(depNodeId + node.get("id")).getDotStr());
                    // then add dependency to the end of curEndNodes if it has not been previously added
                    if (!addedNodes.hasOwnProperty(depNodeId)) {
                        curEndNodes.push(depNode);
                        addedNodes[depNodeId] = true;
                    }
                });
            }
        }
        return dgArr;

    },

    /**
     * Return full string representation of a node for graphviz
     */
    _fullGraphVizStr: function(node, options) {
        var optionStr = "";
        if (options) {
            for (var opt in options) {
                if (options.hasOwnProperty(opt)) {
                    optionStr += "," + opt + "=" + options[opt];
                }
            }
        }
        return node.get("id") + ' [label="' + node.getNodeDisplayTitle(this.viewConsts.numCharLineDisplayNode) + '"' + optionStr + '];';
    },

    /**
     * Helper function to obtain checkmark element for the given node
     */
    _getCheckIdForNode: function(node) {
        return this._getIdOfNodeType(node) + this.viewConsts.checkNodeSuffix;
    },

    /**
     * Helper function to obtain id of summary txt div for a given node in the exporation view
     */
    _getSummaryIdForDivTxt: function(node) {
        return this._getIdOfNodeType(node) + this.viewConsts.summaryDivSuffix;
    },

    /**
     * Helper function to obtain id of wrapper div of summary txt for a given node in the exporation view
     */
    _getSummaryIdForDivWrap: function(node) {
        return this._getIdOfNodeType(node) + this.viewConsts.summaryWrapDivSuffix;
    },

    /**
     * Get id of node element (d3, dom, or model)
     */
    _getIdOfNodeType: function(node) {
        var nodeFun = node.attr || node.getAttribute || node.get;
        return nodeFun.call(node, "id");
    }

});
