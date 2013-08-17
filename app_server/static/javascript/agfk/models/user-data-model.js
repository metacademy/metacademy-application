/*
This file contains the user data model, which contains the user-specific data that synces with the app server
*/


window.define(["backbone"], function(Backbone){
  /** 
   * UserData: model to store user data -- will eventually communicate with server for registered users
   */
  return  (function(){
    // define private methods and variables
    var pvt = {};
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
      /**
       * default user states
       */
      defaults: function() {
        return {
          learnedNodes: {},
          visibleNodes: {},
          implicitLearnedNodes: {}
        };
      },
      
      /**
       * Setter function that triggers an appropriate change event
       */
      updateLearnedNodes: function(nodeName, status){
        return pvt.updateObjProp.call(this, "learnedNodes", nodeName, status);
      },

      /**
       * Setter function that triggers an appropriate change event
       */
      updateImplicitLearnedNodes: function(nodeName, status){
        return pvt.updateObjProp.call(this, "implicitLearnedNodes", nodeName, status);
      },

      /**
       * Setter function that triggers an appropriate change event
       */
      updateVisibleNodes: function(nodeName, status){
        return pvt.updateObjProp.call(this, "visibleNodes", nodeName, status);
      }
    });
  })();
});
