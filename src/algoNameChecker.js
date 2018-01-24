// Check if valid algorithm name
const { ErrorHelper } = require('eae-utils');
const FieldChecker = require('./fieldChecker.js');


function AlgoNameChecker(algoCollection) {
    let fieldName = 'algoName';
    FieldChecker.call(this, fieldName, algoCollection);

    this._checkAll = AlgoNameChecker.prototype._checkAll.bind(this);
}

AlgoNameChecker.prototype = Object.create(FieldChecker.prototype); // Inheritance
AlgoNameChecker.prototype.constructor = AlgoNameChecker;

AlgoNameChecker.prototype._checkAll = function (req) {
    return true;
};

module.exports = AlgoNameChecker;
