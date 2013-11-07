document.onload = (function(d3, saveAs, Blob, undefined){
  "use strict";

  // define graphcreator object
  var GraphCreator = function(svg, nodes, edges){


    // listen for resize
//    window.onresize = function(){thisView.updateWindow(svg);};

  //   // handle download data
  //   d3.select("#download-input").on("click", function(){
  //     var saveEdges = [];
  //     thisView.edges.forEach(function(val, i){
  //       saveEdges.push({source: val.source.id, target: val.target.id});
  //     });
  //     var blob = new Blob([window.JSON.stringify({"nodes": thisView.nodes, "edges": saveEdges})], {type: "text/plain;charset=utf-8"});
  //     saveAs(blob, "mydag.json");
  //   });


  //   // handle uploaded data
  //   d3.select("#upload-input").on("click", function(){
  //     document.getElementById("hidden-file-upload").click();
  //   });
  //   d3.select("#hidden-file-upload").on("change", function(){
  //     if (window.File && window.FileReader && window.FileList && window.Blob) {
  //       var uploadFile = this.files[0];
  //       var filereader = new window.FileReader();
        
  //       filereader.onload = function(){
  //         var txtRes = filereader.result;
  //         // TODO better error handling
  //         try{
  //           var jsonObj = JSON.parse(txtRes);
  //           thisView.deleteGraph(true);
  //           thisView.nodes = jsonObj.nodes;
  //           var newEdges = jsonObj.edges;
  //           newEdges.forEach(function(e, i){
  //             newEdges[i] = {source: thisView.nodes.filter(function(n){return n.id == e.source;})[0],
  //                         target: thisView.nodes.filter(function(n){return n.id == e.target;})[0]};
  //           });
  //           thisView.edges = newEdges;
  //           thisView.updateGraph();
  //         }catch(err){
  //           window.alert("Error parsing uploaded file\nerror message: " + err.message);
  //           return;
  //         }
  //       };
  //       filereader.readAsText(uploadFile);
        
  //     } else {
  //       alert("Your browser won't let you save this graph -- try upgrading your browser to IE 10+ or Chrome or Firefox.");
  //     }

  //   });

  //   // handle delete graph
  //   d3.select("#delete-graph").on("click", function(){
  //     thisView.deleteGraph(false);
  //   });
  // };

// should be handled with the model
  GraphCreator.prototype.setIdCt = function(idct){
    this.idct = idct;
  };

  // GraphCreator.prototype.consts =  {
  //   selectedClass: "selected",
  //   connectClass: "connect-node",
  //   circleGClass: "conceptG",
  //   graphClass: "graph",
  //   activeEditId: "active-editing",
  //   BACKSPACE_KEY: 8,
  //   DELETE_KEY: 46,
  //   ENTER_KEY: 13,
  //   nodeRadius: 50
  // };

  /* PROTOTYPE FUNCTIONS */

  GraphCreator.prototype

  GraphCreator.prototype.

  /* select all text in element: taken from http://stackoverflow.com/questions/6139107/programatically-select-text-in-a-contenteditable-html-element */
  GraphCreator.prototype.

 
  
  // remove edges associated with a node (NOWTODO figure out w/r/t models)
  GraphCreator.prototype.spliceLinksForNode = function(node) {
    var thisView = this,
        toSplice = thisView.edges.filter(function(l) {
      return (l.source === node || l.target === node);
    });
    toSplice.map(function(l) {
      thisView.edges.splice(thisView.edges.indexOf(l), 1);
    });
  };

  GraphCreator.prototype.

  GraphCreator.prototype.
  

  GraphCreator.prototype.

  // mousedown on node
  GraphCreator.prototype.

  /* place editable text on node in place of svg text */
  GraphCreator.prototype.;

  // mouseup on nodes
  GraphCreator.prototype.

  // mousedown on main svg
  GraphCreator.prototype.

  // call to propagate changes to graph
  GraphCreator.prototype.updateGraph = function(){
;

  GraphCreator.prototype.

  GraphCreator.prototype.updateWindow = function(svg){
    var docEl = document.documentElement,
        bodyEl = document.getElementsByTagName('body')[0];
    var x = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth;
    var y = window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;
    svg.attr("width", x).attr("height", y);
  };


  
  /**** MAIN ****/

  // warn the user when leaving
  window.onbeforeunload = function(){
    return "Make sure to save your graph locally before leaving :-)";
  };      

  var docEl = document.documentElement,
      bodyEl = document.getElementsByTagName('body')[0];
  
  var width = window.innerWidth || docEl.clientWidth || bodyEl.clientWidth,
      height =  window.innerHeight|| docEl.clientHeight|| bodyEl.clientHeight;

  var xLoc = width/2 - 25,
      yLoc = 100;

  // initial node data
  var nodes = [{title: "new concept", id: 0, x: xLoc, y: yLoc},
               {title: "new concept", id: 1, x: xLoc, y: yLoc + 200}];
  var edges = [{source: nodes[1], target: nodes[0]}];


  /** MAIN SVG **/
  var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);
  var graph = new GraphCreator(svg, nodes, edges);
      graph.setIdCt(2);
  graph.updateGraph();
})(window.d3, window.saveAs, window.Blob);
