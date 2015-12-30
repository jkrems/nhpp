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
var express = require('express');
var React = require('react');
var ReactDOM = require('react-dom/server');

function compileNHPP(m, filename) {
  var source = fs.readFileSync(filename, 'utf8');
  var wrapped = `import React from 'react';

  export default props => (${source});`;

  var compiled = babel.transform(wrapped, {
    filename: filename,
    presets: ['es2015-node4', 'react']
  });
  return m._compile(compiled.code, filename);
}
require.extensions['.nhpp'] = compileNHPP;

var BASEDIR = path.join(__dirname, '..', 'example', 'public');

var app = express();
app.use((req, res, next) => {
  var parsedUrl = Url.parse(req.url, true);
  var filePath = path.join(BASEDIR, parsedUrl.pathname);

  var componentFilename;
  try {
    componentFilename = require.resolve(filePath);
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      throw err;
    }
  }
  if (!componentFilename) return next();

  var content = null;
  var renderError = null;
  try {
    var Component = require(filePath).default;
    var element = React.createElement(Component, parsedUrl.query);
    content = ReactDOM.renderToStaticMarkup(element);
  } catch (err) {
    renderError = err;
  }
  if (renderError) return next(renderError);
  res.end(content);
});
app.use(express.static(BASEDIR));

var server = http.createServer(app);
server.listen(3000);
