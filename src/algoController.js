// Controls interaction with algorithm bank
const { ErrorHelper } =  require('eae-utils');
const PostRequestChecker = require('./postRequestChecker.js');
const UpdateRequestChecker = require('./updateRequestChecker.js');
const path = require('path');
const fs = require('fs');

/**
 * @class AlgoController
 * @desc Handles all the interaction with the algorithm bank.
 * @param algoCollection MongoDB collection, stores the algorithm data models.
 * @param statusHelper Status helper class.
 * @constructor
 */
function AlgoController(algoCollection, statusHelper) {
    this._algoCollection = algoCollection;
    this._statusHelper = statusHelper;

    this.postRequestChecker = new PostRequestChecker(this._algoCollection);
    this.postRequestChecker.setup();

    this.updateRequestChecker = new UpdateRequestChecker(this._algoCollection);
    this.updateRequestChecker.setup();

    this.addAlgo = AlgoController.prototype.addAlgo.bind(this);
    this.updateAlgo = AlgoController.prototype.updateAlgo.bind(this);
}

/**
 * @fn addAlgo
 * @desc Given algorithm string, algorithm name, description and className in request body it must add algorithm to
 * collection if it is a valid request.
 * @param req Express.js request object
 * @param res Express.js response object
 * @return true if all parameters are correct and valid, rejects an error stack
 * otherwise.
 */
AlgoController.prototype.addAlgo = function(req, res) {
    let _this = this;

    _this.postRequestChecker.checkRequest(req)
        .then(function () {
            let code = _this.postRequestChecker.fieldCheckersArray.get('algorithm').convBase64ToUTF8(req.body.algorithm.code);
            let algoName = req.body.algoName;
            let version = 1;
            _this._saveAlgo(algoName, version, code, false)
                .then(function (fpath) {
                    _this._insertDB(algoName, version, req.body.description, fpath, req.body.algorithm.className)
                        .then(function (item) {
                            res.status(200);
                            res.json({ok: true, item: item});
                        }, function (error) {
                            res.status(500);
                            res.json(error);
                        });
                }, function (error) {
                    res.status(500);
                    res.json(ErrorHelper('Internal server error', error));
                });
        }, function (error) {
            res.status(400);
            res.json(ErrorHelper('Bad request', error));
        });

};

/**
 * @fn updateAlgo
 * @desc Update algorithm given algoName, description and algorithm. algoName must already exist in the DB. This updates the algorithm.
 * @param req Express.js request object
 * @param res Express.js response object
 */
AlgoController.prototype.updateAlgo = function(req, res) {
    let _this = this;

    _this.updateRequestChecker.checkRequest(req)
        .then(function () {
            let code = _this.updateRequestChecker.fieldCheckersArray.get('algorithm').convBase64ToUTF8(req.body.algorithm.code);
            let algoName = req.body.algoName;
            let version = 1;
            _this._algoCollection.find({algoName: algoName}, {version: 1, _id: 0}).sort({version: -1}).limit(1).toArray(function (err, result) {
                if (err) {
                   res.status(500);
                   res.json(ErrorHelper('Unable to read from DB', err));
                } else {
                    version = result[0].version + 1;
                    _this._saveAlgo(algoName, version, code, true)
                        .then(function (fpath) {
                            _this._insertDB(algoName, version, req.body.description, fpath, req.body.algorithm.className)
                                .then(function (item) {
                                    res.status(200);
                                    res.json({ok: true, item: item});
                                }, function (error) {
                                    res.status(500);
                                    res.json(error);
                                });
                        }, function (error) {
                            res.status(500);
                            res.json(ErrorHelper('Internal server error', error));
                        });
                }
            });
        }, function (error) {
            res.status(400);
            res.json(ErrorHelper('Bad request', error));
        });

};

/**
 * @fn _saveAlgo
 * @desc Save the algorithm code in the python file. The file is saved as /folder/{algoName}/v{version}.py
 * @param algoName {string} Name of the algorithm
 * @param version {int} Version of the code
 * @param code {string} Python code to be saved
 * @param update {boolean} Is it the update call or add call. Add call will as well create folders.
 * @return {Promise<any>}
 * @private
 */
AlgoController.prototype._saveAlgo = function(algoName, version, code, update) {
    return new Promise(function (resolve, reject) {
        let saveFolder = path.join(global.opal_algoservice_config.savePath, algoName);
        if (!update && !fs.existsSync(saveFolder)) {
            fs.mkdirSync(saveFolder);
        }
        let saveFile = path.join(saveFolder, 'v' + version.toString() + '.py');
        fs.writeFile(saveFile, code, 'utf8', function (err) {
            if (err) {
                reject(ErrorHelper('Error in saving file', err));
            } else {
                resolve(saveFile);
            }
        });
    });
};

/**
 * @fn _insertDB
 * @desc Insert algorithm object in MongoDB
 * @param algoName {string} Name of the algorithm
 * @param version {int} Version of the code
 * @param description {string} Description of the algorithm
 * @param fpath {string} Path to the saved code file
 * @param className {string} Name of the class.
 * @return {Promise<any>} resolves with inserted item, rejects with an error
 * @private
 */
AlgoController.prototype._insertDB = function (algoName, version, description, fpath, className) {
    let _this = this;
    return new Promise(function (resolve, reject) {
        _this._algoCollection.insert({
            'algoName': algoName,
            'version': version,
            'description': description,
            'algorithm': {
                'code': fpath,
                'className': className
            }
        }, function (err, item) {
            if (err != null) {
                reject(ErrorHelper('Unable to insert in DB', err));
            } else {
                resolve(item);
            }
        });
    });
};

module.exports = AlgoController;
