// Test Demo
// TODO
var assert = require('assert');
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });

    it('should return 0 when value is at the first index', function(){
      assert.equal(0, [1,2,3].indexOf(1));
    })
  });
});

