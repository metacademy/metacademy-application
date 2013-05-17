/**
* This file contains the views and must be loaded after the models and collections
*/

/**
* View for knowledge map in exploration mode
*/
window.CKmapView = Backbone.View.extend({
    id: "kmview",

    /**
    * Obtain initial kmap coordinates and render results
    */
    initialize: function(){
        // build initial graph based on input collection
        var dotStr = this.collToDot();
        this.svgGraph = this.createSvgGV(dotStr);
        this.initialSvg = true;
    },

    /**
    * Initial rendering for view (necessary because of particular d3 use case)
    */
    initialRender: function(){
        var d3this = d3.select(this.$el[0]);
        var gelems = d3this.selectAll('.node,.edge');
        // sort the svg such that the edges come before the nodes so mouseover on node doesn't activate edge
        var gdata = gelems[0].map(function(itm) {
            return d3.select(itm).attr('class') === 'node';
        });
        gelems.data(gdata).sort();
        // change id to title, remove title, then
        gelems.attr('id', function () {
            return d3.select(this).select('title').text();
        });
        gelems.selectAll("title").remove(); // remove the title for a cleaner hovering experience
        d3this.select('g').selectAll("title").remove(); // also remove title from graph

        // make the svg canvas fill the entire enclosing element
        d3this.select('svg').attr('width', '100%');
        d3this.select('svg').attr('height', '100%');

        // add node properties
        this.addNodeProps(d3this);

        // -- post processing on initial SVG -- //

        // obtain orginal transformation since graphviz produces unnormalized coordinates
        var transprops = d3this.select(".graph").attr("transform").match(/[0-9]+( [0-9]+)?/g);
        var otrans = transprops[2].split(" ").map(Number);
        var dzoom = d3.behavior.zoom();
        dzoom.translate(otrans);

        // make graph zoomable/translatable
        var vis = d3this.select("svg")
        .attr("pointer-events", "all")
        .attr("viewBox", null)
        .call(dzoom.on("zoom", redraw))
        .select(".graph");

        // helper function to redraw svg graph with correct coordinates
        function redraw() {
            vis.attr("transform",
                "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        }
    },

    /**
    * Use D3 to add dynamic properties to the nodes
    */
    addNodeProps: function(d3this){
        var lastNode = -1;
        // var vmodel = this.model;
        d3this.selectAll(".node")
        .on("mouseover", function () {
            
            // add hover color if not clicked
            var node = d3.select(this);
            node.select("ellipse").classed("hovered", function(){
                return !this.classList.contains("clicked");
            });



            if (!node.select(".expand-node")[0][0]){ // TODO check if the node is already expanded
                // TODO cache the svg generation
            // display down arrow if not expanded down
            var circEl = this.getElementsByTagName("ellipse")[0];
            var lxval = Number(circEl.getAttribute("cx"));
            var lyval = Number(circEl.getAttribute("cy"));
            var yr = Number(circEl.getAttribute("ry"));
            var xr = Number(circEl.getAttribute("rx"));
            var plusW = 5;
            var xorig = lxval - plusW/2;
            var yorig = lyval + yr - 24; // - the distance from circle edge
            var plusPts = (xorig) + "," + (yorig) + " " +
                          (xorig + plusW) + "," + (yorig) + " " +
                          (xorig + plusW) + "," + (yorig + plusW) + " " +
                          (xorig + 2*plusW) + "," + (yorig + plusW) + " " +
                          (xorig + 2*plusW) + "," + (yorig + 2*plusW) + " " +
                          (xorig + plusW) + "," + (yorig + 2*plusW) + " " +
                          (xorig + plusW) + "," + (yorig + 3*plusW) + " " +
                          (xorig) + "," + (yorig + 3*plusW) + " " +
                          (xorig) + "," + (yorig + 2*plusW) + " " +
                          (xorig -  plusW) + "," + (yorig + 2*plusW) + " " +
                          (xorig -  plusW) + "," + (yorig + plusW) + " " +
                          (xorig) + "," + (yorig + plusW) + " " +
                          (xorig) + "," + (yorig);
            node.append("polygon")
            .attr("points", plusPts)
            .classed("expand-node node", true)
            .on("click", function(){alert("happy!");});
            //     var imgWH = 14;
            //      node.append("image")
            //      .attr("xlink:href", window.STATIC_URL + "images/expand.png")
            //      .attr("x", String(lxval - imgWH/2))
            //      .attr("y", String(lyval + yr*3/5))
            //      .attr("height", String(imgWH))
            //      .attr("width", String(imgWH))
            //      .attr("class", "expand-node")
            //      .on("click", function(){alert("happy!");});
            }
            
        })
        .on("mouseout", function () {
            var node = d3.select(this);
            node.select("ellipse").classed("hovered", false);
            if (!node.select('.clicked')[0][0]){
            node.select(".expand-node").remove();
        }
        })
        .on("click", function (d) {
            var thisNode = d3.select(this);
            thisNode.select("ellipse")
            .classed('clicked',function(){
                return !this.classList.contains("clicked");
            });
            if (lastNode == -1){
                lastNode = thisNode;
            }
            else{
                lastNode = lastNode.attr('id') === thisNode.attr('id') ? -1 : thisNode;
            }
        });
    },

    /**
    * Renders the kmap using the supplied features collection
    */
    render: function() {
        if (this.initialSvg){
            //initial render
            this.$el.html(this.svgGraph);
            this.initialRender();
            this.initialSvg = false;
        }
        else{
           // TODO
       }

       return this;
   },

    /**
    * Create dot string from the model
    * depth: depth from keyNode (if present)
    * bottomUp: have dependencies below the given nodes
    */
    collToDot: function(depth, bottomUp, nodeSep){

        depth = depth || window.DEFAULT_DEPTH;
        bottomUp = bottomUp || window.DEFAULT_IS_BT;
        nodeSep = nodeSep || window.DEFAULT_NODE_SEP;

        var dgArr;
        if (this.model.get("keyNode")){
            dgArr = this._getDSFromKeyArr(depth);
        }
        else{
            dgArr = this._getFullDSArr();
        }

        // include digraph options
        if (bottomUp) {dgArr.unshift("rankdir=BT");}
        dgArr.unshift("nodesep=" + nodeSep); // encourage node separation TODO add as option
        if (bottomUp) {dgArr.unshift('node [shape=circle, fixedsize=true, width=2];');}
        // dgArr.unshift("node [shape=note]");

        return "digraph G{\n" + dgArr.join("\n") + "}";
    },

    /**
    * Create SVG representation of graph given a dot string
    */
    createSvgGV: function(dotStr){
        return Viz(dotStr, 'svg');
    },

    /**
    * Close and unbind views to avoid memory leaks TODO make sure to unbind any listeners
    */
    close: function(){
      this.remove();
      this.unbind();
  },

      /**
    * Return a dot string array from the entire model
    */
    _getFullDSArr: function(){
        var dgArr = [];
        // add all node properties & edges
        this.model.get("nodes").each(
            function(node){
                dgArr.unshift(node.get("id") + ' [label="' + node.getNodeDisplayTitle() + '"];');
                node.get("dependencies").each(
                    function(inlink){
                        if (node.isUniqueDependency(inlink.get("from_tag"))){
                            dgArr.push(inlink.getDotStr());
                        }
                });
            }
        );
        return dgArr;
    },

    /**
    * Return a dot string array from keyNode and specified depth
    */
    _getDSFromKeyArr: function(depth){
        var dgArr = [];
        var thisView = this;
        // build graph of appropriate depth from given keyNode
        var curEndNodes = [this.model.get("nodes").get(this.model.get("keyNode"))]; // this should generalize easily to multiple end nodes, if desired
        _.each(curEndNodes, function(node){
            dgArr.unshift(thisView._fullGraphVizStr(node));
        });

        // This is essentially adding nodes via a bredth-first search to the desired dependency depth
        // for each dependency depth level...
        var addedNodes = {};
        for(var curDep = 0; curDep < depth; curDep++){
            // obtain number of nodes at given depth
            var cenLen = curEndNodes.length;
            // iterate over the nodes
            while(cenLen--){
                // grab a specific node at that depth
                var node = curEndNodes.shift();
                // for each unqiue dependency for the specific node...
                _.each(node.getUniqueDependencies(), function(depNodeId){
                        // grab the dependency node
                        var depNode = thisView.model.get("nodes").get(depNodeId);
                        // add node strings to the front of the dgArr
                        dgArr.unshift(thisView._fullGraphVizStr(depNode));
                        // add edge string to the end
                        dgArr.push(node.get("dependencies").get(depNodeId + node.get("id")).getDotStr());
                        // then add dependency to the end of curEndNodes if it has not been previously added
                        if (!addedNodes.hasOwnProperty(depNodeId)){
                            curEndNodes.push(depNode);
                            addedNodes[depNodeId] = true;
                        }
                    }
                );
            }
        }
        return dgArr;

    },

    /**
    * Return full string representation of a node for graphviz
    */
    _fullGraphVizStr: function(node){
        return node.get("id") + ' [label="' + node.getNodeDisplayTitle() + '"];';
    }
});