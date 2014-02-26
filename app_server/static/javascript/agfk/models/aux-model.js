
/*global define*/
define(["backbone", "underscore", "agfk/collections/detailed-node-collection"], function(Backbone, _, NodeCollection){
  /**
   * AuxModel: model to store all auxiliary information used throughout metacademy
   * All data associated with the aux model should be read only
   */
  var AuxModel = (function(){

    // private data obj
    var pvt = {
      timeEstimates: {},
      loadedGraph: false
    };

    /* change learned/starred concept state */
    pvt.toggleUserConceptState = function(state, nodeId) {
      var userModel = this.userModel;
      if (userModel){
        if (state === "learned"){
          userModel.updateLearnedConcept(nodeId, !userModel.isLearned(nodeId));
        } else{
          userModel.updateStarredConcept(nodeId, !userModel.isStarred(nodeId));
        }
        return true;
      }
      return false;
    };

    return Backbone.Model.extend({
      defaults: {
        //nodes: new NodeCollection()
        //shortcuts: new NodeCollection()
      },

      getConsts: function(){
        return {
          starredTrigger: "change:starredConcepts",
          learnedTrigger: "change:learnedConcepts"
        };
      },

      /* this should be called after the user data is initialized */
      setUserModel: function(usm){
        var thisModel = this,
            gConsts = this.getConsts(),
            learnedTrigger = gConsts.learnedTrigger,
            starredTrigger = gConsts.starredTrigger;

        thisModel.userModel = usm;

        // trigger events from user model (Allows other models to act accordingly w/out depending on the user model itself)
        thisModel.listenTo(usm, learnedTrigger, function(nodeTag, status){
          thisModel.resetEstimates();
          thisModel.trigger(learnedTrigger, nodeTag, status);
          thisModel.trigger(learnedTrigger + nodeTag, nodeTag, status);
        });
        thisModel.listenTo(usm, starredTrigger, function(nodeTag, status){
          thisModel.trigger(starredTrigger, nodeTag, status);
          thisModel.trigger(starredTrigger + nodeTag, nodeTag, status);
        });
      },

      getUserModel: function(){
        return this.userModel;
      },

      /* toggle learned status of concept in the user model */
      toggleLearnedStatus: function(){
        var args = Array.prototype.slice.call(arguments);
        args.unshift("learned");
        pvt.toggleUserConceptState.apply(this, args);
      },

      /* toggle starred status of concept in the user model */
      toggleStarredStatus: function(){
        var args = Array.prototype.slice.call(arguments);
        args.unshift("starred");
        pvt.toggleUserConceptState.apply(this, args);
      },

      /**
       * Reset learning time estimates
       */
      resetEstimates: function(){
        pvt.timeEstimates = {};
        this.trigger("reset:estimates");
      },

      /**
       * Returns true if userData model has the input concept marked as "learned"
       */
      conceptIsLearned: function(id){
        return this.userModel.isLearned(id);
      },

      /**
       * Returns true if userData model has the input concept marked as "starred"
       */
      conceptIsStarred: function(id){
        return this.userModel.isStarred(id);
      },

      /* Finds all (learned) dependendcies of input "tag" */
      computeAllDependencies: function(tag, isShortcut, onlyUnlearned){
        var nodes =  this.get("nodes"),
            shortcuts = this.get("shortcuts"),
            thisModel = this,
            node,
            dependenciesObj;

        if (onlyUnlearned && thisModel.conceptIsLearned(tag)){
          return [];
        }

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
          var fromTag = dep.get("from_tag"),
              currDep = {'from_tag': fromTag, 'shortcut': dep.get("shortcut")};
          if (!onlyUnlearned || !thisModel.conceptIsLearned(fromTag)) {
            result = _.union(result, [currDep], thisModel.computeUnlearnedDependencies(fromTag, dep.get("shortcut")));
            result = _.unique(result, false, function(dep) { return dep.from_tag + ':' + dep.shortcut; });
          }
        });

        dependenciesObj[tag] = result;
        return result;
      },

      /**
       * returns an array of node ids traversed during a dfs from the input leaf
       * leaf - the beginning leaf node
       * doesLearnedBlock - True if learned nodes are not traversed
       */
      dfsFromNode: function (leaf, doesLearnedBlock) {
        var thisModel = this;
        if (doesLearnedBlock && thisModel.conceptIsLearned(leaf.id)){
          return [];
        }

        var toTraverse = [leaf],
            traversedIds = [leaf.id];

        // DFS
        while (toTraverse.length) {
          var node = toTraverse.shift();
          node.get("dependencies").each(function(dep) {
            var src = dep.get("source");
            if (traversedIds.indexOf(src.id) === -1 && (!doesLearnedBlock || !thisModel.conceptIsLearned(src.id))) {
              toTraverse.push(src);
              traversedIds.push(src.id);
            }
          });
        }
        return traversedIds;
      },


      /**
       * Finds the unlearned dependencies of a concept with tag 'tag'
       */
      computeUnlearnedDependencies: function(tag, isShortcut){
        return this.computeAllDependencies(tag, isShortcut, true);
      },

      /**
       * Computes the learning time estimate for concept with tag 'tag'
       * Uses a DFS to compute the learning time estimate
       * Concepts without a learning time estimate are currently given a default value of 1 hour
       */
      computeTimeEstimate: function(id){
      // TODO aux computeTimeEstimate should take place on the server
      // FIXME
        return 1;
      }
    });
  })();
  return AuxModel;
});
