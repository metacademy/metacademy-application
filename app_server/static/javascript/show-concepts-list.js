/*
 This file obtains a list of all concepts from the content server and displays them to the user
 */
window.onload = (function($, _, undefined){
  // parse window parameters -- TODO or we could insert this information serverside
  var paramStr = window.location.href.split('?').pop(),
      courseName = "";
  if (paramStr.length > 0){
    var cmatch;
    _.forEach(paramStr.split("&"), function(pval){
      if ((cmatch = pval.match(/course=(\S)/i))){
        courseName = cmatch.pop();
      }
    });
  }

  // helper function for creating letter headers
  function getLetterHeader(letter){
    return "<h2>" + letter.toUpperCase() + "</h2>\n";
  }
  
  // TODO fix all of the hardcoding if possible
  var template = _.template(document.getElementById("list-concept-item-template").innerHTML);
  
  // load the list titles and tags from the server
  $.getJSON(window.CONTENT_SERVER + '/list' + (courseName.length ? "?course=" + courseName : ""),
    function(listData){
      // render the list titles alphabetically
      listData.sort(function(itma, itmb){
        return itma.title.toLowerCase().localeCompare(itmb.title.toLowerCase());
      });
      var innerListTxt = "<ul>\n",
          prevStartLtr = "",
          thisLtr = "";
      _.forEach(listData, function(listItm){
        thisLtr = listItm.title.substring(0,1).toLowerCase();
        if (thisLtr !== prevStartLtr){
          innerListTxt += "</ul>\n";
          prevStartLtr = thisLtr;
          innerListTxt += getLetterHeader(thisLtr) + "<ul>";
        }
        innerListTxt += template(listItm);
      });
      innerListTxt += "</ul>";
      $('.list-concepts-wrapper').append(innerListTxt);
    });
})(window.$, window._);
