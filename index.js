'use strict';

/**
 * Module dependencies.
 */

let thunkify = require('thunkify-wrap');
let Minio = require('minio');
let fs = require('fs');

/**
 * Expose `Client`
 */

module.exports = Client;

function Client(options) {
    if (!(this instanceof Client)) {
        return new Client(options);
    }

    this.client = new Minio.Client(options);
    this.options = options;
    thunkify(this.client, ['fGetObject', 'fPutObject', 'removeObject', 'putObject', 'presignedGetObject']);
}


Client.prototype.upload = function* (filePath, options) {
    const key = trimKey(options.key);
    try {
        yield this.client.removeObject(this.options.bucket, key);
    } catch (err) {
        // ignore error here
    }

    yield this.client.fPutObject(this.options.bucket, key, filePath);

    let url = yield this.client.presignedGetObject(this.options.bucket, key, 9999);
    return {url: url};
};

Client.prototype.uploadBuffer = function* (buf, options) {
    const key = trimKey(options.key);
    try {
        yield this.client.removeObject(this.options.bucket, key);
    } catch (err) {
        // ignore error here
    }

    yield this.client.putObject(this.options.bucket, key, buf);

    let url = yield this.client.presignedGetObject(this.options.bucket, key, 9999);
    return {url: url};
};

Client.prototype.url = function* (key) {
    let url = yield this.client.presignedGetObject(this.options.bucket, trimKey(key), 9999);
    return url
};

Client.prototype.download = function*(key, filePath, options) {
    yield this.client.fGetObject(this.options.bucket, trimKey(key), filePath);
};

Client.prototype.remove = function*(key) {
    try {
        return yield this.client.removeObject(this.options.bucket, trimKey(key));
    } catch (err) {
        throw err;
    }
};

function trimKey(key) {
    return key ? key.replace(/^\//, '') : '';
}