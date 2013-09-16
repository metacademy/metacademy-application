/*
 This file contains the graph-data model, which is a wrapper model for the nodes, edges, and auxiliary models
 */

define(["backbone", "agfk/collections/node-property-collections", "agfk/collections/node-collection", "agfk/models/node-model"], function(Backbone, NodePropertyCollections, NodeCollection, NodeModel){

  /**
   * GraphOptionsModel: model to store graph display/interaction options
   */
  var GraphOptionsModel =  (function(){
    return Backbone.Model.extend({
      defaults:{
        showLearnedConcepts: true
      },

      /**
       * helper function to set the showLearnedConcepts and fire appropriate change events when "changing" from false to false
       * (i.e. clearing the newly learned concepts)
       */
      setLearnedConceptsState: function(state){
        if (state === this.get("showLearnedConcepts") && state === false){
          this.trigger("change");
          this.trigger("change:showLearnedConcepts");
        }
        else{
          this.set("showLearnedConcepts", state);
        }
      }
    });
  })();

  /**
   * GraphAuxModel: model to store all auxiliary graph information
   */
  var GraphAuxModel = (function(){

    // private data (not currently used)
    var pvt = {
      dependencies: {},
      timeEstimates: {},
      shortcutDependencies: {},
      loadedGraph: false,
    };

    return Backbone.Model.extend({
      defaults: {
        depRoot: undefined,
        titles: {},
        nodes: new NodeCollection(),
        shortcuts: new NodeCollection(),
      },

      initialize: function(){
        var url = window.CONTENT_SERVER + '/full_graph',
            thisModel = this;
        $.get(url, function(data) {
          if ("nodes" in data) {
            var nodesObj = _.map(data.nodes, function(node) {
              var temp = _.extend(node, {"id": node.tag, "sid": node.id})
              return NodeModel.prototype.parse(temp);
            });
            thisModel.set("nodes", new NodeCollection(nodesObj));
          }
          if ("shortcuts" in data) {
            var shortcutsObj = _.map(data.shortcuts, function(node) {
              var temp = _.extend(node, {"id": node.tag, "sid": node.id})
              return NodeModel.prototype.parse(temp);
            });
            thisModel.set("shortcuts", new NodeCollection(shortcutsObj));
          }
        });
        pvt.loadedGraph = true;
      },

      resetEstimates: function(){
        pvt.dependencies = {};
        pvt.timeEstimates = {};
        pvt.shortcutDependencies = {};
      },

      conceptIsLearned: function(tag){
        var learnedConcepts = this.parentModel.parentModel.get("userData").get("learnedConcepts"),
        nodes = this.get("nodes");
        if (!nodes.findWhere({"id": tag})) {
          return false;
        }
        id = nodes.findWhere({"id": tag}).get("sid");
        return learnedConcepts.findWhere({id: id});
      },

      computeDependencies: function(tag, isShortcut){
        var nodes = this.get("nodes"),
            shortcuts = this.get("shortcuts"),
            thisModel = this;

        console.log('computeDependencies ' + tag + ' ' + isShortcut);

        if (isShortcut && shortcuts.findWhere({"id": tag})) {
          var node = shortcuts.findWhere({"id": tag});
          var dependenciesObj = pvt.shortcutDependencies;
        } else if (nodes.findWhere({"id": tag})) {
          var node = nodes.findWhere({"id": tag});
          var dependenciesObj = pvt.dependencies;
        } else {
          // shouldn't happen
          return [];
        }

        if (dependenciesObj.hasOwnProperty(tag)) {
          return dependenciesObj[tag];
        }
        
        var result = [];
        dependenciesObj[tag] = result;     // so that we don't get into an infinite loop if there's a cycle


        node.get("dependencies").each(function(dep) {
          currDep = {'from_tag': dep.get("from_tag"), 'shortcut': dep.get("shortcut")};
          if (!thisModel.conceptIsLearned(dep.get("from_tag"))) {
            result = _.union(result, [currDep], thisModel.computeDependencies(dep.get("from_tag"), dep.get("shortcut")));
            result = _.unique(result, false, function(dep) { return dep.from_tag + ':' + dep.shortcut; });
          }
        });

        dependenciesObj[tag] = result;
        return result;
      },

      computeTimeEstimate: function(tag){
        var fullGraph = this.get("fullGraph"),
            nodes = this.get("nodes"),
            shortcuts = this.get("shortcuts"),
            node = nodes.findWhere({"id": tag});

        if (!node) {
          return '';
        }

        if (!(tag in pvt.timeEstimates)) {
          var deps = this.computeDependencies(tag, 0);

          // eliminate redundant shortcuts
          deps = _.filter(deps, function(dep) {
            if (dep.shortcut) {
              var found = _.where(deps, {"from_tag": dep.from_tag, "shortcut": 0});
              return found.length == 0;
            }
            return true;
          });

          var total = 0;
          _.each(deps, function(dep) {
            var depShortcut = shortcuts.findWhere({"id": dep.from_tag}),
                depNode = nodes.findWhere({"id": dep.from_tag});
            if (dep.shortcut && depShortcut && depShortcut.get("time")) {
              total += depShortcut.get("time");
            } else if (depNode && depNode.get("time")) {
              total += depNode.get("time");
            } else {
              total += 1;
            }
          });

          if (node.get("time")) {
            total += node.get("time");
          } else {
            total += 1;
          }

          pvt.timeEstimates[tag] = total;
        }
        
        return pvt.timeEstimates[tag];
      },

      /**
       * Get node display title from id
       */
      getTitleFromId: function(nid){
        return this.get("titles")[nid]; 
      }
    });
  })();
  
  /**
   * GraphData: model to store all graph related data (nodes, edges, aux data)
   */
  return (function(){
    var pvt = {};
    return Backbone.Model.extend({
      /**
       * default user states
       */
      defaults: function(){
        return {
          nodes: new NodeCollection(),
          edges: new NodePropertyCollections.GraphEdgeCollection(),
          aux: new GraphAuxModel(),
          options: new GraphOptionsModel()
        };
      },

      /**
       * initialize graph data (place parentModel field in child models)
       */
      initialize: function(){
        this.get("nodes").parentModel = this;
        this.get("edges").parentModel = this;
        this.get("aux").parentModel = this;
        this.get("options").parentModel = this;
      }
    });
  })();
});
