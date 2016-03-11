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
            if (body) {
                try {
                    deferred.resolve(JSON.parse(body));
                } catch (exception) {
                    deferred.reject(exception);
                }
            } else {
                deferred.resolve(null);
            }
        });
    }

    var github = {
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
            return github.get(options)
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
        },
        delete: function (options) {
            var deferred = Q.defer(),
                request = https.request({
                    method: 'DELETE',
                    host: githubConfig.repository.host,
                    headers: githubConfig.repository.headers,
                    auth: githubConfig.repository.auth,
                    path: options.path || '/repos/' + githubConfig.repository.owner + '/' + githubConfig.repository.repo + '/' + options.endpoint
                }, _.partial(processResponse, deferred));

            request.on('error', deferred.reject);
            request.write(JSON.stringify(options.data || {}));
            request.end();

            return deferred.promise;
        },
        put: function (options) {
            var deferred = Q.defer(),
                request = https.request({
                    method: 'PUT',
                    host: githubConfig.repository.host,
                    headers: githubConfig.repository.headers,
                    auth: githubConfig.repository.auth,
                    path: options.path || '/repos/' + githubConfig.repository.owner + '/' + githubConfig.repository.repo + '/' + options.endpoint
                }, _.partial(processResponse, deferred));

            request.on('error', deferred.reject);
            request.write(JSON.stringify(options.data));
            request.end();

            return deferred.promise;
        },
        sendCommentMessage: function (url, message) {
            return github.post({
                path: url,
                data: {
                    body: message
                }
            }).catch(function (error) {
                console.error(error);
            });
            return {message: message, url: url};
        },
        setIssueLabels: function (url, labels) {
            url = url.replace(/{.*}/g, '');
            return github.put({
                path: url,
                data: labels
            }).catch(function (error) {
                console.error(error);
            });
            return {message: 'setting labels', url: url, lables: labels};
        },
        addIssueLabels: function (url, labels) {
            labels = _.isArray(labels) ? labels : [labels];
            url = url.replace(/{.*}/g, '');
            return github.post({
                path: url,
                data: labels
            }).catch(function (error) {
                console.error(error);
            });
            return {message: 'adding labels', url: url, lables: labels};
        },
        removeIssueLabel: function (url, label) {
            url = url.replace(/{.*}/g, '');
            return github.delete({
                path: url + '/' + label
            }).catch(function (error) {
                console.error(error);
            });
            return {message: 'removing label: ' + label, url: url};
        }
    };

    module.exports = github;
}());
