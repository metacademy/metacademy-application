
/*global define*/
define(["backbone", "agfk/models/concept-resource-model"], function(Backbone, ConceptResource){
return Backbone.Collection.extend({
    model: ConceptResource,

    /**
     * Returns a backbone collection of the free resources TODO does this maintain the cid correctly?
     */
    getFreeResources: function(){
      return new ResourceCollection(this.where({free: 1, requires_signup: 0}));
    },

    getFreeSignupResources: function(){
      return new ResourceCollection(this.where({free: 1, requires_signup: 1}));
    },

    /**
     * Returns a backbone collection of the paid resources TODO does this maintain the cid correctly?
     */
    getPaidResources: function(){
      return new ResourceCollection(this.where({free: 0}));
    },

    getCore: function(){
      return new ResourceCollection(this.where({core: 1}));
    },

    getSupplemental: function(){
      return new ResourceCollection(this.where({core: 0}));
    }

  });
});
