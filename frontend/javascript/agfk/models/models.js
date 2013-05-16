/*
* This file contains the models and must be loaded after Backbone, jQuery, and d3
*/

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
        if (!this.uniqueDeps){ this.getAncestors(true); } // TODO: do we want to populate unique dependencies as a side effect of obtaining ancestors?
        if (!noReturn){
            return Object.keys(this.uniqueDeps);
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


/**
* Container for CNodeCollection in order to save/parse meta information for the collection
*/
window.CNodeCollectionContainer = Backbone.Model.extend({
    defaults: function(){
        return {
            nodes: new CNodeCollection(),
            keyNode: null
        };
    },

    /**
    * parse incoming json data
    */
    parse: function(response){
        // TODO check for extending the nodes vs resetting
        this.get("nodes").add(response.nodes, {parse: true});
        delete response.nodes;
        return response;
    },

    /**
    * Specify URL for HTTP verbs (GET/POST/etc)
    */
    url: function(){
        return window.CONTENT_SERVER + "/nodes" + (this.get("keyNode") ? "/" + this.get("keyNode") + '?set=map' : "");
    }
});
