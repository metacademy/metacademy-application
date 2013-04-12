"use strict";

// define global attributes
var NEWELCLASS = "newel"; // must also change events entry in model view

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Utils ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
function textToArray(txt) {
    return _.filter(txt.split('\n'), function (str) {
        return str.length;
    });
}

function parseID(id) {
    return id.split('-');
}

/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Backbone MVC ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

// ------------ MODELS ---------------- //

window.CCKey = Backbone.Model.extend({
    defaults:function () {
        return {
            text:""
        };
    }
});

window.CResource = Backbone.Model.extend({
    defaults:function () {
        return {
            id:"",
            source:"",
            location:"",
            extras:[]
        };
    }
});

window.CDirectedEdge = Backbone.Model.extend({
    defaults:function () {
        return {
            from_tag:"",
            to_tag:"",
            reason:""
        };
    }
});

// Model: entire node
window.CNode = Backbone.Model.extend({
    collVals:["ckeys", "dependencies", "resources"], // collection values\
    txtVals:["id", "title", "summary", "pointers"],
    defaults:function () {
        return {
            title:"",
            summary:"",
            ckeys:new CCKeyCollection(),
            dependencies:new CDirectedEdgeCollection(),
            pointers:"",
            resources:new CResourceCollection()
        };
    },
    parse:function (resp, xhr) {
        if (resp === null) {
            return {};
        }
        var output = this.defaults();

        // ---- parse the text values ---- //
        var i = this.txtVals.length;
        while (i--) {
            var tv = this.txtVals[i];
            if (resp[tv]) {
                output[tv] = resp[tv];
            }
        }
        // ---- parse the collection values ---- //
        i = this.collVals.length;
        while (i--) {
            var cv = this.collVals[i];
            output[cv].parent = this;
            if (resp[cv]) {
                output[cv].add(resp[cv]);
            }
        }
        return output;
    },
    initialize:function () {
        var model = this;
        // changes in attribute collections should trigger a change in node
        var i = this.collVals.length;
        while (i--) {
            var cval = this.collVals[i];
            this.get(cval).bind("change", function () {
                model.trigger("change", cval);
            });
        }
        this.bind("change", function () {
            this.save();
        });
    },
    urlRoot:window.CONTENT_SERVER + "/nodes"

});

/* COLLECTIONS */

window.CResourceCollection = Backbone.Collection.extend({
    model:CResource
});

window.CDirectedEdgeCollection = Backbone.Collection.extend({
    model:CDirectedEdge
});

window.CCKeyCollection = Backbone.Collection.extend({
    model:CCKey
});

window.CNodeCollection = Backbone.Collection.extend({
    model:CNode,
    url:window.CONTENT_SERVER + "/nodes",
    // parse the incoming json data
    parse:function (response) {
        var ents = [];
        for (var key in response.nodes) {
            ents.push(response.nodes[key]);
        }
        return ents;
    },
    comparator:function (node) {
        // TODO keep track of the new/edited nodes here for list display?
        return node.id.toLowerCase();
    }
});

// -------------------- VIEWS ------------------------- //
// Base view for other box display
window.BoxItemView = Backbone.View.extend({
    tagName : 'section',
    className : 'cnode-box',
    templateID : 'notemplate',
    render:function (extra_input_class) {
        extra_input_class = extra_input_class || "";
        var template = _.template($("#" + this.templateID).html());
        this.$el.html(template(_.extend(this.model.toJSON(), {cid:this.model.cid, eiclass:extra_input_class })));
        return this;
    },
    events:{
        "change input":"change",
        "change textarea":"change",
        "keypress .newel":"newelChange"
    },
    change:function (event) {
        var newVal = $.trim($(event.currentTarget).val());
        var elid = parseID(event.currentTarget.id).pop();
        // need to id them and do keyup/keydown choices
        newVal = elid === "extras" ? textToArray(newVal) : newVal;
        this.model.set(elid, newVal);
    },
    newelChange:function (event) {
        // verify we have need content and remove newval class
        var $el = $(event.currentTarget);
        $el.removeClass(NEWELCLASS);

        if (this.model.isnew) {
            // check if conditions are satisfied to add to collection TODO what conditions?

            // assign default value to source/id/etc if not specified
            var $cnodetitle = $el.parent().find(".cnode-title-input");
            if ($cnodetitle.length) { // TODO perhaps do this check before saving to server for all relevant entries
                var idval = parseID($cnodetitle.attr("id")).pop();
                // check if we're editing the id val
                if (idval !== parseID($el.attr("id")).pop()) {
                    this.model.set(idval, "--undefined--")
                }
            }

            // add to collection
            this.model.addCollection.add(this.model);
            this.model.isnew = false;

            // display new element
            this.containingView.appendNewEl(this.model, this.className, this.templateID);

        }
    }
});

// Base view for enclosing Box Items
window.CNodeDIView = Backbone.View.extend({
    tagName:'section',
    className:'cnode-data-input',
    appendNewEl:function (modelInstance, inclassName, templateID) {
        // add new empty element to view collection but not model collection
        var newcon = Object.getPrototypeOf(modelInstance).constructor; // NOTE: this is ES5 so only IE 9+ support (TODO add at least IE 8 support)
        var newel = new newcon();
        newel.addCollection = this.model;
        newel.isnew = true;
        var biv = new BoxItemView({model:newel, className : inclassName});
        biv.templateID = templateID;
        biv.containingView = this;
        this.$el.append( biv.render(NEWELCLASS).el);
    },
    render:function (header, templateID, inclassName) {
        this.$el.append("<header>" + header + "</header>");
        _.each(this.model.models, function (rsrc) {
            var biv = new BoxItemView({model:rsrc, className:inclassName});
            biv.templateID = templateID;
            biv.containingView = this;
            this.$el.append(biv.render().el);
        }, this)
        // less-than elegant technique to add new models to view but not collection
        if (this.model.models.length){
            this.appendNewEl(this.model.models[0], inclassName, templateID);
        }
        else{
            this.model.add({});
            this.appendNewEl(this.model.pop(), inclassName, templateID);
        }
        return this;
    }
});

// View: list nodes
window.CNodeListView = Backbone.View.extend({
    tagName:'ul',
    className:'nodelist',
    initialize:function () {
        this.model.bind("reset", this.render, this);
    },
    render:function () {
        _.each(this.model.models, function (cnode) {
            this.$el.append(new CNodeItemView({model:cnode}).render().el);
        }, this);
        return this;
    }
});

// View: text for list of nodes
window.CNodeItemView = Backbone.View.extend({
    tagName:"li",
    template:_.template($('#cnode-list-item-template').html()),
    initialize:function () {
        this.listenTo(this.model, 'change', this.render);
    },
    render:function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    }
});

// View: full node details
window.CNodeView = Backbone.View.extend({
    tagName:"div",
    template:_.template($("#cnode-details-template").html()),
    render:function () {
        this.$el.html(this.template(this.model.toJSON()));
        this.$el.find("#resources-loc").replaceWith(new CNodeDIView({model:this.model
            .get("resources")}).render("Learning Resources", "cnode-resources-template", "cnode-box resources").el);
        //dependencies
        this.$el.find("#dependencies-loc").replaceWith(new CNodeDIView({model:this.model
            .get("dependencies")}).render("Dependencies", "cnode-dependency-template", "cnode-box dependencies").el);
        //ckeys
        this.$el.find("#comprehension-loc").replaceWith(new CNodeDIView({model:this.model
            .get("ckeys")}).render("Comprehension", "cnode-ckeys-template", "lone-section").el);
        // place all html into main view
        
        return this;
    },
    events:{
        "change #title":"changeText",
        "change #summary":"changeText",
        "change #pointers":"changeText"
    },
    changeText:function (event) {
        var newVal = $.trim($(event.currentTarget).val());
        this.model.set(event.currentTarget.id, newVal);
    }
});


// make sure we unbind all listeners/callbacks
Backbone.View.prototype.close = function () {
    if (this.beforeClose) {
        this.beforeClose();
    }
    this.remove();
    this.unbind();
};

// ----------- ROUTERS ------------- //

var AppRouter = Backbone.Router.extend({
    routes:{
        "":"list",
        "cnode/:id":"cnodeDetails"
    },

    showView:function (selector, view) {
        if (this.currentView) {
            this.currentView.close();
        }
        $(selector).html(view.render().el);
        this.currentView = view;
        return view;
    },

    list:function (first_node) {
        console.log('in list');
        this.cnodeList = new CNodeCollection();
        this.cnodeListView = new CNodeListView({model:this.cnodeList});
        var that = this;
        this.cnodeList.fetch({success:function () {
            console.log('successful fetch'); //  (collection have been populated)
            if (first_node) {
                that.cnodeDetails(first_node);
            }
        }}, this);
        $("#rightpanel").html(this.cnodeListView.render().el);
    },

    cnodeDetails:function (id) {
        if (!this.cnodeList) {
            this.list(id);
        } else {
            this.cnodeItem = this.cnodeList.get(id);

            this.cnodeView = new CNodeView({model:this.cnodeItem}); // careful of memory management with callbacks...
            this.showView("#leftpanel", this.cnodeView)
        }

    }
});

// ------------ MAIN ---------------- //
// main function... TODO move somewhere else
scaleWindowSize("header", "main", "rightpanel", "leftpanel");
//setRightPanelWidth(25, 0.1, 0); //
var app = new AppRouter();
Backbone.history.start();
