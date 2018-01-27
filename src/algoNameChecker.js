// Check if valid algorithm name
const { ErrorHelper } = require('eae-utils');
const FieldChecker = require('./fieldChecker.js');

/**
 * @class AlgoNameChecker
 * @desc Algorithm Name checker. This field must be contain only lowercase alphabets, numerals and hyphens.
 * @param algoCollection MongoDB collection
 * @constructor
 */
function AlgoNameChecker(algoCollection) {
    let fieldName = 'algoName';
    FieldChecker.call(this, fieldName, algoCollection);

    this._checkPOST = AlgoNameChecker.prototype._checkPOST.bind(this);
    this.regexp = new RegExp('^[a-z0-9-]+$');
}

AlgoNameChecker.prototype = Object.create(FieldChecker.prototype); // Inheritance
AlgoNameChecker.prototype.constructor = AlgoNameChecker;

/**
 * @fn _checkPOST
 * @desc Field check for all requests. Regex matching.
 * @param req Express.js request object.
 * @return {Promise}, returns true on success, else rejects with an error.
 * @private
 */
AlgoNameChecker.prototype._checkPOST = function (req) {
    let _this = this;
    return new Promise(function (resolve, reject){
        let algoName = req.body ? req.body.algoName : undefined;
        if (algoName === undefined) {
            reject(ErrorHelper('algoName not available'));
        }
        if (_this.regexp.test(algoName)) {
            _this._algoCollection.count({'algoName': algoName}, function (err, count) {
                if (count == 0) {
                    resolve(true);
                } else {
                    reject(ErrorHelper('algoName `' + algoName + '` already exists in DB. Use /update to update the algorithm'));
                }
            });
        } else {
            reject(ErrorHelper('algoName must contain only lower case alphabets, numerals and hyphens.'));
        }
    });

};

module.exports = AlgoNameChecker;
