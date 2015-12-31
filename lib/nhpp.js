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
var fs = require('fs');
var http = require('http');
var path = require('path');
var Module = require('module');
var Url = require('url');

var babel = require('babel-core');
var Bluebird = require('bluebird');
var express = require('express');
var glob = require('glob');
var _ = require('lodash');
var React = require('react');
var ReactDOM = require('react-dom/server');
var createRouter = require('wegweiser');

var globAsync = Bluebird.promisify(glob);

function compileSource(m, filename, source) {
  var compiled = babel.transform(source, {
    filename: filename,
    presets: ['es2015-node4', 'react']
  });
  return m._compile(compiled.code, filename);
}

function compileJSX(m, filename) {
  var source = fs.readFileSync(filename, 'utf8');
  return compileSource(m, filename, source);
}
require.extensions['.jsx'] = compileJSX;

function compileNHPP(m, filename) {
  var source = fs.readFileSync(filename, 'utf8');
  var wrapped = source.replace(
    /^((?:\s*import\W.*\n)*)([\s\S]*?)(<[\s\S]*)/,
    'import React from "react";\n$1export default props => {\n$2\nreturn ($3);\n};\n');
  return compileSource(m, filename, wrapped);
}
require.extensions['.nhpp'] = compileNHPP;

var BASEDIR = path.join(__dirname, '..', 'example');
var PUBLICDIR = path.join(BASEDIR, 'public');

require('babel-register')({
  presets: ['es2015-node4', 'react'],
  plugins: ['transform-decorators-legacy'],
  only: BASEDIR,
});

function actuallyClearBaseDirCache() {
  Object.keys(require.cache).forEach(knownFile => {
    if (knownFile.indexOf(BASEDIR) === 0) {
      delete require.cache[knownFile];
    }
  });
}
var clearBaseDirCache = process.env.NODE_ENV === 'production' ?
  _.noop : actuallyClearBaseDirCache;

var app = express();

app.use((req, res, next) => {
  globAsync('**/resource.*', { cwd: BASEDIR })
    .then(resourceFiles => {
      if (!resourceFiles.length) return;
      clearBaseDirCache();
      var resources = _(resourceFiles)
        .map(filename => require(path.join(BASEDIR, filename)))
        .map(_.values)
        .flatten()
        .value();

      var router = createRouter.apply(null, resources);
      return router(req);
    })
    .then(result => {
      if (result === undefined) {
        process.nextTick(next);
        return;
      }
      // Send result:
      if (typeof result === 'string' || result instanceof Buffer) {
        return res.end(result);
      } else if (React.isValidElement(result)) {
        var content = ReactDOM.renderToStaticMarkup(result);
        res.setHeader('Content-Type', 'text/html; charset=utf8');
        return res.send(content);
      } else {
        throw new Error('Route returned unsupported value ' + result);
      }
    })
    .done(null, next);
});

app.use((req, res, next) => {
  var pathname = req.url.split('?')[0];
  var filePath = path.join(PUBLICDIR, pathname);

  var componentFilename;
  try {
    componentFilename = require.resolve(filePath);
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err;
    }
  }
  if (!componentFilename) return next();
  clearBaseDirCache();

  var content = null;
  var renderError = null;
  try {
    var Component = require(componentFilename).default;
    var element = React.createElement(Component, req.query);
    content = ReactDOM.renderToStaticMarkup(element);
  } catch (err) {
    renderError = err;
  }
  if (renderError) return next(renderError);
  res.end(content);
});
app.use(express.static(PUBLICDIR));

var server = http.createServer(app);
server.listen(3000);
