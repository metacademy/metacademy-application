// FIXME TODO - must return errors to the user in an elegant way, both client side (here) and from the server

/*global define*/
define(["backbone", "underscore", "jquery", "gc/views/base-editor-view", "gen-utils", "noty"], function(Backbone, _, $, BaseEditorView, GenUtils){
  return  (function(){

    var pvt = {};
    pvt.consts = {
      templateId: "global-resource-editor-template",
      ecClass: "expanded",
      addGRTitleWrapClass: "gresource-title-wrap",
      grSearchButtonClass: "grsearch",
      grFinishEditingClass: "end-gr-edit",
      grSearchInputClass: "gresource-search",
      searchResId: "global-resource-search-result-template",
      grsearchResClass: "grsearch-results"
    };

    return BaseEditorView.extend({
      template: _.template(document.getElementById(pvt.consts.templateId).innerHTML),

      events: function () {
        var oevts = BaseEditorView.prototype.events();
        oevts["click ." + pvt.consts.grSearchButtonClass] = "clickSearchButton";
        oevts["blur .author-field"] = "blurAuthorField";
        oevts["click .grres"] = "clickSearchRes";
        oevts["keyup .gresource-search"] = "keyupGresourceSearch";
        oevts["click .edit-gr span"] = "clickEditGR";
        oevts["click ." + pvt.consts.grFinishEditingClass] = "clickEndGR";
        oevts["click .add-new-gr"] = "clickNewGR";
        //oevts["blur .gresource-title"] = "blurGlobalResourceTitle";
        return oevts;
      },

      initialize: function () {
        _.bindAll(this);
        this.sresTemp = _.template(document.getElementById(pvt.consts.searchResId).innerHTML);
      },

      /**
       * render the view and return the view element
       */
      render: function(){
        var thisView = this;
        thisView.isRendered = false;

        thisView.$el.html(thisView.template(thisView.model.attributes));
        // var acOpts = {
        //   containerEl: thisView.$el.find("." + pvt.consts.addGRTitleWrapClass)[0],
        //   acUrl: "/graphs/autocomplete"
        // };
        // var obtainGETData = function (val) {
        //   return {ac: val, type: "globalresource"};
        // };

        //thisView.autocomplete = new GenUtils.Autocomplete(acOpts, obtainGETData, null, thisView.loadGResource);

        thisView.isRendered = true;
        return thisView;
      },

      /**
       * Load a global resource into the model from an ajax request
       */
      loadGResource: function (id) {
        console.log(id);
        if (!id) {return;}

        var thisView = this,
            thisModel = thisView.model;

        // check if it's in the global gresources
        var grs = window.agfkGlobals.globalResources;
        if (grs.hasOwnProperty(id)) {
          thisView.conceptModel.set("global_resource", grs[id]);
          thisView.model = grs[id];
          thisModel = grs[id];
          thisView.loadingFromAc = true;
          thisView.parentView.render();
          thisView.conceptModel.save(null, {parse: false, error: thisView.attrErrorHandler});
          thisView.loadingFromAc = false;
        } else {
          var prevId = thisModel.id;
          thisModel.id = id;
          thisView.loadingFromAc = true;
          thisModel.fetch({parse: true, success: function () {
            thisView.conceptModel.save(null, {parse: false, error: thisView.attrErrorHandler});
            thisView.parentView.render();
            thisView.loadingFromAc = false;
          },
                           error: function () {
                             window.noty({
                               timeout: 5000,
                               type: 'error',
                               maxVisible: 1,
                               dismissQueue: false,
                               text: "Unable to get global resource from the server."
                             });
                           }});
        }
      },

      blurGlobalResourceTitle: function (evt) {
        var thisView = this,
            globalGResources = window.agfkGlobals.globalResources,
            gid = thisView.model.id;
        if (!evt.currentTarget.value || thisView.loadingFromAc || $(evt.relatedTarget).hasClass(pvt.consts.acLiClass)) {
          return;
        }
        if (!globalGResources.hasOwnProperty(gid)){
          globalGResources[gid] = thisView.model;
        }
        thisView.blurTextField(evt);
      },

      /**
       * blurAuthorField: change author field in the resource model
       * -- array separated by "and"
       */
      blurAuthorField: function (evt) {
        var thisView = this,
            curTar = evt.currentTarget,
            attrName = curTar.name.split("-")[0],
            inpText = curTar.value,
            authors = inpText.split(/\s+and\s+/i),
            saveObj = {};
        if (thisView.model.get(attrName) !== authors) {
          saveObj[attrName] = authors;
          thisView.model.save(saveObj, {parse: false, patch: true, error: thisView.attrErrorHandler});
        }
      },

      clickSearchButton: function (evt) {
        var thisView = this,
            searchText = thisView.$el.find("." + pvt.consts.grSearchInputClass).val(),
            htmlRes = "";
        $.getJSON("/graphs/gresource-search", {"searchtext": searchText}, function (data) {
          var htmlStr = data.map(function (val) {
            return thisView.sresTemp(val);
          }).join("\n");

          htmlStr = htmlStr || "<h2 class='no-results'>No Search Results</h2>";
          htmlStr += "\n" + "<button class='add-new-gr'>Add New Resource</button>";
          thisView.$el.find("." + pvt.consts.grsearchResClass).html(htmlStr);
        });
      },

      clickSearchRes: function (evt) {
        this.loadGResource($(evt.currentTarget).find("input").val());
      },

      clickEditGR: function () {
        this.gredit = true;
        this.render();
      },

      clickEndGR: function () {
        this.gredit = false;
        this.parentView.render();
      },

      clickNewGR: function () {
        this.clickEditGR();
      },

      keyupGresourceSearch: function (evt) {
        if (evt.keyCode === 13) {            // enter key
          this.clickSearchButton();
        }
      }
    });
  })();
});
