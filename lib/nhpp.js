/*
 * The MIT License (MIT)
 * Copyright (c) 2015 Jan Krems
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
'use strict';
var http = require('http');

var getBabelRelayPlugin = require('babel-relay-plugin');
var graphql = require('graphql').graphql;
var introspectionQuery = require('graphql/utilities').introspectionQuery;

var createApp = require('./app');

function startForDirectory(rootdir) {
  require('babel-register')({
    presets: ['es2015-node4', 'react'],
    plugins: ['transform-decorators-legacy'],
    only: rootdir,
  });

  var Schema = require(rootdir + '/lib/schema');
  if (Schema.default) Schema = Schema.default;
  return graphql(Schema, introspectionQuery)
    .then(function withIntrospected(result) {
      var relayPlugin = getBabelRelayPlugin(result.data);

      require('babel-register')({
        presets: ['es2015-node4', 'react'],
        plugins: ['transform-decorators-legacy', relayPlugin],
        only: rootdir,
      });

      var app = createApp({ root: rootdir });
      var server = http.createServer(app);
      server.listen(3000);
      return server;
    });
}
module.exports = startForDirectory;
module.exports.default = startForDirectory;
