define(["backbone", "underscore", "agfk/collections/node-collection"], function(Backbone, _, NodeCollection){
  /**
   * AuxModel: model to store all auxiliary information used throughout metacademy
   * All data associated with the aux model should be read only
   */
  var AuxModel = (function(){

    // private data obj
    var pvt = {
      dependencies: {},
      timeEstimates: {},
      shortcutDependencies: {},
      loadedGraph: false,
      DEFAULT_LEARNING_TIME: 1
    };

    return Backbone.Model.extend({
    
      defaults: {
        depRoot: undefined,
        titles: {},
        nodes: new NodeCollection(),
        shortcuts: new NodeCollection()
      },

      /**
       * parse aux data (data should be bootstrapped rather than ajaxed)
       */
      parse: function(resp, xhr){
        if (resp === null){
          return {};
        }

        var retObj = this.defaults;
        
        // depending on how aux is initialized, these may already be defined
        var nodes = retObj.nodes,
            shortcuts = retObj.shortcuts;
        
        if (resp.hasOwnProperty("nodes")) {
          nodes.add(resp.nodes, {parse: true});
        }
        if (resp.hasOwnProperty("shortcuts")) {
          shortcuts.add(resp.shortcuts, {parse: true});
        }
        pvt.loadedGraph = true;
        return retObj;
      },

      /* this should be called after the user data is initialized */
      setUserModel: function(usm){
        this.userModel = usm;
      },

      getUserModel: function(){
        return this.userModel;
      },

      /**
       * Reset learning time estimates
       */
      resetEstimates: function(){
        pvt.dependencies = {};
        pvt.timeEstimates = {};
        pvt.shortcutDependencies = {};
        this.trigger("reset:estimates");
      },

      /**
       * Returns true if userData attribute of app-model contains the concept for the input tag (note: must convert tag to server id)
       */
      conceptIsLearned: function(tag){
        if (this.userModel){
          var learnedConcepts = this.userModel.get("learnedConcepts"),
              node = this.get("nodes").get(tag);
          if (node){
            return learnedConcepts.get(node.get("sid"));
          }
        }
        return false;
      },

      /**
       * Finds the unlearned dependencies of a concept with tag 'tag' 
       */
      computeDependencies: function(tag, isShortcut){
        var nodes = this.get("nodes"),
            shortcuts = this.get("shortcuts"),
            thisModel = this,
            node,
            dependenciesObj;

        if (isShortcut && shortcuts.get(tag)) {
          node = shortcuts.get(tag);
          dependenciesObj = pvt.shortcutDependencies;
        } else if (nodes.get(tag)) {
          node = nodes.get(tag);
          dependenciesObj = pvt.dependencies;
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
          var currDep = {'from_tag': dep.get("from_tag"), 'shortcut': dep.get("shortcut")};
          if (!thisModel.conceptIsLearned(dep.get("from_tag"))) {
            result = _.union(result, [currDep], thisModel.computeDependencies(dep.get("from_tag"), dep.get("shortcut")));
            result = _.unique(result, false, function(dep) { return dep.from_tag + ':' + dep.shortcut; });
          }
        });

        dependenciesObj[tag] = result;
        return result;
      },

      /**
       * Computes the learning time estimate for concept with tag 'tag'
       * Uses a DFS to compute the learning time estimate
       * Concepts without a learning time estimate are currently given a default value of 1 hour
       */
      computeTimeEstimate: function(tag){
        var nodes = this.get("nodes"),
            shortcuts = this.get("shortcuts"),
            node = nodes.get(tag),
            DEFAULT_LEARNING_TIME = pvt.DEFAULT_LEARNING_TIME;

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
            var depShortcut = shortcuts.get(dep.from_tag),
                depNode = nodes.get(dep.from_tag);
            if (dep.shortcut && depShortcut && depShortcut.get("time")) {
              total += depShortcut.get("time");
            } else if (depNode && depNode.get("time")) {
              total += depNode.get("time");
            } else {
              total += DEFAULT_LEARNING_TIME;
            }
          });

          if (node.get("time")) {
            total += node.get("time");
          } else {
            total += DEFAULT_LEARNING_TIME;
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
  return AuxModel;
});
