import _ from 'lodash';
import https from 'https';
import queryString from 'querystring';
import atob from 'atob';
import YAML from 'yamljs';
import btoa from 'btoa';
import Q from 'q';
const githubAuth = process.env.GITHUB_AUTH;
const testing = process.env.TESTING || false;
const logReads = process.env.LOG_READS || false;
import logger from '../utils/logger.js';
import githubConfig from '../config/github-config.js';

function processResponse(deferred, request, response) {
    let body = '';
    const size = response.headers['content-length'];

    response.on('data', function (data) {
        body += data;
        deferred.notify(body.length / size);
    });
    response.on('end', function () {
        try {
            const responseBody = body ? JSON.parse(body) : {};
            if (!(/^2[0-9]+$/).test(response.statusCode)) {
                responseBody.request = request;
                deferred.reject(responseBody);
                return;
            }
            responseBody._meta = {
                headers: response.headers,
                lastPage: getLastPageNumber(response.headers.link)
            };
            deferred.resolve(responseBody);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
}

function getLastPageNumber(linkHeader) {
    const expression = /page=([0-9]+).*rel="last"/i;
    if (!linkHeader || !_.isString(linkHeader) || !expression.test(linkHeader)) {
        return 1;
    }
    
    return expression.exec(linkHeader.substr(linkHeader.lastIndexOf('page')))[1];
}

function mockWrite(options, method) {
    const deferred = Q.defer();
    
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

function logRead(options, request, response) {
    logger.log('============READING==============');
    logger.log('--------REQUEST HEADERS-------------');
    logger.log(request._headers);
    logger.log('------------META--------------------');
    logger.log({
        host: githubConfig.repository.host,
        headers: githubConfig.repository.headers,
        auth: githubAuth,
        path: (options.path || '/repos/' + githubConfig.repository.owner + '/' + githubConfig.repository.repo + '/' + options.endpoint) + '?' + queryString.stringify(options.query)
    });
    logger.log('------------RESPONSE--------------------');
    logger.log(response);
    logger.log('------------FILE DATA---------------');
    logger.log(response.content && atob(response.content));
    logger.log('============END READ==============');
    return response;
}

const github = {
    userLogin: githubConfig.bot.userLogin,
    get: function (options) {
        const deferred = Q.defer();
        const query = options.query || {};

        const request = https.get({
            host: githubConfig.repository.host,
            headers: githubConfig.repository.headers,
            auth: githubAuth,
            path: (options.path || '/repos/' + githubConfig.repository.owner + '/' + githubConfig.repository.repo + '/' + options.endpoint) + '?' + queryString.stringify(query)
        }, _.partial(processResponse, deferred, request))
        .on('error', deferred.reject);

        request.end();
        if (logReads) {
            return deferred.promise.then(_.partial(logRead, options, request));
        }
        return deferred.promise;
    },
    post: function (options) {
        if (testing) {
            return mockWrite(options, 'POST');
        }
        const deferred = Q.defer();

        const request = https.request({
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
        const deferred = Q.defer();

        const request = https.request({
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
        const deferred = Q.defer();

        const request = https.request({
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
    patch: function (options) {
        if (testing) {
            return mockWrite(options, 'PATCH');
        }
        const deferred = Q.defer();

        const request = https.request({
            method: 'PATCH',
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
    getAllComments: function (commentsUrl) {
        let comments = [];
        return github.get({
            path: commentsUrl
        }).then(function (commentPage) {
            if (commentPage._meta.lastPage && commentPage._meta.lastPage !== 1) {
                const promises = _.times(commentPage._meta.lastPage, function (n) {
                    return github.get({
                        path: commentsUrl,
                        query: {
                            page: n + 1
                        }
                    });
                });
                return Q.all(promises)
                    .then(function (resultSet) {
                        _.each(resultSet, function (results) {
                            comments = comments.concat(results);
                        });
                        return comments;
                    });
            }
            
            return commentPage;
        });
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
        const yamlString = YAML.stringify(playerData, Number.MAX_SAFE_INTEGER);
        
        return github.get({
            endpoint: 'contents/players.yaml'
        }).then(function (playerMeta) {
            return github.put({
                endpoint: 'contents/players.yaml',
                data: {
                    message: message,
                    committer: {
                        name: github.userLogin,
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

export default github;
