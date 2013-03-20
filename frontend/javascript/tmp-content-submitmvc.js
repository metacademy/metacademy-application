window.CNode = Backbone.Model.extend({
    defaults:{
        id:"",
        title:"",
        ckeys:"",
        summary:"",
        dependencies:[],
        pointers:[],
        resources:[]
    }
//    get_extra_resource_info: function(rnum){
//        var extra_text = [];
//        if (this.resources.length > rnum){
//            for (rkey in this.resources[rnum]){
//                extra_text.push(rkey + ':' + this.resources[rnum][rkey]);
//            }
//        }
//        return extra_text.join('\n');
//    }
});

window.CNodeCollection = Backbone.Collection.extend({
    model:CNode,
    url:"full_graph",
    // parse the incoming json data
    parse:function (response) {
        console.log("in parse collections");
        var ents = [];
        for (key in response.nodes) {
            ents.push(response.nodes[key]);
        }
        return ents;
    },
    comparator:function (node) {
        return node.id.toLowerCase();
    }
})
;

window.CNodeListView = Backbone.View.extend({
    tagName:'ul',
    className:'nodelist',
    initialize:function () {
        this.model.bind("reset", this.render, this);
    },
    render:function () {
        _.each(this.model.models, function (cnode) {
            $(this.el).append(new CNodeItemView({model:cnode}).render().el);
        }, this);
        return this;
    }
});

window.CNodeItemView = Backbone.View.extend({
    tagName:"li",
    template:_.template($('#cnode-list-item-template').html()),
    render:function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});

window.CNodeView = Backbone.View.extend({
    tagName:"div",
    template:_.template($('#cnode-details-template').html()),
    render:function (eventName) {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});

var AppRouter = Backbone.Router.extend({
    routes:{
        "":"list",
        "cnode/:id":"cnodeDetails"
    },

    list:function (first_node) {
        console.log('in list');
        this.cnodeList = new CNodeCollection();
        this.cnodeListView = new CNodeListView({model:this.cnodeList});
        var that = this;
        this.cnodeList.fetch({success:function () {
            console.log('successful fetch'); //  (collection have been populated)
            if (first_node){
                that.cnodeDetails(first_node);
            }
        }},this);
        $("#rightpanel").html(this.cnodeListView.render().el); // encapsulation trick
    },

    cnodeDetails:function (id) {
        if (!this.cnodeList) {
            this.list(id); // TODO have to wait...
        } else {
            this.cnodeItem = this.cnodeList.get(id);
            this.cnodeView = new CNodeView({model:this.cnodeItem}); // careful of memory management with callbacks...
            $('#leftpanel').html(this.cnodeView.render().el)
        }

    }
});

// main function... move somewhere
scaleWindowSize("header", "main", "rightpanel", "leftpanel");
//setRightPanelWidth(25, 0.1, 0); // TODO why doesn't this work with 2 zeros?
var app = new AppRouter();
Backbone.history.start();