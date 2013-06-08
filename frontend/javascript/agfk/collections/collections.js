/*
 * This file contains the model collections and must load after the models
 */
(function(AGFK, Backbone, _, undefined){

    AGFK = typeof AGFK == "object" ? AGFK : {}; // namespace

    /**
     * collection of resource models
     */
    AGFK.ResourceCollection = Backbone.Collection.extend({
        model:AGFK.Resource
    });


    /**
     * Collection of directed edge models
     */
    AGFK.DirectedEdgeCollection = Backbone.Collection.extend({
        model:AGFK.DirectedEdge
    });


    /**
     * Collection of question models
     */
    AGFK.QuestionCollection = Backbone.Collection.extend({
        model:AGFK.Question
    });


    /**
     * Collection of node models
     */
    AGFK.NodeCollection = Backbone.Collection.extend({
        model: AGFK.Node,

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
})(window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {}, window.Backbone, window._);
