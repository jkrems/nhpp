'use strict';
var assert = require('assertive');

var startForDirectory = require('../');

describe('startForDirectory', function () {
  it('is a function', function () {
    assert.hasType(Function, startForDirectory);
  });
});
