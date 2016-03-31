(function () {
    'use strict';
    var _ = require('lodash'),
        https = require('https'),
        atob = require('atob'),
        YAML = require('yamljs'),
        btoa = require('btoa'),
        Q = require('q'),
        
        githubAuth = process.env.GITHUB_AUTH,
        testing = process.env.TESTING || false,

        logger = require('../utils/logger.js'),
        githubConfig = require('../config/github-config.js');

    function processResponse(deferred, request, response) {
        var body = '',
            size = response.headers['content-length'];

        response.on('data', function (data) {
            body += data;
            deferred.notify(body.length / size);
        });
        response.on('end', function () {
            try {
                var responseBody = body ? JSON.parse(body) : {};
                if (!(/^2[0-9]+$/).test(response.statusCode)) {
                    responseBody.request = request;
                    deferred.reject(responseBody);
                    return;
                }
                deferred.resolve(responseBody);
            } catch (exception) {
                deferred.reject(exception);
            }
        });
    }
    
    function mockWrite(options, method) {
        var deferred = Q.defer();
        
        logger.log('============MOCK WRITE==============');
        logger.log('------------META--------------------');
        logger.log({
            method: method,
            host: githubConfig.repository.host,
            headers: githubConfig.repository.headers,
            auth: githubAuth,
            path: options.path || '/repos/' + githubConfig.repository.owner + '/' + githubConfig.repository.repo + '/' + options.endpoint
        });
        logger.log('------------DATA--------------------');
        logger.log(options.data);
        logger.log('------------FILE DATA---------------');
        logger.log(options.data && options.data.content && atob(options.data.content));
        logger.log('============END WRITE==============');
        
        deferred.resolve({});
        return deferred.promise;
    }

    var github = {
        get: function (options) {
            var deferred = Q.defer(),
                request = https.get({
                    host: githubConfig.repository.host,
                    headers: githubConfig.repository.headers,
                    auth: githubAuth,
                    path: (options.path || '/repos/' + githubConfig.repository.owner + '/' + githubConfig.repository.repo + '/' + options.endpoint) + '?per_page=100'
                }, _.partial(processResponse, deferred, request))
                .on('error', deferred.reject);

            request.end();

            return deferred.promise;
        },
        post: function (options) {
            if (testing) {
                return mockWrite(options, 'POST');
            }
            var deferred = Q.defer(),
                request = https.request({
                    method: 'POST',
                    host: githubConfig.repository.host,
                    headers: githubConfig.repository.headers,
                    auth: githubAuth,
                    path: options.path || '/repos/' + githubConfig.repository.owner + '/' + githubConfig.repository.repo + '/' + options.endpoint
                }, _.partial(processResponse, deferred, request));

            request.on('error', deferred.reject);
            request.write(JSON.stringify(options.data));
            request.end();

            return deferred.promise;
        },
        delete: function (options) {
            if (testing) {
                return mockWrite(options, 'DELETE');
            }
            var deferred = Q.defer(),
                request = https.request({
                    method: 'DELETE',
                    host: githubConfig.repository.host,
                    headers: githubConfig.repository.headers,
                    auth: githubAuth,
                    path: options.path || '/repos/' + githubConfig.repository.owner + '/' + githubConfig.repository.repo + '/' + options.endpoint
                }, _.partial(processResponse, deferred, request));

            request.on('error', deferred.reject);
            request.write(JSON.stringify(options.data || {}));
            request.end();

            return deferred.promise;
        },
        put: function (options) {
            if (testing) {
                return mockWrite(options, 'PUT');
            }
            var deferred = Q.defer(),
                request = https.request({
                    method: 'PUT',
                    host: githubConfig.repository.host,
                    headers: githubConfig.repository.headers,
                    auth: githubAuth,
                    path: options.path || '/repos/' + githubConfig.repository.owner + '/' + githubConfig.repository.repo + '/' + options.endpoint
                }, _.partial(processResponse, deferred, request));

            request.on('error', deferred.reject);
            request.write(JSON.stringify(options.data));
            request.end();

            return deferred.promise;
        },
        getFileContents: function (options) {
            return github.get(options)
                .then(function (fileData) {
                    if (fileData && fileData.content) {
                        return atob(fileData.content);
                    }
                })
                .catch(logger.error);
        },
        sendCommentMessage: function (url, message) {
            return github.post({
                path: url,
                data: {
                    body: message
                }
            })
            .then(_.constant({message: 'Sending Message: ' + message, url: url}))
            .catch(logger.error);
        },
        setIssueLabels: function (url, labels) {
            url = url.replace(/{.*}/g, '');
            return github.put({
                path: url,
                data: labels
            })
            .then(_.constant({message: 'Setting Labels', url: url, lables: labels}))
            .catch(logger.error);
        },
        addIssueLabels: function (url, labels) {
            labels = _.isArray(labels) ? labels : [labels];
            url = url.replace(/{.*}/g, '');
            return github.post({
                path: url,
                data: labels
            })
            .then(_.constant({message: 'Adding Labels', url: url, lables: labels}))
            .catch(logger.error);
        },
        removeIssueLabel: function (url, label) {
            url = url.replace(/{.*}/g, '');
            return github.delete({
                path: url + '/' + label
            })
            .then(_.constant({message: 'Removing Label: ' + label, url: url}))
            .catch(logger.error);
        },
        updatePlayerFile: function (playerData, message) {
            var yamlString = YAML.stringify(playerData, Number.MAX_SAFE_INTEGER);
            
            return github.get({
                endpoint: 'contents/players.yaml'
            }).then(function (playerMeta) {
                return github.put({
                    endpoint: 'contents/players.yaml',
                    data: {
                        message: message,
                        committer: {
                            name: 'Nomic Bot',
                            email: 'nomic-bot@archmageinc.com'
                        },
                        content: btoa(yamlString),
                        sha: playerMeta.sha
                    }
                })
                .then(_.constant({message: 'Updating player data: ' + message, data: playerData}))
                .catch(logger.error);
            }).catch(logger.error);
        },
        getPlayerData: function () {
            return github.getFileContents({
                    endpoint: 'contents/players.yaml'
                })
                .then(YAML.parse);
        }
    };

    module.exports = github;
}());
