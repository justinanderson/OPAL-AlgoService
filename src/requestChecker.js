// Check if request is valid.
const { ErrorHelper, Constants } = require('eae-utils');

/**
 * @class RequestChecker
 * @desc Abstract class to check if a request is valid.
 * @param reqType {String} Type of request
 * @param algoCollection MongoDB collection
 * @constructor
 */
function RequestChecker(reqType, algoCollection) {
    this._reqType = reqType;
    this._algoCollection = algoCollection;

    this.setupFieldCheckers = RequestChecker.prototype.setupFieldCheckers.bind(this);

    this.fieldCheckersArray = this.setupFieldCheckers();
}

/**
 * @fn setupFieldCheckers
 * @desc This returns an array of functions which will be used to verify if all fields are present.
 * @returns {Map} Map of fieldName to functions of field checker.
 */
RequestChecker.prototype.setupFieldCheckers = function() {
    throw 'Pure method should be implemented in the child class';
}

/**
 * @fn checkRequest
 * @desc Check if request is valid
 * @param req
 * @returns {Promise<any>} true if check is successful, else rejects with an error.
 */
RequestChecker.prototype.checkRequest = function (req) {
    let _this = this;

    return new Promise(function(resolve, reject){
        for (const [fieldName, fieldChecker] in _this.fieldCheckersArray.entries()){
            fieldChecker.check(req, _this.reqType)
                .then(function(success){
                    console.log('Valid field ' + fieldName); // eslint-disable-line no-console
                }, function(error){
                    reject(ErrorHelper('Check for field ' + fieldName + ' failed', error));
                })
        }
        resolve(true);
    });
}
