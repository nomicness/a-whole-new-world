import * as child from 'child_process';
import stringFormat from 'string-format';
import _ from 'lodash';
import Q from 'q';
import * as logger from '../utils/logger.js';
import * as github from '../utils/github.js';
import githubConfig from '../config/github-config.js';
import config from '../config/server-config.js';

const imagePrefix = 'archmageinc/nomic-bot:';

const directories = {
    repo: '/tmp/repo'
};

export const messages = {
    updated: 'Nomic bot has been updated from {currentImage} to {imageName}.',
    error: 'Nomic bot was unable to be updated:\n{error}'
};

export const processUpdate = function (pr) {
    return getCurrentImageName().then(function (currentImageName) {
        const newImageName = imagePrefix + pr.number;
        const latestImageName = imagePrefix + 'latest';

        return getCode()
            .then(_.partial(buildContainer, newImageName))
            .then(_.partial(tagContainer, newImageName, latestImageName))
            .then(_.partial(dockerLogin, config.docker.user, config.docker.password))
            .then(_.partial(pushContainer, newImageName))
            .then(_.partial(pushContainer, latestImageName))
            .then(doAllTheThings)
            .catch(function (error) {
                logger.warn(error);
            });
        
    });
}

const doAllTheThings = function () {
    /**
     * TODO:
     *
     * This somehow needs to execute the container restart & reconfig script
     * so the parent is able to start the new docker container and properly
     * forward requests to the new address!
     *
     * That script must then call a hidden endpoint with the proper parameters
     * so it can post the nomic bot updated message;
     */
    return execCommand('echo "Aaaagggghhhh!');
}

const dockerLogin = function (username, password) {
    return execCommand('docker login -u "' + username + '" -p "' + password + '"');
};

const pushContainer = function (newImageName) {
    return execCommand('docker push ' + newImageName);
};

const tagContainer = function (newImageName, taggedName) {
    return execCommand('docker tag ' + newImageName + ' ' + taggedName);
};

const buildContainer = function (newImageName) {
    return execCommand('docker build -t ' + newImageName + ' ./', {cwd: directories.repo});
};

const getCode = function () {
    return execCommand('git clone https://github.com/' + githubConfig.repository.owner + '/' + githubConfig.repository.repo + '.git ' + directories.repo);
};

export const getCurrentImageName = function () {
    return execCommand('docker ps --filter name=nomic_bot --format "{{.Image}}"');
}

const execCommand = function (command, opts) {
    opts = opts || {};
    const deferred = Q.defer();
    if (!config.testing) {
        child.exec(command, opts, function (error, output) {
            if (error) {
                logger.warn(error.message);
                deferred.reject(error.message);
            } else {
                deferred.resolve(output);
            }
        });
    } else {
        logger.log('Mocking Execution of Command:\n  ' + command);
        deferred.resolve('MockCommandOutput');
    }

    return deferred.promise;
}