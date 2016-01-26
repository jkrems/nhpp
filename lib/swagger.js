'use strict';
var path = require('path');

var express = require('express');

module.exports = function createSwaggerHandler() {
  var app = express();

  app.get('/api.json', function createApiSpec(req, res) {
    res.json({
      swagger: '2.0',
      info: {
        title: 'An API',
        version: '1.0.0',
      },
      host: '127.0.0.1:3000',
      basePath: '/',
      schemes: ['http'],
      tags: [],
      paths: {
        '/hello/{name}': {
          get: {
            description: 'Says hello to {name}',
            produces: ['text/html'],
            parameters: [
              {
                name: 'name',
                in: 'path',
                description: 'The name to say hello to',
                required: true,
                type: 'string',
              },
            ],
            responses: {
              200: {
                description: 'A hello page',
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    });
  });

  app.get('/', function addUrl(req, res, next) {
    if (req.url.indexOf('url') !== -1) {
      next();
      return;
    }
    var pathname = req.originalUrl.split('?')[0];
    var apiPath = path.join(pathname, 'api.json');
    res.setHeader('Location', pathname + '?url=' + apiPath);
    res.statusCode = 302;
    res.end();
  });

  var swaggerDir = path.dirname(require.resolve('swagger-ui'));
  app.use(express.static(swaggerDir));

  return app;
};
