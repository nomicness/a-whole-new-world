(function () {
    'use strict';
    var _ = require('lodash'),
        https = require('https'),
        atob = require('atob'),
        Q = require('q'),

        githubConfig = require('../config/github-config.js');

    function processResponse(deferred, response) {
        var body = '',
            size = response.headers['content-length'];

        response.on('data', function (data) {
            body += data;
            deferred.notify(body.length / size);
        });
        response.on('end', function () {
            try {
                deferred.resolve(JSON.parse(body));
            } catch (exception) {
                deferred.reject(exception);
            }
        });
    }

    var gethub = {
        get: function (options) {
            var deferred = Q.defer(),
                request = https.get({
                    host: githubConfig.repository.host,
                    headers: githubConfig.repository.headers,
                    auth: githubConfig.repository.auth,
                    path: options.path || '/repos/' + githubConfig.repository.owner + '/' + githubConfig.repository.repo + '/' + options.endpoint
                }, _.partial(processResponse, deferred))
                .on('error', deferred.reject);

            request.end();

            return deferred.promise;
        },
        getFileContents: function (options) {
            return gethub.get(options)
                .then(function (fileData) {
                    if (fileData && fileData.content) {
                        return atob(fileData.content);
                    }
                });
        },
        post: function (options) {
            var deferred = Q.defer(),
                request = https.request({
                    method: 'POST',
                    host: githubConfig.repository.host,
                    headers: githubConfig.repository.headers,
                    auth: githubConfig.repository.auth,
                    path: options.path || '/repos/' + githubConfig.repository.owner + '/' + githubConfig.repository.repo + '/' + options.endpoint
                }, _.partial(processResponse, deferred));

            request.on('error', deferred.reject);
            request.write(JSON.stringify(options.data));
            request.end();

            return deferred.promise;
        }
    };

    module.exports = gethub;
}());
