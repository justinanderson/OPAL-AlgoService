// Controls interaction with algorithm bank
const { ErrorHelper } =  require('eae-utils');
const PostRequestChecker = require('./postRequestChecker.js');

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

    this.addAlgo = AlgoController.prototype.addAlgo.bind(this);
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
            _this._algoCollection.insert({'algoName': req.body.algoName}, function(err, item){
                if(err != null){
                    res.status(500);
                    res.json('Unable to insert in DB');
                }else{
                    res.status(200);
                    res.json({ ok: true, item: item });
                }
            });
        }, function (error) {
            res.status(400);
            res.json(ErrorHelper('Bad request', error));
        });

};

module.exports = AlgoController;
