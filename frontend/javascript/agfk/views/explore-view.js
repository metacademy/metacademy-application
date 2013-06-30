/**
 * This file contains the views and must be loaded after the models and collections
 */

// Global TODOS
// carefully refactor variables to distinguish nodes from tags
// -move summaries with node on translations
// -fully separate graph generation logic from view

(function(AGFK, Backbone, d3, $, Viz, _, undefined){
    /*
     * View for knowledge map in exploration mode
     */
    AGFK.ExploreView = (function(){

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
            expCrossClass: "expand-node",
            expCrossID: "expand-cross",
            hoveredClass: "hovered",
            clickedClass: "clicked",
            useExpandClass: "use-expand",
            nodeLearnedClass: "node-learned",
            nodeImplicitLearnedClass: "implicit-learned",
            dataHoveredProp: "data-hovered",
            checkClass: "checkmark",
            checkHoveredClass: "checkmark-hovered",
            checkNodeIdSuffix: "-check-g",
            summaryDivSuffix: "-summary-txt",
            summaryWrapDivSuffix: "-summary-wrap",
            summaryTextClass: "summary-text",
            summaryWrapClass: "summary-wrap",
            summaryLeftClass: "tleft",
            summaryRightClass: "tright",
            waitSummaryClass: "waiting-for-summary",
            justLeftClass: "just-left-node",
            locElemId: "invis-loc-elem", // invisible location element
            locElemClass: "invis-loc",
            // ----- rendering options ----- //
            defaultGraphDepth: 200, // default depth of graph
            defaultExpandDepth: 1, // default number of dependencies to show on expand
            defaultGraphOrient: "BT", // orientation of graph ("BT", "TB", "LR", or "RL")
            defaultNodeSepDist: 1.5, // separation of graph nodes
            defaultNodeWidth: 2.5, // diameter of graph nodes
            numCharLineDisplayNode: 9, // max number of characters to display per title line of graph nodes
            summaryWidth: 350, // px width of summary node (TODO can we move this to css and obtain the width after setting the class?)
            summaryArrowWidth: 32, // summary triangle width
            summaryArrowTop: 28, // top distance to triangle apex 
            summaryAppearDelay: 250, // delay before summary appears (makes smoother navigation)
            summaryHideDelay: 100,
            summaryFadeInTime: 50, // summary fade in time (ms)
            SQRT2DIV2: Math.sqrt(2)/2,
            exPlusWidth: 5.5, // px width of expand cross component
            edgePlusW: 28, // px distance of expand cross from circle edge
            maxZoomScale: 5, // maximum zoom-in level for graph
            minZoomScale: 0.05, //maximum zoom-out level for graph
            checkCircleR: 16, // radius of circle around "completed" check
            checkXOffset: 20, // px offset of checkmark from longest text element
            checkPath: "M -12,4 L -5,10 L 13,-6", // svg path to create check mark
            checkGScale: 0.7, // relative size of "completed" check group
            defaultCheckDist: 90 // default px offset if exact position cannnot be computed
        };
        pvt.summaryDisplays = {};

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
                AGFK.utils.simulate(d3node.node(), "mouseout", {
                    relatedTarget: evt.relatedTarget
                }); 
            });
        };
        
        /**
         * Add the check mark and associated properties to the given node
         */
        pvt.addCheckMark = function(d3node, svgSpatialInfo){
            var viewConsts = pvt.viewConsts,
                checkHoveredClass = viewConsts.checkHoveredClass,
                thisView = this,
                nodeId = d3node.attr("id"),
                mnode = thisView.model.get("nodes").get(nodeId),
                nodeLearnedClass = viewConsts.nodeLearnedClass;
            svgSpatialInfo = svgSpatialInfo || AGFK.utils.getSpatialNodeInfo(d3node.node());

            var chkG = d3node.append("g")
                    .attr("class", viewConsts.checkClass)
                    .attr("id", pvt.getCheckIdForNode.call(thisView, d3node))
                    .on("click", function() {
                        // stop the event from firing on the ellipse
                        d3.event.stopPropagation();
                        // change the learned status on the node model which will fire events changing the appropriate views
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
            
            // find the max width text element in box
            var maxTextLen = Math.max.apply(null, (d3node.selectAll("text")[0].map(function(itm){return itm.getComputedTextLength();}))),
                // TODO figure out better soluntion for prerendering
                maxTextLen = maxTextLen === 0 ? viewConsts.defaultCheckDist : maxTextLen;
            var chkX = svgSpatialInfo.cx - maxTextLen/2 - viewConsts.checkXOffset,
                chkY = svgSpatialInfo.cy;
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
                clickedClass = viewConsts.clickedClass,
                d3node = d3.select(nodeEl);

            d3node.classed(viewConsts.justLeftClass, false);
            if (d3node.classed(hoveredClass) || d3node.classed(clickedClass)){
                d3node.classed(hoveredClass, true);
                return false;
            }
            
            // add the appropriate class
            d3node.classed(hoveredClass, true);

            // add node summary
            pvt.attachNodeSummary.call(thisView, d3node);

            // add node-hoverables if not already present
            if (!d3node.attr(viewConsts.dataHoveredProp)) {
                // add checkmark if not present
                if (d3node.select("." + viewConsts.checkClass).node() === null){
                    pvt.addCheckMark.call(this, d3node, svgSpatialInfo);
                }
                var svgSpatialInfo = AGFK.utils.getSpatialNodeInfo(nodeEl),
                    // display expand shape if not expanded
                    expX = svgSpatialInfo.cx - viewConsts.exPlusWidth / 2,
                    expY = svgSpatialInfo.cy + svgSpatialInfo.ry - viewConsts.edgePlusW;
                if (d3node.select("." + viewConsts.checkClass).node() === null){
                    pvt.addCheckMark.call(this, d3node, svgSpatialInfo);
                }
                // Node expand cross TODO make an expandable/collapsable graph?
                // d3node.append("use")
                //     .attr("xlink:href", "#" + viewConsts.expCrossID)
                //     .attr("x", expX)
                //     .attr("y", expY)
                //     .attr("class", viewConsts.useExpandClass)
                //     .on("click", function() {
                //         // don't propagate click to lower level objects
                //         d3.event.stopPropagation();
                //         thisView.appendDepsToGraph(node.attr('id'));
                //     });
                d3node.attr(viewConsts.dataHoveredProp, true);
            }
        };

        /**
         * Remove mouse over properties from the explore nodes unless the node is clicked
         */
        pvt.nodeMouseOut = function(nodeEl) {
            var relTarget = d3.event.relatedTarget;
            // check if we're in a semantically related el
            if (!relTarget ||nodeEl.contains(relTarget) || relTarget.id.match(nodeEl.id)){
                return;
            }

            var thisView = this,
                d3node = d3.select(nodeEl),
                summId = pvt.getSummaryIdForDivWrap.call(thisView, d3node),
                viewConsts = pvt.viewConsts,
                hoveredClass = viewConsts.hoveredClass,
                justLeftClass = viewConsts.justLeftClass;

            if(d3node.classed(viewConsts.waitSummaryClass)){
                 d3node.classed(hoveredClass, false);
            }
            else{
                //remove hovered class (we left the node)
                d3node.classed(justLeftClass, true);
                // wait a bit before removing the summary
                window.setTimeout(function(){
                    if (pvt.summaryDisplays[summId] && !pvt.summaryDisplays[summId].$wrapDiv.hasClass(hoveredClass) && d3node.classed(justLeftClass)){
                        if (!d3node.classed(viewConsts.clickedClass)){
                            d3.select("#" + summId).remove(); // use d3 remove for x-browser support
                            delete pvt.summaryDisplays[summId];
                        }
                        d3node.classed(justLeftClass, false);
                        d3node.classed(hoveredClass, false);
                    }
                }, viewConsts.summaryHideDelay);
            }
        };

        /**
         * Add clicked to the node and remove the previous click state of lastNodeClicked TODO should we allow multiple clicked nodes?
         */
        pvt.nodeClick = function(nodeEl) {
            var thisView = this,
                node = d3.select(nodeEl),
                clickedClass = pvt.viewConsts.clickedClass;
            node.classed(clickedClass, function(){
                return !node.classed(clickedClass);
            });
        };

        /**
         * Return a dot string array from the entire model
         */
        pvt.getFullDSArr = function() {
            var dgArr = [],
                thisView = this;
            // add all node properties & edges
            this.model.get("nodes").each(function(node) {
                dgArr.unshift(pvt.fullGraphVizStr.call(thisView, node));
                node.get("dependencies").each(function(inlink) {
                    if (node.isUniqueDependency(inlink.get("from_tag"))) {
                        dgArr.push(inlink.getDotStr());
                    }
                });
            });
            return dgArr;
        };

        /**
         * Return a dot string array from the specified keyNode 
         * depth: desired depth of dot string
         * keyNode: root keynode, defaults to graph keynode (if exists, otherwise throws an error)
         * checkVisible: true will only add nodes that are not already visible, defaults to false
         */
        pvt.getDSFromKeyArr = function(depth, keyNode, checkVisible) {
            var dgArr = [],
                thisView = this,
                thisModel = thisView.model,
                thisNodes = thisModel.get("nodes"),
                curEndNodes = [keyNode]; // this should generalize easily to multiple end nodes
            _.each(curEndNodes, function(node) {
                if (!checkVisible || thisNodes.get(node.get("id")).getVisibleStatus()){
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

                        if (!checkVisible || depNode.getVisibleStatus()){
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
            return node.get("id") + ' [label="' + node.getNodeDisplayTitle(pvt.viewConsts.numCharLineDisplayNode) + '"' + optionStr + '];';
        };

        /**
         * Helper function to obtain checkmark element for the given node
         */
        pvt.getCheckIdForNode = function(node) {
            return pvt.getIdOfNodeType.call(this, node) + pvt.viewConsts.checkNodeIdSuffix;
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

            /**
             * Obtain initial kmap coordinates and render results
             */
            initialize: function() {
                // build initial graph based on input collection
                var thisView = this,
                    dotStr = thisView.collToDot(),
                    d3this = thisView.getd3El();
                thisView.svgGraph = thisView.createSvgGV(dotStr);
                thisView.initialSvg = true;
                
                thisView.listenTo(thisView.model.get("nodes"), "change:learnStatus", function(nodeId, status){
                    thisView.toggleNodeProps(d3this.select("#" + nodeId), status, "learned", d3this);
                });
                thisView.listenTo(thisView.model.get("nodes"), "change:implicitLearnStatus", function(nodeId, status){
                    thisView.toggleNodeProps(d3this.select("#" + nodeId), status, "implicitLearned", d3this);
                });
                
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
                // sort the svg such that the edges come before the nodes so mouseover on node doesn't activate edge
                var gdata = gelems[0].map(function(itm) {
                    return d3.select(itm).classed(nodeClass);
                });
                gelems.data(gdata).sort();
                // change id to title, remove title, then
                pvt.preprocessNodesEdges(gelems);
                d3this.select('g').selectAll("title").remove(); // also remove title from graph

                // make the svg canvas fill the entire enclosing element
                d3this.select('svg')
                    .attr('width', '100%')
                    .attr('height', '100%')
                    .attr('id', exploreSvgId);

                // remove unneeded background polygon from graphviz TODO make sure this is the correct polygon
                d3this.select("polygon").remove();
                
                // add reusable svg elements //
                // points to make a cross of width  exPlusWidth
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
                var defs = d3this.select("#" + exploreSvgId)
                        .insert("svg:defs", ":first-child");
                defs.append("polygon")
                    .attr("points", plusPts)
                    .attr("id", viewConsts.expCrossID)
                    .classed(viewConsts.expCrossClass, true);

                // add node properties
                this.addGraphProps(d3this);

                // -- post processing of initial SVG -- //

                // obtain orginal transformation since graphviz produces unnormalized coordinates
                var transprops = d3this.select("." + graphClass).attr("transform").match(/[0-9]+( [0-9]+)?/g),
                    otrans = transprops[2].split(" ").map(Number),
                    // front-and-center the key node if present
                    keyNode = this.model.get("keyNode");
                if (keyNode) {
                    var keyNodeLoc = AGFK.utils.getSpatialNodeInfo(d3this.select("#" + keyNode).node()),
                        swx = window.innerWidth,
                        swy = window.innerHeight;
                    // set x coordinate so key node is centered on screen
                    otrans[0] = swx / 2 - keyNodeLoc.cx;
                    otrans[1] = keyNodeLoc.ry + 5 - keyNodeLoc.cy;
                    d3this.select("." + graphClass)
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
                        .select("." + graphClass);

                // set the zoom scale
                dzoom.scaleExtent([viewConsts.minZoomScale, viewConsts.maxZoomScale]);
                var summaryDisplays = pvt.summaryDisplays,
                    nodeLoc,
                    d3event;
                // helper function to redraw svg graph with correct coordinates
                function redraw() {
                    // transform the graph
                    d3event = d3.event;
                    vis.attr("transform", "translate(" + d3event.translate + ")" + " scale(" + d3event.scale + ")");
                    // move the summary divs if needed
                    $.each(summaryDisplays, function(key, val){
                        nodeLoc = pvt.getSummaryBoxPlacement(val.d3node.node().getBoundingClientRect(), val.placeLeft);
                        val.$wrapDiv.css(nodeLoc);
                    });
                }
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
                    })
                    .on("click", function() {
                        pvt.nodeClick.call(thisView, this);
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
            },

            
            /**
             * Toggle propType properties for the given explore node
             * d3node: d3 selection for the given node
             * toggleOn: whether to toggle on (true) or off (false) the learned properties
             * propType: specify the property type: "learned" or "implicitLearned"
             * d3sel: d3selection with graph nodes/edges as children (defaults to thisView.getd3El()
             */
            toggleNodeProps: function(d3node, toggleOn, propType, d3Sel){
                var viewConsts = pvt.viewConsts,
                    thisView = this,
                    mnode = thisView.model.get("nodes").get(d3node.attr("id")),
                    addLearnProps = propType === "learned",
                    propClass = addLearnProps ? viewConsts.nodeLearnedClass : viewConsts.nodeImplicitLearnedClass,
                    hasCheck = d3node.select("." + viewConsts.checkClass).node() !== null;
                d3Sel = d3Sel || thisView.getd3El();

                // insert checkmark if needed
                if (addLearnProps && toggleOn && !hasCheck){
                    pvt.addCheckMark.call(thisView, d3node);
                }
                
                // toggle appropriate class for outlinks
                thisView.changeEdgesClass(mnode.get("outlinks"), propClass, toggleOn, d3Sel);
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
                var thisView = this;
                if (thisView.initialSvg) {
                    //initial render
                    thisView.$el.html(thisView.svgGraph);
                    thisView.initialRender();
                    thisView.initialSvg = false;
                } else {
                    // TODO handle graph updates
                }

                return thisView;
            },

            /**
             * Create dot string from the model
             * depth: depth from keyNode (if present); pvt.viewConsts.defaultGraphDepth
             * graphOrient: orientation of graph ("BT", "TB", "LR", or "RL"); default pvt.viewConsts.defaultGraphOrient
             * nodeWidth: width of node
             * nodeSep: node separation
             */
            collToDot: function(args){ //depth, graphOrient, nodeWidth, nodeSep) {
                var thisView = this,
                    viewConsts = pvt.viewConsts,
                    dgArr,
                    args = args || {},
                    depth = args.depth || viewConsts.defaultGraphDepth,
                    graphOrient = args.graphOrient || viewConsts.defaultGraphOrient,
                    nodeSep = args.nodeSep || viewConsts.defaultNodeSepDist,
                    nodeWidth = args.nodeWidth || viewConsts.defaultNodeWidth,
                    keyNode = args.keyNode || thisView.model.get("nodes").get(thisView.model.get("keyNode")),
                    remVisible = args.remVisible || false; // TODO describe these params

                if (thisView.model.get("keyNode")) {
                    dgArr = pvt.getDSFromKeyArr.call(this, depth, keyNode, remVisible);
                } else {
                    dgArr = pvt.getFullDSArr.call(this);
                }

                // include digraph options
                dgArr.unshift("rankdir=" + graphOrient);
                dgArr.unshift("nodesep=" + nodeSep); // encourage node separation TODO add as option        
                dgArr.unshift("node [shape=circle, fixedsize=true, width=" + nodeWidth + "];");

                return "digraph G{\n" + dgArr.join("\n") + "}";
            },
            
            /**
             * Append dependencies of the given node to the main graph
             */
            appendDepsToGraph: function(conNodeId, depth){
                var thisView = this,
                    viewConsts = pvt.viewConsts,
                    edgeClass = viewConsts.edgeClass,
                    nodeClass = viewConsts.nodeClass,
                    newElClass = "newel-class-tmp", // temporary class so d3 can find ndew elements
                    depth = depth || pvt.viewConsts.defaultExpandDepth,
                    args = {depth: depth || 1,
                            keyNode: thisView.model.get("nodes").get(conNodeId),
                            remVisible: true};

                var dotStr = thisView.collToDot(args);

                // generate dependency subgraph with connecting node
                var svgStr = thisView.createSvgGV(dotStr);
                var $newNEs = $(svgStr).find("." + edgeClass +  ", ." + nodeClass);
                // uses jquery to replace the preprocessNodesEdges function since d3 won't take existing content as input TODO think about a different structure
                var newnum = -1;
                $newNEs.each(function(num){
                    var $this = $(this);
                    $(this).attr("id", function(){
                        var $title = $(this.getElementsByTagName("title")[0]),
                            txtContent = $title.text();
                        $title.remove();
                        return txtContent;
                    });
                    newnum = $this.attr("id") === conNodeId ? num : newnum;
                });
                // assert(newnum > -1, "Could not find new element in jquery collection");
                // obtain transformation coordinates from connecting node
                var newConNode = $($newNEs[newnum]).find("ellipse"),
                    newCx = Number(newConNode.attr("cx")),
                    newCy = Number(newConNode.attr("cy"));

                var oldConNode = thisView.getd3El().select("#" + conNodeId).select("ellipse"),
                    oldCx = Number(oldConNode.attr("cx")),
                    oldCy = Number(oldConNode.attr("cy"));

                var transX = oldCx - newCx,
                    transY = oldCy - newCy;

                // translate the new elements appropriately and add them to the graph
                var $graphEl = $("." + viewConsts.graphClass);
                $newNEs.each(function(){
                    var $this = $(this);

                    if ($this.attr("id") !== conNodeId){
                        
                        // hack if-statement since jquery doesn't play nice with svg elements
                        if($this.attr("class") === edgeClass){
                            $this.find("path").attr("transform", "translate(" + transX + "," +  transY + ")"); // TODO we may want to actually change the coordinates
                            $this.find("polygon").attr("transform", "translate(" + transX + "," +  transY + ")"); // TODO we may want to actually change the coordinates
                            //$this.attr("class", $this.attr("class") + " " + newElClass);
                            $graphEl.prepend($this);
                        }
                        else if($this.attr("class") === nodeClass){
                            
                            $this.find("ellipse").attr("cx", function(){
                                return Number(this.getAttribute("cx")) + transX;
                            })
                                .attr("cy", function(){
                                    return Number(this.getAttribute("cy")) + transY;
                                });
                            $this.find("text").each(function(){
                                var $thisText = $(this);
                                $thisText.attr("x", Number($thisText.attr("x")) + transX)
                                    .attr("y", Number($thisText.attr("y")) + transY);
                            });
                            $this.attr("class", $this.attr("class") + " " + newElClass);                       
                            $graphEl.append($this);
                        }
                    }
                });
                
                // add node properties to new subgraph
                var d3els = d3.selectAll("." + newElClass);
                d3els.classed(newElClass, false);
                thisView.addGraphProps(d3els, true);

                // TODO do we need to update the d3this?
            },
            
            /**
             * Show the node summary in "hover box" next to the node
             */  
            showNodeSummary: function(node) {
                var thisView = this,
                    viewConsts = pvt.viewConsts,
                    // add content div
                    div = document.createElement("div");
                div.textContent = this.model.get("nodes").get(node.attr("id")).get("summary");
                div.id = pvt.getSummaryIdForDivTxt.call(thisView, node);
                var d3div = d3.select(div);
                d3div.classed(viewConsts.summaryTextClass, true);

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
                var $wrapDiv = $(wrapDiv),
                waitSummaryClass = viewConsts.waitSummaryClass;
                node.classed(waitSummaryClass, true);
                window.setTimeout(function(){
                    node.classed(waitSummaryClass, false);
                    if(node.classed(viewConsts.hoveredClass) || node.classed(viewConsts.clickedClass)){
                        $wrapDiv.appendTo("#" + viewConsts.viewId).fadeIn(viewConsts.summaryFadeInTime);
                    }
                }, viewConsts.summaryAppearDelay);

                // TODO listen for translated graphs and translate accordingly
                pvt.summaryDisplays[wrapDiv.id] = {"$wrapDiv": $wrapDiv, "d3node": node, "placeLeft": placeLeft};
                return $wrapDiv;
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
             * return the specified view constant
             */
            getViewConst: function(vc){
                return pvt.viewConsts[vc];
            }
        });
    })();
})(window.AGFK = window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {}, window.Backbone, window.d3, window.jQuery, window.Viz, window._);
