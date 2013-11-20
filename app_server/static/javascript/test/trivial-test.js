define([], function(){
  describe('trivial: Array', function(){
    describe('#indexOf()', function(){
      it('should return -1 when the value is not present', function(){
        [1,2,3].indexOf(5).should.equal(-1);
        [1,2,3].indexOf(0).should.equal(-1);
      });
    });

    describe('#forEach()', function(){
      it('should iterate over the elements of the array', function(){
        var arr = [3, 4, 5];
        var sum = 0;
        arr.forEach(function(val){sum += val;});
        sum.should.equal(12);
      });
    });

  });
});
