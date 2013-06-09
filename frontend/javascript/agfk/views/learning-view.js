/**
 * This file contains the learning view and appropo subviews and must be loaded
 * after the models and collections
 */


(function(AGFK, Backbone, _){

    /**
     * Display the model as an item in the node list
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
                thisView.$el.html(thisView.template(thisView.model.toJSON()));
                return thisView;
            }

        });
    })();


    AGFK.LearnView = (function(){
        // define private variables and methods
        var pvt = {};

        pvt.viewConsts = {
            viewId: "learn-view"
        };

        // return public object
        return Backbone.View.extend({
            id: pvt.viewConsts.viewId,

            /**
             * Render the learning view given the supplied collection
             */
            render: function(){
                var thisView = this;
                this.model.get("nodes").each(function(node){
                    thisView.$el.append(new AGFK.NodeListItemView({model: node}).render().el);
                });
                return thisView;
            },

            /**
             * Clean up the view
             */
            close: function(){
                //TODO
            }
        });
    })();



})(window.AGFK = typeof window.AGFK == "object"? window.AGFK : {}, window.Backbone, window._);
