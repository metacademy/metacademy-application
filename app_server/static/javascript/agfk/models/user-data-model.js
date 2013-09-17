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

    /**
     * Internal function to change dictionary objects 
     * objName: name of object property
     * arName: name of add/remove property of objName
     * arStatus: truthy values assign objName.arName = arStatus; falsy deletes objName.arName
     */
    pvt.updateObjProp = function(objName, arName, arStatus){
      var thisModel = this;
      if (!thisModel.get(objName)){return false;}

      var retVal;
      if (arStatus){
        thisModel.get(objName)[arName] = arStatus;
        thisModel.trigger("change:" + objName);
        retVal = true;
      }
      else if (thisModel.get(objName).hasOwnProperty(arName)){
        delete thisModel.get(objName)[arName];
        thisModel.trigger("change:" + objName);
        retVal = true;
      }
      else{
        retVal = false;
      }
      return retVal;
    };

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

      initialize: function(){
        var thisModel = this,
            lConcepts = thisModel.get("learnedConcepts"),
            sConcepts = thisModel.get("starredConcepts");

        // note: the folowing are not getting triggered   -RBG
        lConcepts.bind("change:learnStatus", function(){
          thisModel.trigger("change:learnStatus", lConcepts);
        });
        sConcepts.bind("change:starStatus", function(){
          thisModel.trigger("change:starStatus", sConcepts);
        });
        
        thisModel.listenTo(lConcepts, "reset", function(){
          pvt.learnedConceptsPopulated = true;
        });
        thisModel.listenTo(sConcepts, "reset", function(){
          pvt.starredConceptsPopulated = true;
        });
      },

      areLearnedConceptsPopulated: function(){
        return pvt.learnedConceptsPopulated;
      },

      areStarredConceptsPopulated: function(){
        return pvt.starredConceptsPopulated;
      },

      /**
       * Setter function that triggers an appropriate change event
       */
      updateLearnedConcept: function(nodeTag, status, nodeSid){
        var changed = pvt.createDestroyUserConcept.call(this, this.get("learnedConcepts"), status, nodeSid);
        if (changed) {
          this.trigger("change:learnedConcepts");
        }
      },

      updateStarredConcept: function(nodeTag, status, nodeSid){
        var changed = pvt.createDestroyUserConcept.call(this, this.get("starredConcepts"), status, nodeSid);
        if (changed) {
          this.trigger("change:starredConcepts");
        }
      },

      /**
       * Setter function that triggers an appropriate change event
       */
      updateImplicitLearnedNodes: function(nodeTag, status, nodeSid){
        return pvt.updateObjProp.call(this, "implicitLearnedNodes", nodeSid, status);
      },

      /**
       * Setter function that triggers an appropriate change event
       */
      updateVisibleNodes: function(nodeTag, status, nodeSid){
        return pvt.updateObjProp.call(this, "visibleNodes", nodeSid, status);
      }
    });
  })();

  return UserModel;
});
