// External node module imports
const mongodb = require('mongodb').MongoClient;
const express = require('express');
const body_parser = require('body-parser');
const { ErrorHelper, StatusHelper, Constants } =  require('eae-utils');

const package_json = require('../package.json');
const StatusController = require('./statusController.js');


function OpalAlgobank(config) {
    // Initialize member attributes.
    this.config = config;
    this.app = express();
    global.opal_algobank_config = config;

    // bind public member functions
    this.start = OpalAlgobank.prototype.start.bind(this);
    this.stop = OpalAlgobank.prototype.stop.bind(this);

    // bind private member functions
    this._connectDb = OpalAlgobank.prototype._connectDb.bind(this);
    this._setupStatusController = OpalAlgobank.prototype._setupStatusController.bind(this);

    // Remove unwanted express headers
    this.app.set('x-powered-by', false);

    // Allow CORS requests when enabled
    if (this.config.enableCors === true) {
        this.app.use(function (__unused__req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }
    // Init third party middleware
    this.app.use(body_parser.urlencoded({ extended: true }));
    this.app.use(body_parser.json());
}

/**
 * @fn start
 * @desc Start the server, by connecting with DB
 * @return {Promise} Resolves to express app if successful,
 * else rejects with an error stack
 */
OpalAlgobank.prototype.start = function() {
    let _this = this;
    return new Promise(function (resolve, reject) {
        _this._connectDb().then(function () {
            // Setup route using controllers
            _this._setupStatusController();
            // _this._setupJobController();

            // Start status periodic update
            _this.status_helper.startPeriodicUpdate(5 * 1000); // Update status every 5 seconds

            resolve(_this.app); // All good, returns application
        }, function (error) {
            reject(ErrorHelper('Cannot establish mongoDB connection', error));
        });
    });
};

/**
 * @fn stop
 * @desc Stop the opal algobank service
 * @return {Promise} Resolves to true on success,
 * rejects an error stack otherwise
 */
OpalAlgobank.prototype.stop = function() {
    let _this = this;
    return new Promise(function (resolve, reject) {
        // Disconnect DB --force
        _this.db.close(true).then(function(error) {
            if (error)
                reject(ErrorHelper('Closing mongoDB connection failed', error));
            else
                resolve(true);
        });
    });
};

/**
 * @fn _connectDb
 * @desc Setup the connections with mongoDB
 * @return {Promise} Resolves to true on success
 * @private
 */
OpalAlgobank.prototype._connectDb = function() {
    let _this = this;
    return new Promise(function (resolve, reject) {
        mongodb.connect(_this.config.mongoURL, function (err, db) {
            if (err !== null && err !== undefined) {
                reject(ErrorHelper('Failed to connect to mongoDB', err));
                return;
            }
            _this.db = db;
            resolve(true);
        });
    });
};

/**
 * @fn _setupStatusController
 * @desc Initialize status service routes and controller
 */
OpalAlgobank.prototype._setupStatusController = function () {
    let _this = this;

    let statusOpts = {
        version: package_json.version
    };
    _this.status_helper = new StatusHelper(
        global.opal_algobank_config.serviceType, global.opal_algobank_config.port, null, statusOpts);
    _this.status_helper.setCollection(_this.db.collection(Constants.EAE_COLLECTION_STATUS));

    _this.statusController = new StatusController(_this.status_helper);
    _this.app.get('/status', _this.statusController.getStatus); // GET status
    _this.app.get('/specs', _this.statusController.getFullStatus); // GET Full status
};

module.exports = OpalAlgobank;
