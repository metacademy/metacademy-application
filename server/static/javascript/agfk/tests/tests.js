// want to test parsing
/*global define*/
define(["chai", "agfk/models/explore-graph-model", "agfk/models/aux-model"], function(chai, ExploreGraphModel, AuxModel){
  var it = window.it,
      describe = window.describe;

  // initialize global auxData TODO refactor so this isn't necessary
  window.agfkGlobals = {};
  window.agfkGlobals.auxModel = new AuxModel();

  // initialize aux testing objects
  var graphObj,
      nodes,
      idCt = 0,
      nodeIds = {
        parent: "n" + idCt++,
        grandparent: "n" + idCt++,
        uncle: "n" + idCt++,
        child: "n" + idCt++,
        cousin: "n" + idCt++
      },
      edgeIds = {
        parentToChild: "e" + idCt++,
        grandparentToParent: "e" + idCt++,
        grandparentToUncle: "e" + idCt++,
        uncleToCousin: "e" + idCt++,
        grandparentToChild: "e" + idCt++
      },
      exampleResource = {
        title: "some title",
        location: "some loc",
        url: "http://www.example.com",
        resource_type: "example book",
        free: 0,
        core: 0,
        edition: "4",
        level: "advanced examplar",
        authors: ["Colorado Reed", "Albert Einstoon"],
        dependencies: ["some dep", "some dep 2"],
        extra: ["This is an example", "really this text doesn't matter"],
        note: ["You should enjoy making examples for tests"]
      };

  describe('AGFK: create graph', function(){
    var ntitle,
        parentDeps,
        parentOls,
        gpToParentEdge,
        parentToChildEdge,
        gpOls;

    it('should create the graph', function(){

      graphObj = new ExploreGraphModel();

      // add nodes to graph
      for (ntitle in nodeIds) {
        if (nodeIds.hasOwnProperty(ntitle)) {
          graphObj.addNode({id: nodeIds[ntitle], title: ntitle});
        }
      }

      // add edges to graph
      graphObj.addEdge({source: graphObj.getNode(nodeIds.parent),
                        target: graphObj.getNode(nodeIds.child), id: edgeIds.parentToChild, reason: "parentToChild is the reason for the test"});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.parent), id: edgeIds.grandparentToParent, reason: "grandparentToParent is the reason for the test"});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.uncle), id: edgeIds.grandparentToUncle, reason: "grandparentToUncle is the reason for the test"});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.uncle),
                        target: graphObj.getNode(nodeIds.cousin), id: edgeIds.uncleToCousin, reason: "uncleToCousin is the reason for the test"});
    });

    it('should be able to add resources to a node', function(){
      graphObj.getNode(nodeIds.parent).get("resources").add(exampleResource);
    });
  });
}); // end define
