/*
* This file contains the router and must be loaded after the models, collections, and views
*/

/**
* Central router to control URL state
*/
window.CAppRouter = Backbone.Router.extend({
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
        this.cnodesContn = new CNodeCollectionContainer({keyNode: id});
        var that = this; // TODO better way to do this?
        this.cnodesContn.fetch({success:function () {
            console.log('successful fetch: collection was populated'); //  (collection was populated)
            that.kmView = new CKmapView({model: that.cnodesContn});
            that.showView("#leftpanel", that.kmView);
        }});

    }
});