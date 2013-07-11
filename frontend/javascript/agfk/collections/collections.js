/*
 * This file contains the model collections and must load after the models
 */
(function(AGFK, Backbone, _, $, undefined){

    AGFK = typeof AGFK == "object" ? AGFK : {}; // namespace

    /**
     * collection of resource models
     */
    AGFK.ResourceCollection = Backbone.Collection.extend({
        model:AGFK.Resource,

        /**
         * Returns a backbone collection of the free resources TODO does this maintain the cid correctly?
         */
        getFreeResources: function(){
            return new AGFK.ResourceCollection(this.where({free: 1}));
        },

        /**
         * Returns a backbone collection of the paid resources TODO does this maintain the cid correctly?
         */
        getPaidResources: function(){
            return new AGFK.ResourceCollection(this.where({free: 0}));
        },

        /**
         * Keep the resource sorted by mark !== 'star'
         */
        comparator: function(rsrc){
            return rsrc.get("mark").indexOf("star") === -1;
        }
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

        initialize: function(){
            var thisColl = this;
            this.on("change:learnStatus", thisColl.dfsChangeILCount);
        },
        /**
         * parse incoming json data
         */
        parse: function(response){
            var ents = [];
            for (var key in response) {
                ents.push(_.extend(response[key],{id: key})); // TODO change once id is generated server-side
            }
            return ents;
        },

        /**
         * Apply the user data to the given node collection
         */
        applyUserData: function(userModel){
            var thisColl = this,
                collNode;
            _.each(userModel.get("learnedNodes"), function(val, key){
                collNode = thisColl.get(key);
                if (collNode !== undefined){
                    thisColl.get(key).setLearnedStatus(true);
                }
            });
        },

        /**
         * DFS to change the implicit learned count of the dependencies of rootTag
         */
        dfsChangeILCount: function(rootTag, ctChange){
            var thisColl = this,
            depNodes = [thisColl.get(rootTag)],
            nextRoot,
            addDepNode,
            passedNodes = {};
            ctChange = typeof ctChange === "boolean" ? (ctChange === true ? 1 : -1) : ctChange;
            // TODO assert ctChange is a number

            // DFS over the nodes
            while ((nextRoot = depNodes.pop())){
                $.each(nextRoot.getUniqueDependencies(), function(dct, dtag){
                    if (!passedNodes.hasOwnProperty(dtag)){
                        addDepNode = thisColl.get(dtag);
                        addDepNode.incrementILCt(ctChange);
                        passedNodes[dtag] = true;
                        depNodes.push(addDepNode);
                    }
                });
            }

        }
    });
})(window.AGFK = typeof window.AGFK == "object" ? window.AGFK : {}, window.Backbone, window._, window.$);
