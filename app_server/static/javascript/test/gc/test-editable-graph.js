// want to test parsing
define(["gc/models/editable-graph-model"], function(EditableGraphModel){

  // initialize aux testing objects
  var graphObj,
      nodes,
      idCt = 0,
      nodeIds = {
        parent: idCt++,
        grandparent: idCt++,
        uncle: idCt++,
        child: idCt++,
        cousin: idCt++
      },
      edgeIds = {
        parentToChild: idCt++,
        grandparentToParent: idCt++,
        grandparentToUncle: idCt++,
        uncleToCousin: idCt++,
        grandparentToChild: idCt++
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
                        target: graphObj.getNode(nodeIds.child), id: edgeIds.parentToChild});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.parent), id: edgeIds.grandparentToParent});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.uncle), id: edgeIds.grandparentToUncle});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.uncle),
                        target: graphObj.getNode(nodeIds.cousin), id: edgeIds.uncleToCousin});


    });
    
    it('should have the correct titles', function(){
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

    it('should be able to remove node', function(){
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
      graphObj.get("nodes").length.should.equal(3);
      graphObj.get("edges").length.should.equal(2);
    });
    
    it('should be able to add edge between grandparent and child and propagate changes to the nodes', function(){
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.child), id: edgeIds.grandparentToChild});      
      graphObj.get("edges").length.should.equal(3);
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
  });


  describe('Graph Parsing', function(){
    describe('json parsing', function(){
      it('', function(){
        
        
      });
    });


  });
});

