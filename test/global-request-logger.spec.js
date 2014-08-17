'use strict';

var
  should        = require('chai').should(),
  sinon         = require('sinon'),
  http          = require('http'),
  https         = require('https'),
  events        = require('events'),
  nock          = require('nock'),
  _             = require('lodash')
  ;

describe('Global Request Logger', function () {
  var globalLogger;


  describe('request overrides', function() {
    var
      sandbox,
      stubHttpRequest, stubHttpsRequest;

    before(function() {
      sandbox = sinon.sandbox.create();

      function stubRequest() {
        var ee = new events.EventEmitter();
        ee.end = function() {};
        return ee;
      }

      sandbox.stub(http, 'request', stubRequest);
      sandbox.stub(https, 'request', stubRequest);
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
  });


  describe('initialize', function () {
    globalLogger = require('../index');

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

  describe.only('request logging', function () {
    globalLogger = require('../index');

    describe('events', function() {
      before(function() {
        nock.disableNetConnect();
        nock.recorder.rec();
        globalLogger.initialize();
      });
      after(function() {
        globalLogger.end();
      });

      it('should log request error', function (done) {
        var spy = sinon.spy();
        globalLogger.on('error', spy);

        var req = http.get('http://www.example.com');
        req.on('error', function() {
          var reqLog = sinon.match.typeOf('object')
            .and(sinon.match.has('error'));
          var respLog = sinon.match(function(value) {
            return _.keys(value).length === 0;
          });
          sinon.assert.calledOnce(spy);
          sinon.assert.calledWithMatch(spy, reqLog, respLog);
          done();
        });
      });

      it('should log request success', function (done) {
        nock('http://www.example.com')
          .get('/')
          .reply(200, 'Example');

//        //
//        .and(sinon.match.has('method'))
//          .and(sinon.match.has('path'))
//          .and(sinon.match.has('headers'))

        http.get('http://www.example.com', function(res) {

          done();
        });
      })
    });
  })
});
