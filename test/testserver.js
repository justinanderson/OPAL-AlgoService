let express = require('express');
let OpalAlgobank = require('../src/opalAlgoService.js');
let config = require('../config/opal.algoservice.config.js');
let ObjectID = require('mongodb').ObjectID;
const fs = require('fs');
const path = require('path');

function TestServer() {
    // Bind member vars
    this._app = express();
    this.config = config;

    // Bind member functions
    this.run = TestServer.prototype.run.bind(this);
    this.stop = TestServer.prototype.stop.bind(this);
    this.mongo = TestServer.prototype.mongo.bind(this);
}

TestServer.prototype.run = function() {
    let _this = this;
    return new Promise(function(resolve, reject) {
        // Setup node env to test during test
        process.env.TEST = 1;

        // Create opal algobank server
        _this.opal_algobank = new OpalAlgobank(config);

        // Start server
        _this.opal_algobank.start().then(function (compute_router) {
            _this._app.use(compute_router);
            _this._server = _this._app.listen(config.port, function (error) {
                if (error)
                    reject(error);
                else {
                    _this.db.createCollection(Constants_Opal.OPAL_ALGO_COLLECTION, {
                        strict: true
                    }, function(_unused__err, _unused__collection) {
                        resolve(true);
                    });
                }
            });
        }, function (error) {
            reject(error);
        });
    });
};

TestServer.prototype.stop = function() {
    let _this = this;
    return new Promise(function(resolve, reject) {
        // Remove test flag from env
        delete process.env.TEST;

        _this.opal_algobank.stop().then(function() {
            _this._server.close(function(error) {
                if (error)
                    reject(error);
                else
                    resolve(true);
            });
        }, function (error) {
            reject(error);
        });
    });
};

TestServer.prototype.mongo = function() {
    return this.opal_algobank.db;
};

module.exports = TestServer;
