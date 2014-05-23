pjs.config({
  // options: 'stdout', 'file' (set in config.logFile) or 'none'
  log: 'stdout',
  // options: 'json' or 'csv'
  // options: 'stdout' or 'file' (set in config.outFile)
  writer: 'itemfile',
  format: 'raw'
});

pjs.addSuite({
  async: true,
  url: 'http://metacademy.org/list',
  moreUrls: function() {
    return _pjs.getAnchorUrls('.list-concepts-link');
  },
  maxDepth: 1,
  scraper: {
    async: true,
    scraper: function() {
      // console.log( "in scraper function " +  _pjs);
      if (document.title === "Concepts - Metacademy") {
        return;
      }
      _pjs.waitFor(function () {
        var retVal = document.getElementById("concept-list");
        // console.log("in waitFor eval: " + retVal);
        return retVal;
      }, function () {
        // console.log("in waitFor true");
        var savetxt = $("#main-display-view").html();
        // replace focus hashbangs with urls
        savetxt = savetxt.replace(/#([^"']+)/g, function(mstr, mgrp){
          var rres = /focus=([^&]+)/.exec(mgrp);
          if (rres) {
            return rres[1];
          } else {
            return mstr;
          }
        });
        _pjs.items = {content: savetxt,  filename: "../../nojs_concept_cache/" + window.location.pathname};
      });
    }
  }
});
