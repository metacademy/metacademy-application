/* 
This file will contain the central mv* framework for the AGFK learning, exploration, and content-submission.
After initial development, the contents of this file may be placed into an standard MV* file heirarchy, 
e.g. models/node.js, views/comprehension-view.js, etc
*/

(function(Backbone, Viz){
"use strict"; // TODO use functional form of strict mode after initial development




/* UTILS - TODO move to utils file */

/**
* Wrap a long string to avoid elongated graph nodes.
*/
function wrapNodeText(s, width){
    if (!s) {return '';}

    var parts = s.split(" ");
    var result = '';
    var total = 0;
    for (var i = 0; i < parts.length; i++){
        result += parts[i];
        total += parts[i].length;
        if (total > width){
            result += '\\n';
            total = 0;
        }
        else{
            result += " ";
            total += 1;
        }
    }
    return result;
}

/*****************************/
/* -------- MODELS --------- */
/*****************************/

/**
* Comprehension question model
*/
window.CQuestion = Backbone.Model.extend({
    /**
    * default values -- underscore attribs used to match data from server
    */
    defaults: function () {
        return {
            text: "",
            node: null
        };
    }
});


/**
* Learning resource model
*/
window.CResource = Backbone.Model.extend({
    listFields: ['authors', 'dependencies', 'mark', 'extra', 'note'],

    /**
    * default values -- attributes match possible data from server
    */
    defaults: function () {
        return {
            title: "",
            location: "",
            url: "",
            node: null,
            resource_type: "",
            free: 0,
            edition: "",
            authors: [],
            dependencies: [],
            mark: [],
            extra: [],
            note: []
        };
    }
});

/**
* general directed edge model
*/
window.CDirectedEdge = Backbone.Model.extend({

    /**
    * default values -- underscore attribs used to match data from server
    */
    defaults: function () {
        return {
            from_tag: "",
            to_tag: "",
            reason: "",
            visible: false
        };
    },

    /**
    * return a dot (graphviz) representation of the edge
    */
    getDotStr: function(){
        if (this.get("from_tag")){
            return this.get("from_tag") + "->" + this.get("to_tag") + ';';
        }
        else{
            return "";
        }
    }
});


/**
* CNode: node model that encompasses several collections and sub-models
*/
window.CNode = Backbone.Model.extend({
    collFields: ["questions", "dependencies", "outlinks", "resources"], // collection fields
    txtFields: ["id", "title", "summary", "pointers"], // text fields
    boolFields: ["visible", "learned"], // boolean fields

    /**
    * all possible attributes are present by default
    */
    defaults: function () {
        return {
            title: "",
            id: "",
            summary: "",
            pointers: "",
            questions: new CQuestionCollection(),
            dependencies: new CDirectedEdgeCollection(),
            outlinks: new CDirectedEdgeCollection(),
            resources: new CResourceCollection(),
            visible: false,
            learned: false
        };
    },

    /**
    *  parse the incoming server data
    */
    parse: function (resp, xhr) {
        // check if we have a null response from the server
        if (resp === null) {
            return {};
        }
        var output = this.defaults();
        // ---- parse the text values ---- //
        var i = this.txtFields.length;
        while (i--) {
            var tv = this.txtFields[i];
            if (resp[tv]) {
                output[tv] = resp[tv];
            }
        }
        // ---- parse the collection values ---- //
        i = this.collFields.length;
        while (i--) {
            var cv = this.collFields[i];
            output[cv].parent = this;
            if (resp[cv]) {
                output[cv].add(resp[cv]);
            }
        }
        return output;
    },

    /**
    * intially populate the model with all present collection, boolean and text values
    * bind changes from collection such that they trigger changes in the original model
    */
    initialize: function () {
        var model = this;
        // changes in attribute collections should trigger a change in the node model
        var i = this.collFields.length;
        while (i--) {
            var cval = this.collFields[i];
            this.get(cval).bind("change", function () {
                model.trigger("change", cval);
            });
        }
        this.bind("change", function () {
            this.save();
        });
    },

    /**
    * returns and caches the node display title
    */
    getNodeDisplayTitle: function(){
        if (!this.nodeDisplayTitle){
            var title = this.title || this.id.replace(/_/g, " ");
            this.nodeDisplayTitle = wrapNodeText(title, 12);
        }
        return this.nodeDisplayTitle;
    },

    /**
    * Check if ancestID is an ancestor of this node
    */
    isAncestor: function(ancestID){
        if (!this.ancestors){
            this.getAncestors(true);
        }
        return this.ancestors.hasOwnProperty(ancestID);
    },

    /**
    * Obtain (and optionally return) a list of the ancestors of this node 
    * side effect: creates a list of unique dependencies (dependencies not present as an 
    * ancestor of another dependency) which is stored in this.uniqueDeps
    */
    getAncestors: function(noReturn){
        if (!this.ancestors){
            var ancests = {};
            var coll = this.collection;
            this.get("dependencies").each(function(dep){
                var depNode = coll.get(dep.get("from_tag"));
                var dAncests = depNode.getAncestors();
                for (var dAn in dAncests){
                    if(dAncests.hasOwnProperty(dAn)){
                        ancests[dAn] = 1;
                    }
                }
            });

            // create list of unique dependencies
            var uniqueDeps = {};
            this.get("dependencies").each(function(dep){
                var dtag = dep.get("from_tag");
                if (!ancests.hasOwnProperty(dtag)){
                    uniqueDeps[dtag] = 1;
                }
                ancests[dtag] = 1;
            });
                this.uniqueDeps = uniqueDeps;
                this.ancestors = ancests;
            }

            if (!noReturn){
                return this.ancestors;
            }
    },

    /**
    * Get a list of unqiue dependencies (dependencies not present as an 
    * ancestor of another dependency)
    */
    getUniqueDependencies: function(noReturn){
        if (!this.uniqueDeps){ this.getAncestors(true); }
        if (!noReturn){
            return this.uniqueDeps;
        }
    },

    /**
    * Check if depID is a unique dependency (dependencies not present as an 
    * ancestor of another dependency)
    */
    isUniqueDependency: function(depID){
        if (!this.uniqueDeps){ this.getUniqueDependencies(true); }
        return this.uniqueDeps.hasOwnProperty(depID);
    }
});


/*****************************/
/* ------ COLLECTIONS ------ */
/*****************************/

/**
* collection of resource models
*/
window.CResourceCollection = Backbone.Collection.extend({
    model:CResource
});


/**
* Collection of directed edge models
*/
window.CDirectedEdgeCollection = Backbone.Collection.extend({
    model:CDirectedEdge
});


/**
* Collection of question models
*/
window.CQuestionCollection = Backbone.Collection.extend({
    model:CQuestion
});


/**
* Collection of node models
*/
window.CNodeCollection = Backbone.Collection.extend({
    model: CNode,
    url: function(){
        return window.CONTENT_SERVER + "/nodes" + (this.ncoll ? "/" + this.ncoll + '?set=map' : "");
    },

    /**
    * parse the incoming json data
    */
    parse:function (response) {
        var ents = [];
        for (var key in response.nodes) {
            ents.push(_.extend(response.nodes[key],{id: key})); // TODO change once id is generated server-side
        }
        return ents;
    }
});


/*****************************/
/* --------- VIEWS --------- */
/*****************************/

/**
* View for knowledge map in exploration mode
*/
window.KmapView = Backbone.View.extend({
    id: "kmview",

    /**
    * Obtain initial kmap coordinates and render results
    */
    initialize: function(){
        // build initial graph based on input collection
        var getDotStr = this.collToDot(this.model);
        this.svgGraph = this.createSvgGV(getDotStr);
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
    * Use D3 to add dynamic properties to graph nodes
    */
    addNodeProps: function(d3this){
        var last_node = -1;
        // var vmodel = this.model;
        d3this.selectAll(".node")
        .on("mouseover", function () {
            var node = d3.select(this);
            if (node.attr('clicked') === null) {
                node.select('ellipse').attr('fill', '#E6EEEE');
            }
        })
        .on("mouseout", function () {
            var node = d3.select(this);
            if (node.attr('clicked') === null) {
                node.select('ellipse').attr('fill', 'white');
            }
        })
        .on("click", function (d) {
            var this_node = d3.select(this).attr('clicked', 'true');

                // First check to see if the node was already clicked and change previous node properties
                if (last_node === -1) {
                    last_node = this_node;
                }
                else {
                    last_node.attr("clicked", null)
                    .select('ellipse')
                    .attr("fill", "white");

                    if (this_node.attr('id') === last_node.attr('id')) {
                        last_node = -1;
                        return;
                    }

                    last_node = this_node;
                }

                this_node.select('ellipse')
                .attr("fill", "#F5EEEE");
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
    * Create node collection to dot string
    */
    collToDot: function(getDotStr, bottomUp){
        bottomUp = bottomUp || true;

        var dgArr = [];

        // include digraph options
        if (bottomUp) {dgArr.push("rankdir=BT");}

        // add node properties
        this.model.each(
            function(cnode){
                dgArr.push(cnode.get("id") + ' [label="' + cnode.getNodeDisplayTitle() + '"];');
            }
        );

        // add the edges TODO make an option to display redundant edges
        this.model.each(
            function(cnode){

                cnode.get("dependencies").each(
                    function(inlink){
                        if (cnode.isUniqueDependency(inlink.get("from_tag"))){
                            dgArr.push(inlink.getDotStr());
                        }
                    });
            }
        );

        return "digraph G{\n" + dgArr.join("\n") + "}";
    },

    /**
    * Create SVG representation
    */
    createSvgGV: function(getDotStr){
        return Viz(getDotStr, 'svg');
    },

    /**
    * Close and unbind views to avoid memory leaks
    */
    close: function(){
      this.remove();
      this.unbind();
    }
});


/*****************************/
/* -------- ROUTER --------- */
/*****************************/

/**
* Central router to control URL state
*/
window.AppRouter = Backbone.Router.extend({
    routes: {
        "":"fullGraphRoute",
        ":id":"cnodeRoute"
    },

    showView: function (selector, view) {
        if (this.currentView) {
            this.currentView.close();
        }
        $(selector).html(view.render().el);
        this.currentView = view;
        return view;
    },

    fullGraphRoute: function (first_node) {
        this.cnodeRoute("");
    },

    cnodeRoute: function(id) {
        // need to load just the given node and deps...
        console.log('in list');
        console.log(id);
        this.cnodes = new CNodeCollection();
        this.cnodes.ncoll = id; // TODO this is a hack
        var that = this; // TODO better way to do this?
        this.cnodes.fetch({success:function () {
            console.log('successful fetch'); //  (collection was populated)
            that.kmView = new KmapView({model: that.cnodes});
            that.showView("#leftpanel", that.kmView);
        }});

    }
});

/*****************************/
/* --------- MAIN ---------- */
/*****************************/
var app = new AppRouter();
Backbone.history.start();
scaleWindowSize("header", "main", "rightpanel", "leftpanel");
setRightPanelWidth(0);
})(Backbone, Viz);





