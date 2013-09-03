/*
This file contains the user data model, which contains the user-specific data that synces with the app server
*/
define(["backbone"], function(Backbone){

  var USER_CONSTS = {
    userPath: "/user/",
    learnedConceptPath: "/user/learned/"
  };
  
  // wrapper model for learned concepts
  var LearnedConcept = Backbone.Model.extend({
    
    defaults:{
      id: "",
      useCsrf: true
    }
  });

  // wrapper collection for learned concepts
  var LearnedConceptsCollection = Backbone.Collection.extend({
    model: LearnedConcept,
    url: USER_CONSTS.learnedConceptPath,
    
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

    pvt.learnedConceptsPopulated = false;

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
          learnedConcepts: new LearnedConceptsCollection(),
          visibleNodes: {},
          implicitLearnedNodes: {}
        };
      },

      initialize: function(){
        var thisModel = this,
            lConcepts = thisModel.get("learnedConcepts");
        lConcepts.bind("change:learnStatus", function(){
          thisModel.trigger("change:learnStatus", lConcepts);
        });
        thisModel.listenTo(lConcepts, "reset", function(){
          pvt.learnedConceptsPopulated = true;
        });
      },

      areLearnedConceptsPopulated: function(){
        return pvt.learnedConceptsPopulated;
      },

      /**
       * Setter function that triggers an appropriate change event
       */
      updateLearnedNodes: function(nodeTag, status, nodeSid){
        var learnedConcepts = this.get("learnedConcepts");
        if (status && !learnedConcepts.get(nodeSid)) {
          learnedConcepts.create({id: nodeSid});
        } else if (!status) {
          learnedConcepts.get(nodeSid).destroy({id: nodeSid});
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
