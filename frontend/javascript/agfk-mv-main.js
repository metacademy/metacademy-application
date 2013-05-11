/* 
This file will contain the central mv* framework for the AGFK learning, exploration, and content-submission.
After initial development, the contents of this file may be placed into an standard MV* file heirarchy, 
e.g. models/node.js, views/comprehension-view.js, etc
/*

// TODO use functional form after initial development
"use strict"



/* MODELS */


// comprehension questions model -- allows for model expansion later on (e.g. adding quality metrics)
window.CQuestion = Backbone.Model.extend({
    defaults: function () {
        return {
            text: "",
            node: null
        };
    }
});


// resource model
window.CResource = Backbone.Model.extend({
	listFields: ['authors', 'dependencies', 'mark', 'extra', 'note'],
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

// general directed edge model
window.CDirectedEdge = Backbone.Model.extend({
    defaults:function () {
        return {
            origin: "",
            end: "",
            reason: "",
            visible: false
        };
    }
});


// Model: entire node, encompasses several collections and sub-models
window.CNode = Backbone.Model.extend({
    collFields: ["questions", "inlinks", "outlinks", "resources"], // collection fields
    txtFields: ["id", "title", "summary", "pointers"], // text fields
    boolFields: ["visible", "learned"], // boolean fields

    defaults: function () {
        return {
            title: "",
            id: "",
            summary: "",
            pointers: "",
            questions: new CQuestionCollection(),
            inlinks: new CDirectedEdgeCollection(),
            outlinks: new CDirectedEdgeCollection(),
            resources: new CResourceCollection(),
            visible: false,
            learned: false
        };
    },

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

    urlRoot: window.CONTENT_SERVER + "/nodes",

    url: function(){
	// alter URL so that user contributed web data is distinguished from vetted data
        return this.urlRoot + "/" + this.id + "/user_data" ;
    }

});