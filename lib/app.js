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
var path = require('path');

var Bluebird = require('bluebird');
var express = require('express');
var glob = require('glob');
var _ = require('lodash');
var React = require('react');
var ReactDOM = require('react-dom/server');
var createRouter = require('wegweiser');

var createSwaggerHandler = require('./swagger');

var globAsync = Bluebird.promisify(glob);

function clearBaseDirCache(rootdir, req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    Object.keys(require.cache).forEach(function rmFromCache(knownFile) {
      if (knownFile.indexOf(rootdir) === 0) {
        delete require.cache[knownFile];
      }
    });
  }
  next();
}

function applyRouter(router, req, res, next) {
  function sendResult(result) {
    if (result === undefined) {
      process.nextTick(next);
      return;
    }
    // Send result:
    if (typeof result === 'string' || result instanceof Buffer) {
      res.end(result);
    } else if (React.isValidElement(result)) {
      var content = ReactDOM.renderToString(result);
      res.setHeader('Content-Type', 'text/html; charset=utf8');
      res.send(content);
    } else {
      throw new Error('Route returned unsupported value ' + result);
    }
  }

  return Bluebird.try(router, [req])
    .then(sendResult);
}

function createRouterFromResources(rootdir) {
  function loadFile(filename) {
    return require(path.join(rootdir, filename));
  }

  function fromResourceFiles(resourceFiles) {
    if (!resourceFiles.length) return _.noop;
    var resources = _(resourceFiles)
      .map(loadFile)
      .map(_.values)
      .flatten()
      .value();

    return createRouter.apply(null, resources);
  }

  return globAsync('lib/**/resource.*', { cwd: rootdir })
    .then(fromResourceFiles);
}

function routerMiddleware(rootdir, req, res, next) {
  createRouterFromResources(rootdir)
    .then(_.partial(applyRouter, _, req, res, next))
    .done(null, next);
}

function createApp(options) {
  var rootdir = options.root;

  var app = express();

  app.use(express.static(rootdir));

  if (process.env.NODE_ENV !== 'production') {
    app.use(_.partial(clearBaseDirCache, rootdir));
  }

  app.use(_.partial(routerMiddleware, rootdir));

  app.use('/_swagger', createSwaggerHandler());

  return app;
}
module.exports = createApp;
createApp.default = createApp;
