define(["underscore", "agfk/models/node-model", "agfk/collections/node-property-collections"], function(_, Node, NodePropertyCollections){

  var pvt = {};

    /**
   * Simple function to break long strings and insert a hyphen (idea from http://ejohn.org/blog/injecting-word-breaks-with-javascript/)
   * str: string to be potentially hyphenated
   * num: longest accecptable length -1 (single letters will not be broken)
   */
  pvt.wbr = function(str, num) {
    return str.replace(RegExp("(\\w{" + num + "})(\\w{3," + num + "})", "g"), function(all,text, ch){
      return text + "-\\n" + ch;
    });
  };

  var DetailedNode = Node.extend({
      collFields: ["questions", "dependencies", "outlinks", "resources"],
      
      txtFields: ["id", "sid", "title", "summary", "goals", "pointers", "is_shortcut", "flags", "time"],

    defaults: function(){
      var dnDefaults = {
        questions: new NodePropertyCollections.QuestionCollection(),
        resources: new NodePropertyCollections.ResourceCollection(),
        flags: [],
        goals: "",
        pointers: ""
      };
      return _.extend({}, Node.prototype.defaults(), dnDefaults);
    },
    
    /**
     * Wrap a long string to avoid elongated graph nodes. Translated/modified from server technique
     */
    wrapNodeText: function(s, width) {
      if (!s) {
        return '';
      }
      s = s.replace(/-/g, " ");
      var parts = s.split(" "),
          result = [],
          resArr = [],
          total = 0;

      for (var i = 0; i < parts.length; i++) {
        if (total + parts[i].length + 1 > width && total !== 0) {
          resArr.push(result.join(" "));
          result = [];
          total = 0;
        }
        result.push(pvt.wbr(parts[i], width));
        total += parts[i].length + 1;
      }
      resArr.push(result.join(" "));
      return resArr.join("\\n");
    },

    /**
     * returns and caches the node display title
     */
    getNodeDisplayTitle: function(numCharNodeLine){
      if (!this.nodeDisplayTitle){
        var title = this.get("title") || this.id.replace(/_/g, " ");
        title += this.get("is_shortcut") ? " (shortcut)" : "";
        this.nodeDisplayTitle = this.wrapNodeText(title, numCharNodeLine || 9);
      }
      return this.nodeDisplayTitle;
    }
  });

  return DetailedNode;
});
