// want to test parsing
/*global define*/
define(["gc/models/editable-graph-model"], function(EditableGraphModel){

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

  var should = window.should,
      it = window.it,
      describe = window.describe;

  describe('Graph Creation and Editing', function(){
    var ntitle,
        parentDeps,
        parentOls,
        gpToParentEdge,
        parentToChildEdge,
        gpOls;

    it('should create the graph', function(){
      graphObj = new EditableGraphModel();

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

    it('should have the correct node titles', function(){
      // test node properties -- title
      for (ntitle in nodeIds) {
        if (nodeIds.hasOwnProperty(ntitle)) {
          graphObj.getNode(nodeIds[ntitle]).get("title").should.equal(ntitle);
        }
      }
    });

    it('should be able to access the deps and ols', function(){

      // test node dependencies
      gpOls =  graphObj.getNode(nodeIds.grandparent).get("outlinks");
      parentDeps = graphObj.getNode(nodeIds.parent).get("dependencies");
      parentOls =  graphObj.getNode(nodeIds.parent).get("outlinks");
      gpToParentEdge = parentDeps.get(edgeIds.grandparentToParent);
      parentToChildEdge = parentOls.get(edgeIds.parentToChild);
    });

    it('deps and ols should have correct size', function(){
      // check size of dependencies and outlinks
      gpOls.length.should.equal(2);
      parentDeps.length.should.equal(1);
      parentOls.length.should.equal(1);
    });

    it('gp to parent edge should have correct relationships', function(){

      // check source and target specification for the dep
      gpToParentEdge.should.deep.equal(graphObj.getEdge(edgeIds.grandparentToParent));
      gpToParentEdge.get("source").get("title").should.equal("grandparent");
      gpToParentEdge.get("target").get("title").should.equal("parent");
    });

    it('parent to child edge should have correct relationships', function(){
      // check source and target specification for the ol
      parentToChildEdge.should.deep.equal(graphObj.getEdge(edgeIds.parentToChild));
      parentToChildEdge.get("source").get("title").should.equal("parent");
      parentToChildEdge.get("target").get("title").should.equal("child");
    });

    it('traverse from child to cousin', function(){
      graphObj.getNode(nodeIds.child)
        .get("dependencies").get(edgeIds.parentToChild).get("source") // parent
        .get("dependencies").get(edgeIds.grandparentToParent).get("source") // grandparent
        .get("outlinks").get(edgeIds.grandparentToUncle).get("target") // uncle
        .get("outlinks").get(edgeIds.uncleToCousin).get("target") // cousin
        .should.deep.equal(graphObj.getNode(nodeIds.cousin));
    });

    it('should be able to remove node with 1 outlink and 1 dep', function(){
      graphObj.removeNode(nodeIds.uncle);
      should.not.exist(graphObj.getNode(nodeIds.uncle));
    });

    it('should have associated edges removed from related nodes', function(){
      should.not.exist(graphObj.getNode(nodeIds.grandparent).get("outlinks").get(edgeIds.grandparentToUncle));
      should.not.exist(graphObj.getNode(nodeIds.cousin).get("dependencies").get(edgeIds.uncleToCousin));
    });

    it('should be able to delete node by reference', function(){
      graphObj.removeNode(graphObj.getNode(nodeIds.cousin));
      should.not.exist(graphObj.getNode(nodeIds.cousin));
    });

    it('should have three nodes and two edges', function(){
      graphObj.getNodes().length.should.equal(3);
      graphObj.getEdges().length.should.equal(2);
    });

    it('should be able to add edge between grandparent and child and propagate changes to the nodes', function(){
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.child), id: edgeIds.grandparentToChild});
      graphObj.getEdges().length.should.equal(3);
      graphObj.getNode(nodeIds.grandparent).get("outlinks").get(edgeIds.grandparentToChild)
        .should.deep.equal(graphObj.getEdge(edgeIds.grandparentToChild));
      graphObj.getNode(nodeIds.child).get("dependencies").get(edgeIds.grandparentToChild)
        .should.deep.equal(graphObj.getEdge(edgeIds.grandparentToChild));
    });

    it('should be able to remove edge from grandparent to child and propagate changes to the nodes', function(){
      graphObj.removeEdge(edgeIds.grandparentToChild);
      should.not.exist(graphObj.getEdge(edgeIds.grandparentToChild));
      should.not.exist(graphObj.getNode(nodeIds.grandparent)
                       .get("outlinks").get(edgeIds.grandparentToChild));
      should.not.exist(graphObj.getNode(nodeIds.child)
                       .get("dependencies").get(edgeIds.grandparentToChild));
    });

    it('should be able to re-add gp-uncle-cousin chain and gp-to-child', function(){
      graphObj.addNode({id: nodeIds.uncle, title: "uncle"});
      graphObj.addNode({id: nodeIds.cousin, title: "cousin"});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.uncle), id: edgeIds.grandparentToUncle});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.uncle),
                        target: graphObj.getNode(nodeIds.cousin), id: edgeIds.uncleToCousin});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.child), id: edgeIds.grandparentToChild});

    });

    it('should be able to remove grandparent and have all 3 associated edges removed', function(){
      graphObj.removeNode(nodeIds.grandparent);
      should.not.exist(graphObj.getNode(nodeIds.grandparent));
      should.not.exist(graphObj.getEdge(edgeIds.grandparentToParent));
      should.not.exist(graphObj.getEdge(edgeIds.grandparentToUncle));
      should.not.exist(graphObj.getEdge(edgeIds.grandparentToChild));
      graphObj.getNodes().length.should.equal(4);
      graphObj.getEdges().length.should.equal(2);
    });

    it('should be able to re-add gp and associated edges', function(){
      graphObj.addNode({id: nodeIds.grandparent, title: "grandparent"});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.uncle), id: edgeIds.grandparentToUncle});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.parent), id: edgeIds.grandparentToParent});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.child), id: edgeIds.grandparentToChild});

    });


    it('should be able to add resources to a node', function(){
      graphObj.getNode(nodeIds.parent).get("resources").add(exampleResource);
    });
  });


  describe('Graph operations', function(){
    describe('contract deps', function(){
      describe('contract cousin', function(){
        it('should be able to contract cousin and have uncle become invisible', function(){
          graphObj.getNode(nodeIds.cousin).contractDeps();
          (!graphObj.getNode(nodeIds.uncle).get("isContracted")).should.equal(false);
        });

        it('should have uncle-cousin edge be invisible', function(){
          (!graphObj.getEdge(edgeIds.uncleToCousin).get("isContracted")).should.equal(false);
        });

        it('should have gp-uncle edge be invisible', function(){
          (!graphObj.getEdge(edgeIds.grandparentToUncle).get("isContracted")).should.equal(false);
        });


        ["grandparent", "parent", "child"].forEach(function(title){
          it( title + ' should still be visible', function(){
            (!graphObj.getNode(nodeIds[title]).get("isContracted")).should.equal(true);
          });
        });

        ["grandparentToParent", "parentToChild", "grandparentToChild"].forEach(function(title){
          it( title + ' should still be visible', function(){
            (!graphObj.getEdge(edgeIds[title]).get("isContracted")).should.equal(true);
          });
        });
      });

      describe('contract child', function(){
        it('should be able to contract child and have all nodes except child and cousin invisible', function(){
          graphObj.getNode(nodeIds.child).contractDeps();
          graphObj.getNodes().every(function(node){
            return node.get("title") === "cousin"
              || node.get("title") === "child"
              || node.get("isContracted");
          }).should.equal(true);
        });

        it('all edges should be invisible', function(){
          var allHidden = graphObj.getEdges().every(function(edge){
            return edge.get("isContracted");
          });
          allHidden.should.equal(true);
        });
      });
    }); // end contract nodes

    describe('expand deps', function(){
      describe('expand cousin', function(){
        it('should be able to expand cousin deps', function(){
          graphObj.getNode(nodeIds.cousin).expandDeps();
        });

        it('uncle and gp should be visible', function(){
          (!graphObj.getNode(nodeIds.uncle).get("isContracted")).should.equal(true);
          (!graphObj.getNode(nodeIds.grandparent).get("isContracted")).should.equal(true);
        });

        it('edge from uncle to cousin should be visible', function(){
          (!graphObj.getEdge(edgeIds.uncleToCousin).get("isContracted")).should.equal(true);
        });

        it('edge from gp to uncle should be visible', function(){
          (!graphObj.getEdge(edgeIds.grandparentToUncle).get("isContracted")).should.equal(true);
        });

        it('parent should be invisible', function(){
          (!graphObj.getNode(nodeIds.parent).get("isContracted")).should.equal(false);
        });

        it('edges from gp to child and parent should be invisible', function(){
          (!graphObj.getEdge(edgeIds.grandparentToChild).get("isContracted")).should.equal(false);
          (!graphObj.getEdge(edgeIds.grandparentToParent).get("isContracted")).should.equal(false);
        });
      }); // end describe('expand cousin')

      describe('expand child', function(){
        it('should be able to expand child deps', function(){
          graphObj.getNode(nodeIds.child).expandDeps();
        });

        it('all nodes should be visible', function(){
          graphObj.getNodes().every(function(n){return !n.get("isContracted");}).should.equal(true);
        });

        it('all edges should be visible', function(){
          var allVisible = graphObj.getEdges().every(function(edge){
            return !edge.get("isContracted");
          });
          allVisible.should.equal(true);
        });
      });
    }); // end describe('expand deps')

    describe('contract outlinks', function(){
      describe('contract outlinks', function(){
        it('should be able to contract parent outlinks', function(){
          graphObj.getNode(nodeIds.parent).contractOLs();
        });

        it('child should still be visible since gp-to-child edge exists', function(){
          (!graphObj.getNode(nodeIds.child).get("isContracted")).should.equal(true);
        });

        it('parent -> child should be hidden', function(){
          (!graphObj.getEdge(edgeIds.parentToChild).get("isContracted")).should.equal(false);
        });

        it('all nodes should be visible', function(){
          graphObj.getNodes().each(function(node){
            (!node.get("isContracted")).should.equal(true);
          });
        });

        it('all non parent->child edges should be visible', function(){
          graphObj.getEdges().each(function(edge){
            if (edge.id !== edgeIds.parentToChild){
              (!edge.get("isContracted")).should.equal(true);
            }
          });
        });

        it('should be able to contract uncle outlinks', function(){
          graphObj.getNode(nodeIds.uncle).contractOLs();
        });

        it('cousin should be invisible', function(){
          (!graphObj.getNode(nodeIds.cousin).get("isContracted")).should.equal(false);
        });

        it('uncle -> cousin should be hidden', function(){
          (!graphObj.getEdge(edgeIds.uncleToCousin).get("isContracted")).should.equal(false);
        });

        it('should be able to contract grandparent outlinks', function(){
          graphObj.getNode(nodeIds.grandparent).contractOLs();
        });

        it('gp should be visible', function(){
          (!graphObj.getNode(nodeIds.grandparent).get("isContracted")).should.equal(true);
        });

        it('all non-gp nodes should be hidden', function(){
          graphObj.getNodes().each(function(node){
            if (node.id !== nodeIds.grandparent){
              (!node.get("isContracted")).should.equal(false);
            }
          });
        });

        it('all edges should be hidden', function(){
          graphObj.getEdges().each(function(edge){
            (!edge.get("isContracted")).should.equal(false);
          });
        });

      }); // end describe('contract outlinks')

      describe('expand outlinks', function(){
        it('should be able to expand grandparent', function(){
          graphObj.getNode(nodeIds.grandparent).expandOLs();
        });

        it('all edges should be visible', function(){
          graphObj.getEdges().each(function(edge){
            (!edge.get("isContracted")).should.equal(true);
          });
        });

        it('all nodes should be visible', function(){
          graphObj.getNodes().each(function(node){
            (!node.get("isContracted")).should.equal(true);
          });
        });

      });

    });
  }); // end describe('graph operations')


  // IO test vars
  var jsonObj,
      jsonStr,
      newJsonObj,
      newGraph = new EditableGraphModel();

  describe('Graph IO', function(){
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
          // TODO compare questions once the schema is figured out
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

  describe('Graph Computations', function(){

    describe('Transitivity of edges', function(){
      it('gp to child should be transitive', function(){
        graphObj.getEdge(edgeIds.grandparentToChild).get("isTransitive").should.equal(true);
      });

      it('all other edges should not be transitive', function(){
        graphObj.getEdges().all(function(edge){
          return edge.id === edgeIds.grandparentToChild || !edge.get("isTransitive");
        }).should.equal(true);
      });

      it('should be able to add ggp node and edge to cousin', function(){
        nodeIds.ggp = "n" + idCt++;
        edgeIds.ggpToCousin = "e" + idCt++;
        edgeIds.ggpToGp = "e" + idCt++;
        graphObj.addNode({title: "ggp", id: nodeIds.ggp});
        graphObj.addEdge({source: graphObj.getNode(nodeIds.ggp),
                          target: graphObj.getNode(nodeIds.cousin),
                          id: edgeIds.ggpToCousin,
                          reason: "ggpToCousin is the reason for the test"});
      });

      it('new edge from ggp to cousin should not be transitive (ggp is not connected to gp)', function(){
        graphObj.getEdge(edgeIds.ggpToCousin).get("isTransitive").should.equal(false);
      });

      it('after adding edge ggp-gp, ggp-cousin should be transitive', function(){
        graphObj.addEdge({source: graphObj.getNode(nodeIds.ggp),
                          target: graphObj.getNode(nodeIds.grandparent),
                          id: edgeIds.ggpToGp, reason: "ggpToGp is the reason for the test"});
        graphObj.getEdge(edgeIds.ggpToCousin).get("isTransitive").should.equal(true);
      });

      it('after removing edge ggp-gp, ggp-cousin should NOT be transitive', function(){
        graphObj.removeEdge(edgeIds.ggpToGp);
        graphObj.getEdge(edgeIds.ggpToCousin).get("isTransitive").should.equal(false);
      });
    });
  }); // end     describe('Transitivity of edges', function(){

  describe('Determining paths between nodes', function(){
    it('should have a path between gp and child', function(){
      graphObj.isPathBetweenNodes(graphObj.getNode(nodeIds.grandparent), graphObj.getNode(nodeIds.child)).should.equal(true);
    });

    it('should have a path between gp and cousin', function(){
      graphObj.isPathBetweenNodes(graphObj.getNode(nodeIds.grandparent), graphObj.getNode(nodeIds.cousin)).should.equal(true);
    });

    it('should have a path between uncle and cousin', function(){
      graphObj.isPathBetweenNodes(graphObj.getNode(nodeIds.uncle), graphObj.getNode(nodeIds.cousin)).should.equal(true);
    });

    it('should NOT have a path between child and gp', function(){
      graphObj.isPathBetweenNodes(graphObj.getNode(nodeIds.child), graphObj.getNode(nodeIds.grandparent)).should.equal(false);
    });

    it('should NOT have a path between cousin and parent', function(){
      graphObj.isPathBetweenNodes(graphObj.getNode(nodeIds.cousin), graphObj.getNode(nodeIds.parent)).should.equal(false);
    });
  });

}); // end define
