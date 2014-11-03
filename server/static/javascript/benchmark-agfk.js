/*
 this file benchmarks the in-browser performance of agfk
 TODO: automate this benchmarking with a cron job on the server and save results
 */

//  FIXME this file is deprecated

// need to load jquery and requirejs in the main html page
jQuery.noConflict();

var BENCHMARK_PREFIX_URL = "/dev/benchmarktest";

(function($) {
  /**
   * @property {object} jQuery plugin which runs handler function once specified element is inserted into the DOM
   * @param {function} handler A function to execute at the time when the element is inserted
   * @param {bool} shouldRunHandlerOnce Optional: if true, handler is unbound after its first invocation
   * @example $(selector).waitUntilExists(function);
   */
  window.waitUntilExists = function(handler, shouldRunHandlerOnce, isChild) {
    var found   = 'found';
    var $this   = $(this.selector);
    var $elements       = $this.not(function () { return $(this).data(found); }).each(handler).data(found, true);
    
    if (!isChild)
    {
      (window.waitUntilExists_Intervals = window.waitUntilExists_Intervals || {})[this.selector] =
        window.setInterval(function () { window.waitUntilExists.call($this, handler, shouldRunHandlerOnce, true); }, 500)
      ;
    }
    else if (shouldRunHandlerOnce && $elements.length)
    {
      window.clearInterval(window.waitUntilExists_Intervals[this.selector]);
    }   
    return $this;
  };
})(window.jQuery);

function log(msg){
  console.log(msg);
}

(function firstTest() {
  // set the URLs here
  var urlTest1 = "hierarchical_dirichlet_process#lfocus=hierarchical_dirichlet_process&mode=learn";
  window.history.pushState("", "", window.BENCHMARK_PREFIX_URL + '/' + urlTest1);
  var parseCompleteId = "node-detail-view-hierarchical_dirichlet_process",
      lrStartTime = new Date().getTime();
  jQuery.getScript(window.STATIC_PATH + "javascript/agfk/main.js");
  waitUntilExists.call(jQuery("#" + parseCompleteId), function(){
    var finTime = new Date().getTime();
    log("Logistic regression learning generation took: " + (finTime - lrStartTime));
    secondTest();
  });
})();


function secondTest(){
  var urlTest1 = "hierarchical_dirichlet_process#mode=explore",
      parseCompleteId = "graph1";
  
  waitUntilExists.call(  jQuery("#" + parseCompleteId), function(){
    var finTime = new Date().getTime();
    log("Logistic regression explore generation took: " + (finTime - lrStartTime)); 
  });
  var lrStartTime = new Date().getTime();
  window.location.href =  window.BENCHMARK_PREFIX_URL + "/hierarchical_dirichlet_process#mode=explore";
};
