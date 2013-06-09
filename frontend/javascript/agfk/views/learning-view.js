/**
 * This file contains the learning view and appropo subviews and must be loaded
 * after the models and collections
 */


(function(AGFK, Backbone, _){

    /**
     * Display the model as an item in the node list
     * NOTE: the model is assumed to be a simple javascript object NOT a backbone model
     */
    AGFK.NodeListItemView = (function(){
        // define private variables and methods
        var pvt = {};

        pvt.viewConsts = {
            viewId: "node-item-view", // dom id for view
            templateId: "node-item-view-template" // name of view template (warning: hardcoded in html)
        };

        // return public object
        return Backbone.View.extend({
            id: pvt.viewConsts.viewId,
            template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),

            /**
             * Render the learning view given the supplied collection
             */
            render: function(){
                var thisView = this;
                thisView.$el.html(thisView.template(thisView.model));
                return thisView;
            }

        });
    })();


    AGFK.LearnView = (function(){
        // define private variables and methods
        var pvt = {};

        pvt.viewConsts = {
            viewId: "learn-view",
            viewClass: ""
        };

        // return public object
        return Backbone.View.extend({
            id: pvt.viewConsts.viewId,
            
            /**
             * Render the learning view given the supplied collection TODO examine the rendering type and render appropriately
             */
            render: function(){
                var thisView = this,
                    nodes = thisView.model.get("nodes"),
                    nodeOrdering,
                    inum,
                    noLen,
                    simpleModel,
                    curNode,
                    $el = thisView.$el;

                $el.html("");
                // TODO cache node ordering
                nodeOrdering = thisView.getLVNodeOrdering();

                for (inum = 0, noLen = nodeOrdering.length; inum < noLen; inum++){
                    curNode = nodes.get(nodeOrdering[inum]);
                    simpleModel = {
                        title: curNode.get("title"),
                        id: curNode.get("id")
                    };
                    $el.append(new AGFK.NodeListItemView({model: simpleModel}).render().el); // not using entire backbone model to reduce JSON overheaad
                }
                return thisView;
            },

            /**
             * Clean up the view
             */
            close: function(){
                this.remove();
                this.unbind();
            },

            /**
             * Compute the learning view ordering
             * TODO this function may be migrated 
             * if the view ordering is user-dependent
             */
            getLVNodeOrdering: function(){
                var thisView = this,
                    curAddNodes = [], // current layer in the BFS
                    nextAddNodes = [], // next layel in the BFS
                    nodeOrdering = [], // returned node ordering
                    traversedNodes = {}, // nodes already added to list
                    curTag,  // current node being added to list
                    nodes = thisView.model.get("nodes"),
                    keyTag = thisView.model.get("keyNode");

                if (keyTag === ""){
                    // init: obtain node tags with 0 dependencies
                    curAddNodes = _.map(nodes.filter(function(mdl){
                        return mdl.get("outlinks").length == 0;
                    }), function(itm){
                        return itm.get("id");
                    });
                }
                else{
                    curAddNodes.push(keyTag);
                }
                
                // perform a level-based breadth first search 
                while(curAddNodes.length > 0){
                    curTag = curAddNodes.shift();
                    nodeOrdering.push(curTag);
                    
                    _.each(nodes.get(curTag).getUniqueDependencies(),
                    function(toAddNode){
                        // make sure we're adding a valid node'
                        if (!traversedNodes.hasOwnProperty(toAddNode) ){
                            nextAddNodes.push(toAddNode);
                        }
                        traversedNodes[toAddNode] = 1;
                    });
                    if (curAddNodes.length === 0){
                        // TODO disambiguate nodes at the same level here
                        curAddNodes = nextAddNodes;
                        nextAddNodes = [];
                    }
                }
                
                return nodeOrdering;   
            }
        });
    })();



})(window.AGFK = typeof window.AGFK == "object"? window.AGFK : {}, window.Backbone, window._);
