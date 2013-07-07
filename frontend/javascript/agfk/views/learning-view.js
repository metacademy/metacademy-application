/**
 * This file contains the learning view and appropo subviews and must be loaded
 * after the models and collections
 */


(function(AGFK, Backbone, _, $, undefined){
    "use strict";

    /**
     * Display the model as an item in the node list
     */
    AGFK.NodeListItemView = (function(){
        // define private variables and methods
        var pvt = {};

        pvt.parentView = null;
        
        pvt.viewConsts = {
            templateId: "node-title-view-template", // name of view template (warning: hardcoded in html)
            learnedClass: "learned-concept-title",
            implicitLearnedClass: "implicit-learned-concept-title",
            viewClass: "learn-title-display",
            viewIdPrefix: "node-title-view-div-",
            learnedCheckClass: "lcheck"
        };

        // return public object
        return Backbone.View.extend({
            template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),
            id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.id;},
            className: function(){
                var viewConsts = pvt.viewConsts,
                thisView = this,
                thisModel = thisView.model;
                return pvt.viewConsts.viewClass + (thisModel.getLearnedStatus() ? " " + viewConsts.learnedClass : "") + (thisModel.getImplicitLearnCt() > 0 ? " " + viewConsts.implicitLearnedClass : "");
            },

            events: {
                "click .learn-view-check": "toggleLearnedConcept"
            },

            /**
             * Initialize the view with appropriate listeners
             */
            initialize: function(){
                var thisView = this,
                viewConsts = pvt.viewConsts,
                learnClass = viewConsts.learnedClass,
                implicitLearnedClass = viewConsts.implicitLearnedClass;
                thisView.listenTo(thisView.model, "change:learnStatus", function(nodeId, status){
                        thisView.changeTitleClass(learnClass, status);
                });
                thisView.listenTo(thisView.model, "change:implicitLearnStatus", function(nodeId, status){
                        thisView.changeTitleClass(implicitLearnedClass, status);
                });
            },
            
            /**
             * Render the learning view given the supplied model
             */
            render: function(){
                var thisView = this;
                var thisModel = thisView.model;
                thisView.$el.html(thisView.template(thisModel.toJSON()));
                return thisView;
            },

            /**
             * Toggle learned state of given concept
             */
            toggleLearnedConcept: function(evt){
                evt.stopPropagation();
                var lclass = pvt.viewConsts.learnedClass;
                this.model.setLearnedStatus(!this.$el.hasClass(lclass));
            },

            /**
             * Change the title display properties given by prop
             */
            changeTitleClass: function(classVal, status){
                if (status){
                    this.$el.addClass(classVal);
                }
                else{
                    this.$el.removeClass(classVal);
                }
            },

            /**
             * Set the parent view
             */
            setParentView: function(pview){
                pvt.parentView = pview;
            },

            /**
             * Get the parent view
             */
            getParentView: function(){
                return pvt.pview;
            }
        });
    })();


    /**
     * View to display detailed resource information
     */
    AGFK.ResourceView = (function(){
        // define private variables and methods
        var pvt = {};

        pvt.viewConsts = {
            templateId: "resource-view-template",
            viewClass: "resource-view",
            viewIdPrefix: "resource-details-",
            extraResourceInfoClass: "extra-resource-details"
        };

        // return public object
        return Backbone.View.extend({
            template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),
            id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
            className: pvt.viewConsts.viewClass,

            events: {
                'click .more-resource-info': 'toggleAdditionalInfo'
            },
            
            /**
             * Render the learning view given the supplied model
             */
            render: function(){
                var thisView = this;
                thisView.$el.html(thisView.template(thisView.model.toJSON()));
                return thisView;
            },

            toggleAdditionalInfo: function(evt){
                this.$el.find("." + pvt.viewConsts.extraResourceInfoClass).toggle();
            }

        });
    })();


    /**
     * Wrapper view to display all dependencies
     */
    AGFK.ResourcesSectionView = (function(){
        // define private variables and methods
        var pvt = {};

        pvt.viewConsts = {
            viewClass: "resources-wrapper",
            viewIdPrefix: "resources-wrapper-"
        };

        // return public object
        return Backbone.View.extend({
            id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
            className: pvt.viewConsts.viewClass,
            
            /**
             * Render the learning view given the supplied model
             */
            render: function(){
                var thisView = this;
                thisView.$el.html("");
                thisView.model.each(function(itm){
                    thisView.$el.append(new AGFK.ResourceView({model: itm}).render().el);
                });
                thisView.delegateEvents();
                return thisView;
            }

        });
    })();

    /**
     * View to display details of all provided resources (wrapper view)
     */
    AGFK.DependencyView = (function(){
        // define private variables and methods
        var pvt = {};

        pvt.viewConsts = {
            templateId: "dependency-view-template",
            viewClass: "dependency-view",
            viewIdPrefix: "dependency-details-"
        };

        // return public object
        return Backbone.View.extend({
            template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),
            id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
            className: pvt.viewConsts.viewClass,
            
            /**
             * Render the learning view given the supplied model
             */
            render: function(){
                var thisView = this;
                thisView.$el.html(thisView.template(_.extend(thisView.model.toJSON(), {fromTitle: thisView.model.getFromTitle()})));
                return thisView;
            }

        });
   })();
    
    /**
     * Wrapper view to display all dependencies
     */
    AGFK.DependencySectionView = (function(){
        // define private variables and methods
        var pvt = {};

        pvt.viewConsts = {
            viewClass: "dependencies-wrapper",
            viewIdPrefix: "dependencies-wrapper-"
        };

        // return public object
        return Backbone.View.extend({
            id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
            className: pvt.viewConsts.viewClass,
            
            /**
             * Render the learning view given the supplied model
             */
            render: function(){
                var thisView = this;
                thisView.$el.html("");
                thisView.model.each(function(itm){
                    thisView.$el.append(new AGFK.DependencyView({model: itm}).render().el);
                });
                thisView.delegateEvents();
                return thisView;
            }

        });
    })();

    /**
     * View to display details of all provided resources (wrapper view)
     */
    AGFK.OutlinkView = (function(){
        // define private variables and methods
        var pvt = {};

        pvt.viewConsts = {
            templateId: "outlink-view-template",
            viewClass: "outlink-view",
            viewIdPrefix: "outlink-details-"
        };

        // return public object
        return Backbone.View.extend({
            template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),
            id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
            className: pvt.viewConsts.viewClass,
            
            /**
             * Render the learning view given the supplied model
             */
            render: function(){
                var thisView = this;
                thisView.$el.html(thisView.template(_.extend(thisView.model.toJSON(), {toTitle: thisView.model.getToTitle()})));
                return thisView;
            }

        });
   })();


    /**
     * Wrapper view to display all outlinks
     */
    AGFK.OutlinkSectionView = (function(){
        // define private variables and methods
        var pvt = {};

        pvt.viewConsts = {
            viewClass: "outlinks-wrapper",
            viewIdPrefix: "outlinks-wrapper-"
        };

        // return public object
        return Backbone.View.extend({
            id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
            className: pvt.viewConsts.viewClass,
            
            /**
             * Render the view given the supplied model
             */
            render: function(){
                var thisView = this;
                thisView.$el.html("");
                thisView.model.each(function(itm){
                    thisView.$el.append(new AGFK.OutlinkView({model: itm}).render().el);
                });
                thisView.delegateEvents();
                return thisView;
            }

        });
    })();


    /**
     * View to display additional notes/pointers
     * NOTE: expects a javascript model as input (for now) with one field: text
     */
    AGFK.PointersView = (function(){
        // define private variables and methods
        var pvt = {};

        pvt.viewConsts = {
            templateId: "pointers-view-template",
            viewClass: "pointers-view",
            viewIdPrefix: "pointers-view-"
        };

        // return public object
        return Backbone.View.extend({
            template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),
            id: function(){ return pvt.viewConsts.viewIdPrefix +  this.model.cid;},
            className: pvt.viewConsts.viewClass,
            
            /**
             * Render the learning view given the supplied model
             */
            render: function(){
                var thisView = this;
                thisView.$el.html(thisView.template(thisView.model));
                return thisView;
            }

        });
   })();
    

    /**
     * Displays detailed node information
     */
    AGFK.DetailedNodeView = (function(){
        // define private variables and methods
        var pvt = {};

        pvt.viewConsts = {
            templateId: "node-detail-view-template", // name of view template (warning: hardcoded in html)
            viewTag: "section",
            viewIdPrefix: "node-detail-view-",
            viewClass: "node-detail-view",
            freeResourcesLocClass: 'free-resources-wrap', // classes are specified in the node-detail template
            paidResourcesLocClass: 'paid-resources-wrap',
            depLocClass: 'dep-wrap',
            ptrLocClass: 'pointers-wrap',
            outlinkLocClass: 'outlinks-wrap'
        };

        // return public object
        return Backbone.View.extend({
            template: _.template(document.getElementById( pvt.viewConsts.templateId).innerHTML),
            id: function(){ return pvt.viewConsts.viewIdPrefix + this.model.get("id");},
            tagName: pvt.viewConsts.viewTag,
            className: pvt.viewConsts.viewClass,
            
            /**
             * Render the learning view given the supplied model TODO consider using setElement instead of html
             * TODO try to reduce the boiler-plate repetition in rendering this view
             */
            render: function(){
                var thisView = this,
                    viewConsts = pvt.viewConsts,
                    assignObj = {},
                    freeResourcesLocClass = "." + viewConsts.freeResourcesLocClass,
                    paidResourcesLocClass = "." + viewConsts.paidResourcesLocClass,
                    depLocClass = "." + viewConsts.depLocClass,
                    outlinkLocClass = "." + viewConsts.outlinkLocClass,
                    ptrLocClass = "." + viewConsts.ptrLocClass;
                
                thisView.$el.html(thisView.template(thisView.model.toJSON()));
                thisView.fresources =
                    thisView.fresource || new AGFK.ResourcesSectionView({model: thisView.model.get("resources").getFreeResources()});
                thisView.presources = thisView.presources || new AGFK.ResourcesSectionView({model: thisView.model.get("resources").getPaidResources()});
                thisView.dependencies = thisView.dependencies || new AGFK.DependencySectionView({model: thisView.model.get("dependencies")});
                thisView.outlinks = thisView.outlinks || new AGFK.OutlinkSectionView({model: thisView.model.get("outlinks")});
                thisView.pointers = thisView.pointers || new AGFK.PointersView({model: {text: thisView.model.get("pointers")}});
                if (thisView.fresources.model.length > 0){
                    assignObj[freeResourcesLocClass] = thisView.fresources;
                }
                if (thisView.presources.model.length > 0){
                    assignObj[paidResourcesLocClass] = thisView.presources;
                }
                if (thisView.dependencies.model.length > 0){
                    assignObj[depLocClass] = thisView.dependencies;
                }
                if (thisView.outlinks.model.length > 0){
                    assignObj[outlinkLocClass] = thisView.outlinks;
                }
                if (thisView.pointers.model.text.length > 1){
                    assignObj[ptrLocClass] = thisView.pointers;
                }
                
                thisView.assign(assignObj);
                thisView.delegateEvents();
                return thisView;
            },

            /**
             * Assign subviews: method groked from http://ianstormtaylor.com/assigning-backbone-subviews-made-even-cleaner/
             */
            assign : function (selector, view) {
                var selectors;
                if (_.isObject(selector)) {
                    selectors = selector;
                }
                else {
                    selectors = {};
                    selectors[selector] = view;
                }
                if (!selectors) return;
                _.each(selectors, function (view, selector) {
                    view.setElement(this.$(selector)).render();
                }, this);
            },

            /**
             * Clean up the view properly
             */
            close: function(){
                this.unbind();
                this.remove();
            }

        });
    })();

    /**
     * Main learning view
     */
    AGFK.LearnView = (function(){
        // define private variables and methods
        var pvt = {};

        // keep track of expanded nodes: key: title node id, value: expanded view object
        pvt.expandedNodes = {};

        pvt.nodeOrdering = null;

        pvt.viewConsts = {
            viewId: "learn-view",
            clickedItmClass: "clicked-title"
        };

        /**
         * Insert a given subview after the specified dom node
         */
        pvt.insertSubViewAfter = function(subview, domNode){
                domNode.parentNode.insertBefore(subview.render().el, domNode.nextSibling);
        };

        // return public object
        return Backbone.View.extend({
            id: pvt.viewConsts.viewId,

            events: {
                "click .learn-title-display": "showNodeDetailsFromEvt"
            },

            /**
             * Display the given nodes details from the given event
             * and store the currentTarget.id:subview in pvt.expandedNodes
             */
            showNodeDetailsFromEvt: function(evt){
                var thisView = this,
                clkEl = evt.currentTarget,
                clkElClassList = clkEl.classList,
                nid,
                clickedItmClass = pvt.viewConsts.clickedItmClass;
                clkElClassList.toggle(clickedItmClass);
                if (clkElClassList.contains(clickedItmClass)){ 
                    nid = clkEl.id.split("-").pop();
                    var dnode = thisView.appendDetailedNodeAfter(thisView.model.get("nodes").get(nid), clkEl);
                    pvt.expandedNodes[clkEl.id] = dnode;
                }
                else{
                    if (pvt.expandedNodes.hasOwnProperty(clkEl.id)){
                        var expView = pvt.expandedNodes[clkEl.id];
                        expView.close();
                        delete pvt.expandedNodes[clkEl.id];
                    }
                }
            },

            /**
             * Append detailed node view to given element id that is a child of thisView
             * Returns the view object for the appended node
             */
            appendDetailedNodeAfter: function(nodeModel, domNode){
                var thisView = this,
                dNodeView = new AGFK.DetailedNodeView({model: nodeModel});
                pvt.insertSubViewAfter(dNodeView, domNode);
                return dNodeView;
            },
            
            /**
             * Render the learning view given the supplied collection
             * TODO rerender (the appropriate section) when the model changes
             */
            render: function(){
                var thisView = this,
                    $el = thisView.$el,
                    expandedNodes = pvt.expandedNodes,
                    clkItmClass = pvt.viewConsts.clickedItmClass;

                $el.html(""); // TODO we shouldn't be doing this -- handle the subviews better
                pvt.nodeOrdering = thisView.getLVNodeOrdering();
                thisView.renderTitles();
                
                // recapture previous expand/collapse state TODO is this desirable behavior?
                for (var expN in expandedNodes){
                    if (expandedNodes.hasOwnProperty(expN)){
                        var domEl = document.getElementById(expN);
                        pvt.insertSubViewAfter(expandedNodes[expN], domEl);
                        domEl.classList.add(clkItmClass);
                        
                    }
                }
                thisView.delegateEvents();
                return thisView;
            },

            /**
             * Render the learning view titles TODO allow for rerendering of only titles
             */
            renderTitles: function(){
            var thisView = this,
                inum,
                noLen,
                nodeOrdering = pvt.nodeOrdering || thisView.getLVNodeOrdering(),
                curNode,
                nid,
                nliview,
                $el = thisView.$el,
                thisModel = thisView.model,
                nodes = thisModel.get("nodes"),
                userData = thisModel.get("userData"),
                learnedNodes = userData.get("learnedNodes"),
                implicitLearnedNodes = userData.get("implicitLearnedNodes");
                
                for (inum = 0, noLen = nodeOrdering.length; inum < noLen; inum++){
                    curNode = nodes.get(nodeOrdering[inum]);
                    nid = curNode.get("id");
                 //   simpleModel = {
                 //       title: curNode.get("title"),
                 //       id: nid,
                 //       learned: learnedNodes.hasOwnProperty(nid),
                 //       implicitLearned: implicitLearnedNodes.hasOwnProperty(nid)
                 //   };
                    nliview = new AGFK.NodeListItemView({model: curNode});
                    nliview.setParentView(thisView);
                    $el.append(nliview.render().el); 
                }
            },

            /**
             * Clean up the view
             */
            close: function(){
            var expN,
            expandedNodes = pvt.expandedNodes,
            domeEl;
                 for (expN in expandedNodes){
                    if (expandedNodes.hasOwnProperty(expN)){
                        var domEl = document.getElementById(expN);
                        expandedNodes[expN].close();
                        delete expandedNodes[expN];
                    }
                }
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
                    nodeNames = nodes.pluck("id"),
                    keyTag = thisView.model.get("keyNode"),
                    allOutLinksAdded;

                if (keyTag === ""){
                    // init: obtain node tags with 0 outlinks
                    curAddNodes = _.map(nodes.filter(function(mdl){
                        return mdl.get("outlinks").length == 0;
                    }), function(itm){
                        return itm.get("id");
                    });
                }
                else{
                    curAddNodes.unshift(keyTag);
                }

                curAddNodes.forEach(function(el){
                    traversedNodes[el] = 1;
                });
                
                // perform a level-based breadth first search 
                while(curAddNodes.length > 0){
                    curTag = curAddNodes.shift();
                    nodeOrdering.unshift(curTag);
                    
                    _.each(nodes.get(curTag).getUniqueDependencies(),
                    function(toAddNode){
                        // make sure we're adding a valid node'
                        allOutLinksAdded = true;
                        $.each(nodes.get(toAddNode).get("outlinks").pluck("to_tag"),function(inum, ol){
                            if (!traversedNodes.hasOwnProperty(ol) && nodeNames.indexOf(ol) !== -1){
                                allOutLinksAdded = false;
                                return false;
                            }
                        });
                        if (!traversedNodes.hasOwnProperty(toAddNode) && allOutLinksAdded){
                            nextAddNodes.push(toAddNode);
                            traversedNodes[toAddNode] = 1;
                        }
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



})(window.AGFK = typeof window.AGFK == "object"? window.AGFK : {}, window.Backbone, window._, window.jQuery);
