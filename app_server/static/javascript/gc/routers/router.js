define(["backbone", "gc/views/graph-editor-view", "gc/models/editable-graph-model"], 
function(Backbone, GraphEditorView, GraphEditorModel){
    return Backbone.Router.extend({
       routes: {
         "": "showGCEditor"
       },

     showGCEditor: function(){
       // feed graph creator into the appropriate view
       var thisRoute = this;
       thisRoute.geView = new GraphEditorView({model: new GraphEditorModel()});
       thisRoute.geView.render();
     }

   });
 });
