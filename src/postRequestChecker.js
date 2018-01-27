// Checks post request
const RequestChecker = require('./requestChecker.js');
const AlgoNameChecker = require('./algoNameChecker');

/**
 * @class PostRequestChecker
 * @desc Check whether post request is correct or not.
 * @param algoCollection MongoDb collection
 * @constructor
 */
function PostRequestChecker(algoCollection) {
    RequestChecker.call(this, 'post', algoCollection);

    this.setupFieldCheckers = PostRequestChecker.prototype.setupFieldCheckers.bind(this);
}

PostRequestChecker.prototype = Object.create(PostRequestChecker.prototype); // Inheritance
PostRequestChecker.prototype.constructor = PostRequestChecker;

/**
 * @fn setupFieldCheckers
 * @desc Sets up the field checkers for each field.
 * @return {Map<any, any>}
 */
PostRequestChecker.prototype.setupFieldCheckers = function () {
    let _this = this;

    let fieldCheckerMap = new Map();
    let algoNameChecker = new AlgoNameChecker(_this._algoCollection);
    algoNameChecker.setup();
    fieldCheckerMap.set('algoName', algoNameChecker);
    return fieldCheckerMap;
};

module.exports = PostRequestChecker;
