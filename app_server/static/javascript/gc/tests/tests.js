// want to test parsing
/*global define*/
define(["chai", "gc/models/editable-graph-model"], function(chai, EditGraphModel){

  var it = window.it,
      describe = window.describe;

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

  describe('GC: Create editable graph', function(){
    var ntitle,
        parentDeps,
        parentOls,
        gpToParentEdge,
        parentToChildEdge,
        gpOls;

    it('should create the graph', function(){

      graphObj = new EditGraphModel();

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

  // IO test vars
  var jsonObj,
      jsonStr,
      newJsonObj,
      newGraph = new EditGraphModel();

  describe('GC: Graph IO', function(){
    describe('export graph', function(){
      it('should obtain a valid json representation of the graph', function(){
        jsonObj = graphObj.toJSON();
      });

      it('should be able to obtain a string representation of the graph', function(){
        jsonStr = JSON.stringify(jsonObj);
      });
    });

    describe('import graph', function(){
      it('should be able to parse string to json', function(){
        newJsonObj = JSON.parse(jsonStr);
      });

      it('should be able to create a new graph from the json object', function(){
        newGraph.addJsonNodesToGraph(newJsonObj);
      });

      it('should have same number of nodes', function(){
        newGraph.getNodes().length.should.equal(graphObj.getNodes().length);
      });

      it('should have same number of edges', function(){
        newGraph.getEdges().length.should.equal(graphObj.getEdges().length);
      });

      it('should have the same nodes as the original graph', function(){
        graphObj.getNodes().forEach(function(oldNode) {
          var node = graphObj.getNode(oldNode.id),
              attribs = oldNode.attributes,
              collFields = oldNode.collFields;
          // compare txt fields
          for (var attr in attribs) {
            if (attribs.hasOwnProperty(attr) && collFields.indexOf(attr) === -1){
              oldNode.get(attr).should.equal(node.get(attr));
            }
          }

          // compare dependencies and outlinks
          ["dependencies", "outlinks"].forEach(function(edgeType) {
            node.get(edgeType).forEach(function(dep) {
              var matchOldNodes = oldNode.get(edgeType).filter(function(oldDep) {
                return dep.get("source").id === oldDep.get("source").id
                  && dep.get("target").id === oldDep.get("target").id
                  && dep.get("reason") === oldDep.get("reason");
              });
              matchOldNodes.length.should.equal(1);
            });
          });

          // compare resources
          node.get("resources").forEach(function(rsrc){
            var rattrs = rsrc.attributes;
            var filtRes = oldNode.get("resources").filter(function(oldRsrc){
              for (attr in rattrs) {
                if (rattrs.hasOwnProperty(attr)) {
                  if (rsrc.get(attr) !== oldRsrc.get(attr)) {
                    return false;
                  }
                }
              }
              return true;
            });
            filtRes.length.should.equal(1);
          });
          // TODO compare exercises once the schema is figured out
        }); // end forEach node comparison
      }); // end it()

      it('should have the same edges as the original graph', function(){
        graphObj.getEdges().forEach(function(oldEdge) {
          var matchEdge = newGraph.getEdges().filter(function(edge) {
            if (oldEdge.id !== edge.id){ return false;}
            for (var attr in oldEdge.attributes) {
              if (oldEdge.attributes.hasOwnProperty(attr)) {
                if (oldEdge.get(attr) !== edge.get(attr) && oldEdge.get(attr).id !== oldEdge.get(attr).id) {
                  return false;
                }
              }
            }
            return true;
          });
          matchEdge.length.should.equal(1);
        });
      }); // end it()

      it('should be able to add collection elements to the newGraph', function(){
        newGraph.getNodes().get(nodeIds.parent).get("resources").add(exampleResource);
      });

      // TODO add server grabbing test! -- how to tell when it's finished parsing? -- use trigger events

    }); // end describe("import graph...
  }); // end describe ("graph IO..

}); // end define
