// Algorithm Python Script Checker
const { ErrorHelper } = require('eae-utils');
const FieldChecker = require('./fieldChecker.js');


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

    this._checkAll = AlgoChecker.prototype._checkAll.bind(this);
    this._removeComments = AlgoChecker.prototype._removeComments.bind(this);
    this._removeSingleLineComments = AlgoChecker.prototype._removeSingleLineComments.bind(this);
    this._removeMultiLineComments = AlgoChecker.prototype._removeMultiLineComments.bind(this);
    this._checkLibraries = AlgoChecker.prototype._checkLibraries.bind(this);
    this._checkRestrictedLibrary = AlgoChecker.prototype._checkRestrictedLibrary.bind(this);
    this._checkMustHaveLibrary = AlgoChecker.prototype._checkMustHaveLibrary.bind(this);
    this._splitLines = AlgoChecker.prototype._splitLines.bind(this);
}

AlgoChecker.prototype = Object.create(FieldChecker.prototype); // Inheritance
AlgoChecker.prototype.constructor = AlgoChecker;

AlgoChecker.prototype._checkAll = function (req) {
    let _this = this;
    return new Promise(function (resolve, reject) {
        let algorithm = req.body ? req.body.algorithm : undefined;
        if (algorithm) {
            _this._checkClassName(algorithm)
                .then(function (algoClassName) {
                    _this._checkCode(algorithm, algoClassName)
                        .then(function (success) {
                            resolve(success);
                        }, function (error) {
                            reject(ErrorHelper('Error in algorithm code', error));
                        });
                }, function (error) {
                    reject(ErrorHelper('Error in algorithm className', error));
                });
        } else {
            reject(ErrorHelper('algorithm not available.'));
        }

    });
};


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


AlgoChecker.prototype._checkCode = function (algorithm, algoClassName) {
    let _this = this;
    return new Promise(function(resolve, reject) {
        let algoCode = algorithm ? algorithm.code : undefined;
        if (algoCode) {
            let buf = new Buffer(algoCode, 'base64');
            let code = buf.toString('utf8');
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

AlgoChecker.prototype._checkClassExists = function (algorithm, algoClassName) {
    let classNameRegex = new RegExp('class\\s+' + algoClassName + '\\s*\\((.*?)OPALAlgorithm\\s*\\)');
    return new Promise(function (resolve, reject) {
       if (classNameRegex.test(algorithm)) {
           resolve(true);
       } else {
           reject(ErrorHelper('class ' + algoClassName + ' not found.'));
       }
    });
};

AlgoChecker.prototype._removeComments = function (code) {
    let _this = this;
    code = _this._removeSingleLineComments(code);
    code = _this._removeMultiLineComments(code);
    return code;
};

AlgoChecker.prototype._removeSingleLineComments = function (code) {
    return code.replace(/#(.*?)(?:\r\n|\r|\n)/g, '');
};

AlgoChecker.prototype._removeMultiLineComments = function (code) {
    return code.replace(/(['"])\1\1(.*?)\1{3}/g, '');
};

AlgoChecker.prototype._splitLines = function (para) {
    return para.split(/(?:\r\n|\r|\n)/g);
};


module.exports = AlgoChecker;
