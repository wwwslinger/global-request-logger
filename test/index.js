// hook into the re


var
  url        = require('url'),
  https      = require('https'),


  globalLog = require('./../index')
;

globalLog.initialize();

globalLog.on('success', function(request, response) {
  console.log('SUCCESS');
  console.log('Request', request);
  console.log('Response', response);
});

globalLog.on('error', function(request, response) {
  console.log('ERROR');
  console.log('Request', request);
  console.log('Response', response);
});


var opts = url.parse('https://api.meetearnest.com');
https.get(opts, function (res) {
  console.log('*****');
  res.pipe(process.stdout);
});
