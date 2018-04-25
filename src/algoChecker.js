// Algorithm Python Script Checker
const { ErrorHelper } = require('eae-utils');
const { Constants_Opal } = require('opal-utils');
const FieldChecker = require('./fieldChecker.js');

/**
 * @class AlgoChecker
 * @desc Check if algorithm is correct and satisfies all limitations. Algorithm has two parts code and className.
 * @param algoCollection MongoDb collection
 * @constructor
 */
function AlgoChecker(algoCollection) {
    let fieldName = 'algorithm';
    FieldChecker.call(this, fieldName, algoCollection);

    this._restrictedLibraries = [
        'multiprocessing'
    ];

    this._mustHaveLibraries = [
        'opalalgorithms'
    ];

    this._classNameRegex = new RegExp('^[A-Za-z0-9_]+$');

    this._reducerMethods = [
        Constants_Opal.OPAL_AGGREGATION_METHOD_COUNT,
        Constants_Opal.OPAL_AGGREGATION_METHOD_SUM
    ];

    this._checkAll = AlgoChecker.prototype._checkAll.bind(this);
    this._removeComments = AlgoChecker.prototype._removeComments.bind(this);
    this._removeSingleLineComments = AlgoChecker.prototype._removeSingleLineComments.bind(this);
    this._removeMultiLineComments = AlgoChecker.prototype._removeMultiLineComments.bind(this);
    this._checkLibraries = AlgoChecker.prototype._checkLibraries.bind(this);
    this._checkRestrictedLibrary = AlgoChecker.prototype._checkRestrictedLibrary.bind(this);
    this._checkMustHaveLibrary = AlgoChecker.prototype._checkMustHaveLibrary.bind(this);
    this._checkReducer = AlgoChecker.prototype._checkReducer.bind(this);

    this.convBase64ToUTF8 = AlgoChecker.prototype.convBase64ToUTF8.bind(this); // TODO: Replace this with functions from opal-utils
}

AlgoChecker.prototype = Object.create(FieldChecker.prototype); // Inheritance
AlgoChecker.prototype.constructor = AlgoChecker;

/**
 * @fn _checkAll
 * @desc Check if request has valid algorithm for all type of requests.
 * @param req Express.js request object
 * @return {Promise<any>}
 * @private
 */
AlgoChecker.prototype._checkAll = function (req) {
    let _this = this;
    return new Promise(function (resolve, reject) {
        let algorithm = req.body ? req.body.algorithm : undefined;
        if (algorithm) {
            let promiseList = [];
            promiseList.push(_this._checkClassName(algorithm));
            promiseList.push(_this._checkCode(algorithm));
            promiseList.push(_this._checkReducer(algorithm));
            Promise.all(promiseList)
                .then(function (success) {
                    resolve(success);
                }, function (error) {
                    reject(ErrorHelper('Error in algorithm.', error));
                });
        } else {
            reject(ErrorHelper('algorithm not available.'));
        }

    });
};

/**
 * @fn _checkClassName
 * @desc Check if it is a valid classname by checking against regex.
 * @param algorithm
 * @return {Promise<any>} resolves with className, rejects with an error.
 * @private
 */
AlgoChecker.prototype._checkClassName = function (algorithm) {
    let _this = this;
    return new Promise(function (resolve, reject) {
        let algoClassName = algorithm ? algorithm.className : undefined;
        if (algoClassName) {
            if (_this._classNameRegex.test(algoClassName)) {
                resolve(algoClassName);
            } else {
                reject(ErrorHelper('Invalid algorithm className. Only alphabets, numerals and underscore are valid characters.'));
            }
        } else {
            reject(ErrorHelper('algorithm className not available.'));
        }
    });
};

/**
 * @fn getCode
 * @desc Convert base64 encoded string to utf8 string
 * @param algoCode Base64 encoded string
 * @return {string} Decode base64 string to utf-8
 */
AlgoChecker.prototype.convBase64ToUTF8 = function (algoCode) {
    let buf = new Buffer(algoCode, 'base64');
    let code = buf.toString('utf8');
    return code;
};

/**
 * @fn _checkCode
 * @desc Check if code is valid, it must not use restricted libraries and must use must have libraries. Class must exist which uses passed className argument.
 * @param algorithm {JSON} JSON algorithm object from the request
 * @return {Promise<any>} resolves with true, rejects with error.
 * @private
 */
AlgoChecker.prototype._checkCode = function (algorithm) {
    let _this = this;
    let algoClassName = algorithm.className;
    return new Promise(function(resolve, reject) {
        let algoCode = algorithm ? algorithm.code : undefined;
        if (algoCode) {
            let code = _this.convBase64ToUTF8(algoCode);
            code = _this._removeComments(code);
            _this._checkLibraries(code)
                .then(function() {
                    _this._checkClassExists(code, algoClassName)
                        .then(function (success) {
                            resolve(success);
                        },function (error) {
                            reject(ErrorHelper('Invalid code and className combination.', error));
                        });
                }, function (error) {
                    reject(ErrorHelper('Invalid code', error));
                });
        } else {
            reject(ErrorHelper('algorithm code not available.'));
        }
    });
};

/**
 * @fn _checkLibraries
 * @desc Check that in code string, restricted libraries are not present and must have libraries are present.
 * @param code {String} code string to be checked in.
 * @return {Promise<any>} resolves to true, rejects with error.
 * @private
 */
AlgoChecker.prototype._checkLibraries = function (code) {
    let _this = this;
    return new Promise(function (resolve, reject) {
        let libraryPromisesList = [];
        _this._restrictedLibraries.forEach(function (library){
            libraryPromisesList.push(_this._checkRestrictedLibrary(code, library));
        });
        _this._mustHaveLibraries.forEach(function (library){
            libraryPromisesList.push(_this._checkMustHaveLibrary(code, library));
        });
        Promise.all(libraryPromisesList)
            .then(function (success) {
                resolve(success);
            }, function(error) {
                reject(ErrorHelper('Invalid library usage.', error));
            }
        );
    });
};

/**
 * @fn _checkRestrictedLibrary
 * @desc Checks if library is used or not using regex.
 * @param code {String} code to be checked.
 * @param library {String} library that needs to be checked for.
 * @return {Promise<any>} resolves to true, rejects with an error.
 * @private
 */
AlgoChecker.prototype._checkRestrictedLibrary = function (code, library) {
    let importRegex = new RegExp('import\\s+' + library);
    let fromRegex = new RegExp('from\\s+' + library);
    return new Promise(function (resolve, reject) {
        if (importRegex.test(code) || fromRegex.test(code)) {
            reject(ErrorHelper('algorithm code contains restricted library ' + library));
        } else {
            resolve(true);
        }
    });
};

/**
 * @fn _checkMustHaveLibrary
 * @desc Check that library must have been imported in the code.
 * @param code {String} code to be checked
 * @param library {String} library to be checked
 * @return {Promise<any>} resolves with true, rejects with an error
 * @private
 */
AlgoChecker.prototype._checkMustHaveLibrary = function (code, library) {
    let importRegex = new RegExp('import\\s+' + library);
    let fromRegex = new RegExp('from\\s+' + library);
    return new Promise(function (resolve, reject) {
        if (importRegex.test(code) || fromRegex.test(code)) {
            resolve(true);
        } else {
            reject(ErrorHelper('algorithm code does not contain must have library ' + library));
        }
    });
};

/**
 * @fn _checkClassExists
 * @desc Check that class with className must be defined in the code and must be inherited from OPALAlgorithm
 * @param code {String} code to be checked
 * @param algoClassName {String} className to be checked for.
 * @return {Promise<any>} resolves with true, rejects with an error.
 * @private
 */
AlgoChecker.prototype._checkClassExists = function (code, algoClassName) {
    let classNameRegex = new RegExp('class\\s+' + algoClassName + '\\s*\\((.*?)OPALAlgorithm\\s*\\)');
    return new Promise(function (resolve, reject) {
       if (classNameRegex.test(code)) {
           resolve(true);
       } else {
           reject(ErrorHelper('class ' + algoClassName + ' not found.'));
       }
    });
};

/**
 * @fn _removeComments
 * @desc Remove pythonic comments from the supplied code.
 * @param code {String} code from which comments are to be removed
 * @return {String} code without comments
 * @private
 */
AlgoChecker.prototype._removeComments = function (code) {
    let _this = this;
    code = _this._removeSingleLineComments(code);
    code = _this._removeMultiLineComments(code);
    return code;
};

/**
 * @fn _removeSingleLineComments
 * @desc Removes single line pythonic comments from the python code.
 * @param code {String} Python code.
 * @return {string} code with single line comments removed.
 * @private
 */
AlgoChecker.prototype._removeSingleLineComments = function (code) {
    return code.replace(/#(.*?)(?:\r\n|\r|\n)/g, '');
};

/**
 * @fn _removeMultiLineComments
 * @desc Removes pythonic block comments from the python code
 * @param code {string} Python code
 * @return {string} code with block comments removed.
 * @private
 */
AlgoChecker.prototype._removeMultiLineComments = function (code) {
    return code.replace(/(['"])\1\1(.*?)\1{3}/g, '');
};

/**
 * @fn _checkReducer
 * @desc Check if reducer mentioned is correct, must be amongst valid choices.
 * @param algorithm {JSON}
 * @return {Promise<any>} resolves with true, rejects with error.
 * @private
 */
AlgoChecker.prototype._checkReducer = function (algorithm) {
    let _this = this;
    return new Promise(function (resolve, reject){
        let reducer = algorithm ? algorithm.reducer : undefined;
        if (reducer === undefined) {
            reject(ErrorHelper('reducer not available'));
        } else {
            if (_this._reducerMethods.includes(reducer)) {
                resolve(true);
            } else {
                reject(ErrorHelper('reducer must be from ' + _this._reducerMethods.toString()));
            }
        }
    });
};


module.exports = AlgoChecker;
