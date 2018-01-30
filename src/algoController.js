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
            _this._saveAlgo(algoName, 1, code, false)
                .then(function (fpath) {
                    _this._algoCollection.insert(
                        {
                            'algoName': algoName,
                            'version': version,
                            'description': req.body.description,
                            'algorithm': {
                                'code': fpath,
                                'className': req.body.algorithm.className
                            }
                        }, function(err, item){
                            if(err != null){
                                res.status(500);
                                res.json('Unable to insert in DB');
                            }else{
                                res.status(200);
                                res.json({ ok: true, item: item });
                            }
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
                    _this._saveAlgo(algoName, 1, code, true)
                        .then(function (fpath) {
                            _this._algoCollection.insert(
                                {
                                    'algoName': algoName,
                                    'version': version,
                                    'description': req.body.description,
                                    'algorithm': {
                                        'code': fpath,
                                        'className': req.body.algorithm.className
                                    }
                                }, function(err, item){
                                    if(err != null){
                                        res.status(500);
                                        res.json(ErrorHelper('Unable to insert in DB', err));
                                    }else{
                                        res.status(200);
                                        res.json({ ok: true, item: item });
                                    }
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

module.exports = AlgoController;
