// Utilities for testing
const eaeutils = require('eae-utils');
const fs = require('fs');


/**
 * @class TestUtils
 * @desc Utilities to be used for testing.
 * @param testServer TestServer
 * @constructor
 */
function TestUtils(testServer) {
    this.ts = testServer;
    this.getPostData = TestUtils.prototype.getPostData.bind(this);
    this.getFileBase64 = TestUtils.prototype.getFileBase64.bind(this);
    this.createFreshDb = TestUtils.prototype.createFreshDb.bind(this);
}

/**
 * @fn getPostData
 * @desc Return data for Post request, replace the actual arguments if data is supplied.
 * @param data {JSON} JSON object that will have parameters that needs to be replaced, else defaults will be used.
 * @return {{algoName: string, description: string, algorithm: {code: string, className: string }}}
 */
TestUtils.prototype.getPostData = function (data) {
    let _this = this;
    data = data ? data : {};
    let filename = data.hasOwnProperty('filename') ? data.filename : 'test/algorithms/popDensity.py';
    return {
        algoName: data.hasOwnProperty('algoName') ? data.algoName : 'pop-density',
        description: data.hasOwnProperty('description') ? data.description : 'Population density',
        algorithm: {
            code: _this.getFileBase64(filename),
            className: data.hasOwnProperty('className') ? data.description : 'PopulationDensity',
        }
    };
};

/**
 * @fn getFileBase64
 * @desc Read file in base64 string.
 * @param filepath
 * @return {string}
 */
TestUtils.prototype.getFileBase64 = function (filepath) {
    let data = fs.readFileSync(filepath, 'utf8');
    return new Buffer(data).toString('base64');
};

/**
 * @fn createFreshDb
 * @desc Remove old collection and create a new empty collection.
 * @return {Promise<any>}
 */
TestUtils.prototype.createFreshDb = function () {
    let _this = this;
    return new Promise(function (resolve, reject) {
        _this.ts.mongo().collection(_this.ts.config.collectionName).drop(function(err) {
            if(err){
                reject(eaeutils.ErrorHelper('Deletion of collection unsuccessful', err));
            } else {
                _this.ts.mongo().createCollection(_this.ts.config.collectionName)
                    .then(function (res) {
                        resolve(res);
                    },function(err) {
                        reject(eaeutils.ErrorHelper('Creation of collection unsuccessful', err));
                    });
            }
        });
    });
};

module.exports = TestUtils;
