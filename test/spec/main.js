var counter = require('streamhub-collection-counter');
var assert = require('chai').assert;

describe('streamhub-collection-counter', function () {
    it('is truthy', function (){
        assert(counter);
    });
    it('is a .count method', function () {
        assert.typeOf(counter.count, 'function');
    });
});
