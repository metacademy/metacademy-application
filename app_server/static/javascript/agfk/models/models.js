/*
 * This file contains the models and must be loaded after Backbone, jQuery, and d3
 */

(function(AGFK, Backbone, _, undefined){
    "use strict";
  
    /**
     * Comprehension question model
     */
    AGFK.Question = Backbone.Model.extend({
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
    AGFK.Resource = Backbone.Model.extend({
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
                level: "",
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
    AGFK.DirectedEdge = Backbone.Model.extend({

        /**
         * default values -- underscore attribs used to match data from server
         */
        defaults: function () {
            return {
                from_tag: "",
                to_tag: "",
                reason: ""
            };
        },

        /**
         * Initialize the DE (currently sets the id properly)
         */
        initialize: function(inp){
            this.id = inp.id || inp.from_tag + inp.to_tag;
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
    AGFK.Node = (function(){
        // maintain ancillary/user-specific info and fields in a private object
        var pvt = {};
        pvt.collFields =  ["questions", "dependencies", "outlinks", "resources"]; 
        pvt.txtFields = ["id", "title", "summary", "pointers", "is_shortcut"];
        
        return Backbone.Model.extend({
            /**
             * all possible attributes are present by default
             */
            defaults: function() {
                return {
                    title: "",
                    id: "",
                    summary: "",
                    pointers: "",
                    is_shortcut: 0,
                    questions: new AGFK.QuestionCollection(),
                    dependencies: new AGFK.DirectedEdgeCollection(),
                    outlinks: new AGFK.DirectedEdgeCollection(),
                    resources: new AGFK.ResourceCollection()
                };
            },

            /**
             *  parse the incoming server data
             */
            parse: function(resp, xhr) {
                // check if we have a null response from the server
                if (resp === null) {
                    return {};
                }
                var output = this.defaults();
                // ---- parse the text values ---- //
                var i = pvt.txtFields.length;
                while (i--) {
                    var tv = pvt.txtFields[i];
                    if (resp[tv]) {
                        output[tv] = resp[tv];
                    }
                }

                // ---- parse the collection values ---- //
                i = pvt.collFields.length;
                while (i--) {
                    var cv = pvt.collFields[i];
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
            initialize: function() {
                var model = this;
                // changes in attribute collections should trigger a change in the node model
                var i = pvt.collFields.length;
                while (i--) {
                    var cval = pvt.collFields[i];
                    this.get(cval).bind("change", function () {
                        model.trigger("change", cval);
                    });
                } 
                this.bind("change", function () {
                    this.save();
                });

                // ***** Add private instance variable workaround ***** //
                var nodePvt = {};
                nodePvt.visible = false;
                nodePvt.implicitLearnCt = 0;
                nodePvt.implicitLearn = false;
                nodePvt.learned = false;
                
                // * Increment the implicit learn count by ival (default 1)
                this.incrementILCt = function(ival){
                    ival = ival || 1;
                    this.setImplicitLearnCt(nodePvt.implicitLearnCt + ival);
                };
                
                this.setLearnedStatus = function(status){
                    if (status !== nodePvt.learned){
                        nodePvt.learned = status;
                        this.trigger("change:learnStatus", this.get("id"), status);
                    }
                };

                this.setVisibleStatus = function(status){
                    if (nodePvt.visible !== nodePvt.visible){
                        nodePvt.visible = status;
                        this.trigger("change:visibleStatus", this.get("id"), status);
                    }
                };

                this.setImplicitLearnCt = function(ilct){
                    if (nodePvt.implicitLearnCt !== nodePvt.ilct){
                        nodePvt.implicitLearnCt = ilct;
                        this.trigger("change:implicitLearnCt", this.get("id"), ilct);
                        this.setImplicitLearnStatus(ilct > 0);
                    }
                };

                this.setImplicitLearnStatus = function(status){
                    if (nodePvt.implicitLearn !== status){
                        nodePvt.implicitLearn = status;
                        this.trigger("change:implicitLearnStatus", this.get("id"), status);
                    }
                };

                this.getImplicitLearnCt = function(){
                    return nodePvt.implicitLearnCt;
                };
                
                this.getImplicitLearnStatus = function(){
                    return nodePvt.implicitLearn;
                };

                this.getVisibleStatus = function(){
                    return nodePvt.visible;
                };
                
                this.getCollFields = function(){
                    return nodePvt.collFields;
                };

                this.getTxtFields = function(){
                    return nodePvt.txtFields;
                };
                
                this.getLearnedStatus = function(){
                    return nodePvt.learned;
                };

            },

            /**
             * returns and caches the node display title
             */
            getNodeDisplayTitle: function(numCharNodeLine){
                if (!this.nodeDisplayTitle){
                    var title = this.get("title") || this.id.replace(/_/g, " ");
                    this.nodeDisplayTitle = AGFK.utils.wrapNodeText(title, numCharNodeLine || 9);
                }
                return this.nodeDisplayTitle;
            },

            /**
             * Returns the title to be displayed in the learning view
             */
            getLearnViewTitle: function(){
                return this.get("is_shortcut") ? this.get("title") + " (shortcut)" : this.get("title");
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
                    var ancests = {},
			coll = this.collection;
                    this.get("dependencies").each(function(dep){
                        var depNode = coll.get(dep.get("from_tag")),
                            dAncests = depNode.getAncestors();
                        for (var dAn in dAncests){
                            if(dAncests.hasOwnProperty(dAn)){
                                ancests[dAn] = 1;
                            }
                        }
                    });

                    // create list of unique dependencies
                    var uniqueDeps = {},
			dtag;
                    this.get("dependencies").each(function(dep){
                        dtag = dep.get("from_tag");
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

                else{
                    return false;
                }
            },

            /**
             * Get a list of unqiue dependencies (dependencies not present as an 
             * ancestor of another dependency)
             */
            getUniqueDependencies: function(noReturn){
                if (!this.uniqueDeps){ this.getAncestors(true); } // TODO: do we want to populate unique dependencies as a side effect of obtaining ancestors?
                if (!noReturn){
                    return Object.keys(this.uniqueDeps);
                }
                return false;
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
    })();


    /**
     * GraphAuxModel: model to store all auxiliary graph information
     **/
    AGFK.GraphAuxModel = (function(){

	// private data (not currently used)
	var pvt = {};

	return Backbone.Model.extend({
	    defaults: {
		depRoot: undefined,
		titles: {}
	    },

	    /**
	     * Get node display title from id
	     */
	    getTitleFromId: function(nid){
		return this.get("titles")[nid]; 
	    }
	});
    })();

    
    /**
     * GraphData: model to store all graph related data (nodes, edges, aux data)
     */
    AGFK.GraphData = (function(){
	var pvt = {};
	return Backbone.Model.extend({
            /**
             * default user states
             */
	    defaults: function(){
		return {
		    nodes: new AGFK.GraphNodeCollection(),
		    edges: new AGFK.GraphEdgeCollection(),
		    aux: new AGFK.GraphAuxModel()
		};
	    },

	    /**
	     * initialize graph data (place parentModel field in child models)
	     */
	    initialize: function(){
		this.get("nodes").parentModel = this;
		this.get("edges").parentModel = this;
		this.get("aux").parentModel = this;
	    }
	});
    })();


    /** 
     * UserData: model to store user data -- will eventually communicate with server for registered users
     */
    AGFK.UserData = (function(){
        // define private methods and variables
        var pvt = {};
        /**
         * Internal function to change dictionary objects 
         * objName: name of object property
         * arName: name of add/remove property of objName
         * arStatus: truthy values assign objName.arName = arStatus; falsy deletes objName.arName
         */
        pvt.updateObjProp = function(objName, arName, arStatus){
            var thisModel = this;
            if (!thisModel.get(objName)){return false;}

            var retVal;
            if (arStatus){
                thisModel.get(objName)[arName] = arStatus;
                thisModel.trigger("change:" + objName);
                retVal = true;
            }
            else if (thisModel.get(objName).hasOwnProperty(arName)){
                delete thisModel.get(objName)[arName];
                thisModel.trigger("change:" + objName);
                retVal = true;
            }
            else{
                retVal = false;
            }
            return retVal;
        };

        // return public object
        return Backbone.Model.extend({
            /**
             * default user states
             */
            defaults: function() {
                return {
                    learnedNodes: {},
                    visibleNodes: {},
                    implicitLearnedNodes: {}
                };
            },
            
            /**
             * Setter function that triggers an appropriate change event
             */
            updateLearnedNodes: function(nodeName, status){
                return pvt.updateObjProp.call(this, "learnedNodes", nodeName, status);
            },

            /**
             * Setter function that triggers an appropriate change event
             */
            updateImplicitLearnedNodes: function(nodeName, status){
                return pvt.updateObjProp.call(this, "implicitLearnedNodes", nodeName, status);
            },

            /**
             * Setter function that triggers an appropriate change event
             */
            updateVisibleNodes: function(nodeName, status){
                return pvt.updateObjProp.call(this, "visibleNodes", nodeName, status);
            }
        });
    })();


    /**
     * Wrapper model for all application data (i.e. user and graph data)
     */
    AGFK.AppData = Backbone.Model.extend({
        /**
         * Default model attributes
         */
        defaults: function(){
            return {
                graphData: new AGFK.GraphData(),
                userData: new AGFK.UserData()
            };
        },

        /**
         * Initialize the model by binding the appropriate callback functions
         */
        initialize: function(){
            var thisModel = this,
		userData = thisModel.get("userData"),
		graphData = thisModel.get("graphData"),
		nodes = graphData.get("nodes");

	    // set parentModel for userData and graphData
	    graphData.parentModel = thisModel;
	    userData.parentModel = thisModel;

	    // Update user data when aux node data changes 
	    // TODO: this is nonstandard but it follow the idea that the userData should reflect user-specific changes to the graph 
	    // (there may be a better way to do this, but aux fields on the nodes themselves, such as "learnStatus,"
	    // make it easy to trigger changes in the views for the specific node rather than the entire collection 
            userData.listenTo(nodes, "change:learnStatus", userData.updateLearnedNodes);
            userData.listenTo(nodes, "change:implicitLearnStatus", userData.updateImplicitLearnedNodes);
            userData.listenTo(nodes, "change:visibleStatus", userData.updateVisibleNodes);
        },
	
        /**
         * Aux function to set graph data from wrapper model (TODO this function may not be necessary)
         */
	setGraphData: function(gdataObj){
	    // TODO make this function more general (if we keep it)
	    if (gdataObj.hasOwnProperty("depRoot")){
		this.get("graphData").get("aux").set("depRoot", gdataObj.depRoot);
	    }
	},

        /**
         * parse incoming json data
         */
        parse: function(response){
	    // TODO we should also parse/obtain user-data here CR-Restruct
            // TODO check for extending the nodes vs resetting
	    var thisModel = this,
		graphData = thisModel.get("graphData"),
		nodes = graphData.get("nodes"),
		edges = graphData.get("edges"),
		aux = graphData.get("aux");

	    aux.set("titles", response.titles); // TODO: change this to response.aux.titles?

	    // build node set
            nodes.add(response.nodes, {parse: true});
            nodes.applyUserData(thisModel.get("userData"));

	    // build edge set from nodes
	    nodes.each(function(node){
		// add all edges from nodes
		["dependencies", "outlinks"].forEach(function(edgeType){
		    node.get(edgeType).each(function(edge){
			edges.add(edge);
			edge.graphEdgeCollection = edges;
		    });
		});
	    });
	    
            delete response.nodes;
            return response;
        },

        /**
         * Specify URL for HTTP verbs (GET/POST/etc)
         */
        url: function(){
	    var thisModel = this, 
		depTag = thisModel.get("graphData").get("aux").get("depRoot");
	    // TODO post CR-Restruct handle different types of input (aggregated graphs) based on url
	    AGFK.errorHandler.assert(typeof depTag === "string", "dependency is not defined in backbone URL request"); 
	    return window.CONTENT_SERVER + "/dependencies?concepts=" + depTag;
        }
    });
})(typeof window.AGFK == "object" ? window.AGFK : {}, window.Backbone, window._);

