/*
* This file contains the model collections and must load after the models
*/

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

    /**
    * parse incoming json data
    */
    parse: function(response){
        var ents = [];
        for (var key in response) {
            ents.push(_.extend(response[key],{id: key})); // TODO change once id is generated server-side
        }
        return ents;
    }
});
