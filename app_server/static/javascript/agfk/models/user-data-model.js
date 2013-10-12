/*
This file contains the user data model, which contains the user-specific data that synces with the app server
*/
define(["backbone"], function(Backbone){

  var USER_CONSTS = {
    userPath: "/user/",
    learnedConceptPath: "/user/learned/",
    starredConceptPath: "/user/starred/"
  };
  
  // wrapper model for learned concepts
  var UserConcept = Backbone.Model.extend({    
    defaults:{
      id: "",
      useCsrf: true
    }
  });

  // wrapper collection for learned concepts
  var ConceptsCollection = Backbone.Collection.extend({
    model: UserConcept,
    url: function(){
      return {"learned": USER_CONSTS.learnedConceptPath,
              "starred": USER_CONSTS.starredConceptPath}[this.type || "learned"];
    },
    
    initialize: function(args){
      this.type = args.type;
    },
    
    parse: function(resp, xhr){
      var i = resp.length,
          res = [];
      while(i--){
        res.push({id: resp[i]});
      }
      return res;
    }
  });


  /** 
   * UserData: model to store user data -- will eventually communicate with server for registered users
   */
  var UserModel = (function(){
    // define private methods and variables
    var pvt = {};

    pvt.createDestroyUserConcept = function(conceptCollection, status, nodeSid){
      if (status && !conceptCollection.get(nodeSid)) {
        conceptCollection.create({id: nodeSid});
        return true;
      } else if (!status) {
        conceptCollection.get(nodeSid).destroy({id: nodeSid});
        return true;
      }
      return false;
    };
    
    pvt.learnedConceptsPopulated = false;
    pvt.starredConceptsPopulated = false;

    // return public object
    return Backbone.Model.extend({

      url: USER_CONSTS.userPath,
      
      /**
       * default user states
       */
      defaults: function() {
        return {
          learnedConcepts: new ConceptsCollection({type: "learned"}),
          starredConcepts: new ConceptsCollection({type: "starred"}),
          visibleNodes: {},
          implicitLearnedNodes: {}
        };
      },

      initialize: function(inp){
        var thisModel = this,
            lConcepts = thisModel.get("learnedConcepts"),
            sConcepts = thisModel.get("starredConcepts");

        if (!pvt.learnedConceptsPopulated){
          thisModel.listenTo(lConcepts, "reset", function(){
            pvt.learnedConceptsPopulated = true;
          });
        }
        if (!pvt.starredConceptsPopulated){
          thisModel.listenTo(sConcepts, "reset", function(){
            pvt.starredConceptsPopulated = true;
          });
        }
      },

      parse: function(inp){
        var lConcepts = this.get("learnedConcepts") || this.defaults().learnedConcepts,
            sConcepts = this.get("starredConcepts") || this.defaults().starredConcepts;
        if (inp && inp.learned){
          lConcepts.add(inp.learned, {parse: true});
          pvt.learnedConceptsPopulated = true;
        }
        if (inp && inp.starred){
          sConcepts.add(inp.starred, {parse: true});
          pvt.starredConceptsPopulated = true;
        }
        return {learnedConcepts: lConcepts, starredConcepts: sConcepts};
      },

      areLearnedConceptsPopulated: function(){
        return pvt.learnedConceptsPopulated;
      },

      areStarredConceptsPopulated: function(){
        return pvt.starredConceptsPopulated;
      },

      isLearned: function(conceptId){
        return this.get("learnedConcepts").get(conceptId) !== undefined;
      },      

      isStarred: function(conceptId){
        return this.get("starredConcepts").get(conceptId) !== undefined;
      },      

      /**
       * Setter function that triggers an appropriate change event
       */
      updateLearnedConcept: function(nodeTag, nodeSid, status){
        var changed = pvt.createDestroyUserConcept.call(this, this.get("learnedConcepts"), status, nodeSid);
        var learnedTrigger = window.agfkGlobals.auxModel.getConsts().learnedTrigger;
        if (changed) {
          this.trigger(learnedTrigger, nodeTag, nodeSid, status);
        }
      },

      updateStarredConcept: function(nodeTag, nodeSid, status){
        var changed = pvt.createDestroyUserConcept.call(this, this.get("starredConcepts"), status, nodeSid);
        var starredTrigger = window.agfkGlobals.auxModel.getConsts().starredTrigger;
        if (changed) {
          this.trigger(starredTrigger, nodeTag, nodeSid, status);
        }
      }
    });
  })();

  return UserModel;
});
