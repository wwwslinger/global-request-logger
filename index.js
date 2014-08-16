'use strict';

var
  http           = require('http'),
  https          = require('https'),
  _              = require('lodash'),
  events         = require('events'),
  util           = require('util')
;

// Save the original globalAgents for restoration later.
var ORIGINALS = {
  http: _.pick(http, 'request'),
  https: _.pick(https, 'request')
};

function resetGlobals() {
  _.assign(http, ORIGINALS.http);
  _.assign(https, ORIGINALS.https);
}

var GlobalLog = function () {
  this.maxMessageLength = 1024 * 1000 * 3;
  events.EventEmitter.call(this);
};
util.inherits(GlobalLog, events.EventEmitter);

var globalLogSingleton = module.exports = new GlobalLog();


/**
 * Override for http.request and https.request, makes sure to default the agent
 * to the global agent. Due to how node implements it in lib/http.js, the
 * globalAgent we define won't get used (node uses a module-scoped variable,
 * not the exports field).
 * @param {string} protocol bound during initialization
 * @param {string|object} options http/https request url or options
 * @param {function} [callback]
 * @private
 */
function attachLoggersToRequest(protocol, options, callback) {
  var httporhttps = this;
  var req = ORIGINALS[protocol].request.call(httporhttps, options, callback);

  var logInfo = {
    request: {},
    response: {}
  };

  // Extract request logging details
//  console.dir(req);
  _.assign(logInfo.request, options);
  _.assign(logInfo.request, _.pick(req, 'method'));
  logInfo.request.headers = req._headers;

  // todo - how do we get the request body
  // todo - how do we get request headers

  req.on('error', function () {
    globalLogSingleton.emit('error', logInfo.request, logInfo.response);
  });


  req.on('response', function (res) {
    _.assign(logInfo.response, _.pick(res, 'statusCode', 'headers', 'httpVersion', 'url', 'method'));

    res.on('data', function () {
      console.log('Data!');
    });
    res.on('end', function () {
      globalLogSingleton.emit('success', logInfo.request, logInfo.response);
    });
    res.on('error', function () {
      globalLogSingleton.emit('error', logInfo.request, logInfo.response);
    });
  });

  return req;
}

GlobalLog.prototype.initialize = function (options) {
  try {
    http.request = attachLoggersToRequest.bind(http, 'http');
    https.request = attachLoggersToRequest.bind(https, 'https');
  } catch (e) {
    resetGlobals();
    throw e;
  }
};
