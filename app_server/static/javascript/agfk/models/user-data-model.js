
/*
 This file contains the user data model, which contains the user-specific data that synces with the app server
 */

/*global define*/
define(["backbone", "underscore"], function(Backbone, _){

  var USER_CONSTS = {
    userPath: "/user/",
    conceptPath: "/user/concepts/"
  };

  // wrapper model for learned concepts
  var sharedVars = {};

  var UserConcept = Backbone.Model.extend({
    url: function(){
      return USER_CONSTS.conceptPath + this.id;
    },

    defaults: { id: "",
                useCsrf: true,
                learned: false,
                starred: false
              }
  });

  // wrapper collection for user concepts
  var ConceptsCollection = (function(){
    var pvt = {};

    /*
     *  Create or change a users concept state
     * returns true if the concept was created or changed and changes were propagated to the server
     *  call using pvt.createDestroyUserConcept.call(props)
     */
    pvt.changeUserConceptState = function(props){
      var thisColl = this,
          nodeSid = props.id,
          concept = thisColl.get(nodeSid);
      if (!concept){
        thisColl.create(props);
      } else{
        concept.save(props);
      }
      return true;
    };

    return Backbone.Collection.extend({
      model: UserConcept,

      initialize: function(args){
        this.type = args.type;
      },

      setStarredStatus: function(sid, status){
        return pvt.changeUserConceptState.call(this, {id: sid, starred: status});
      },

      setLearnedStatus: function(sid, status){
        return pvt.changeUserConceptState.call(this, {id: sid, learned: status});
      }
    });
  })();


  /**
   * UserData: model to store user data -- will eventually communicate with server for registered users
   */
  var UserModel = (function(){
    // define private methods and variables
    var pvt = {};

    pvt.isPopulated = false;

    // return public object
    return Backbone.Model.extend({

      url: USER_CONSTS.userPath,

      /**
       * default user states
       */
      defaults: function() {
        return {
          concepts: new ConceptsCollection({type: "learned"})
        };
      },

      /**
       * Parse the user data (should be bootstrapped)
       */
      parse: function(inp){
        var concepts = this.get("concepts") || this.defaults().concepts;
        concepts.add(inp.concepts);
        pvt.populated = true;
        return {concepts: concepts};
      },

      isModelPopulated: function(){
        return pvt.isPopulated;
      },

      isLearned: function(sid){
        var concept = this.get("concepts").get(sid);
        return concept && concept.get("learned");
      },

      isStarred: function(sid){
        var concept = this.get("concepts").get(sid);
        return concept && concept.get("starred");
      },

      /**
       * Setter function that triggers an appropriate change event
       */
      updateLearnedConcept: function(nodeTag, nodeSid, status){
        var changed = this.get("concepts").setLearnedStatus(nodeSid, status);
        var learnedTrigger = window.agfkGlobals.auxModel.getConsts().learnedTrigger;
        if (changed) {
          this.trigger(learnedTrigger, nodeTag, nodeSid, status);
        }
      },

      updateStarredConcept: function(nodeTag, nodeSid, status){
        var changed = this.get("concepts").setStarredStatus(nodeSid, status);
        var starredTrigger = window.agfkGlobals.auxModel.getConsts().starredTrigger;
        if (changed) {
          this.trigger(starredTrigger, nodeTag, nodeSid, status);
        }
      }
    });
  })();

  return UserModel;
});
