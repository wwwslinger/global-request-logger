'use strict';

var
  should        = require('chai').should(),
  sinon         = require('sinon'),
  http          = require('http'),
  https         = require('https')
  ;

describe('Global Request Logger', function () {
  var
    globalLogger,
    sandbox,
    stubHttpRequest, stubHttpsRequest;

  before(function() {
    sandbox = sinon.sandbox.create();

    sandbox.stub(http, 'request');
    sandbox.stub(https, 'request');
    stubHttpRequest = http.request;
    stubHttpsRequest = https.request;

    // Defer loading until we have stubbed http/https
    globalLogger = require('../index');
  });

  after(function() {
    sandbox.restore();
  });

  it('should return a singleton instance', function () {
    var globalLogger2 = require('../index');
    globalLogger.should.equal(globalLogger2);
  });

  describe('initialize', function () {
    afterEach(function() {
      globalLogger.end();
    });

    it('should set default options', function () {
      globalLogger.initialize();
      globalLogger.should.have.property('maxBodyLength', 1024 * 1000 * 3);
    });

    it('should allow specifying options', function () {
      globalLogger.initialize({maxBodyLength: 1024 * 1000 * 10});
      globalLogger.should.have.property('maxBodyLength', 1024 * 1000 * 10);
    });

    it('should set isEnabled property', function () {
      globalLogger.initialize();
      globalLogger.should.have.property('isEnabled', true);
    });
  });

  describe('end', function () {
    it('should set isEnabled properly', function () {
      globalLogger.initialize();
      globalLogger.end();
      globalLogger.should.have.property('isEnabled', false);
    });
  });

  describe('request logging', function () {
    it('should mixin globals', function () {
      (http.request === stubHttpRequest).should.equal(true, 'before init http is original');
      (https.request === stubHttpsRequest).should.equal(true, 'before init https is original');
      globalLogger.initialize();
      (http.request !== stubHttpRequest).should.equal(true, 'after init http is overwritten');
      (https.request !== stubHttpsRequest).should.equal(true, 'after init https is overwritten');
    });

    it('should reset globals on end', function () {
      globalLogger.initialize();
      (http.request !== stubHttpRequest).should.equal(true, 'after init http is overwritten');
      (https.request !== stubHttpsRequest).should.equal(true, 'after init https is overwritten');
      globalLogger.end();
      (http.request === stubHttpRequest).should.equal(true, 'after end http is restored');
      (https.request === stubHttpsRequest).should.equal(true, 'after end https is restored');
    });
  })
});
