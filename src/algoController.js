// Controls interaction with algorithm bank
const { Constants, ErrorHelper } =  require('eae-utils');

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
};

/**
 * @fn checkReq
 * @desc Check if request is a valid request. This will check if algorithm string is valid.
 * algorithm name must consist only of lower case alphabets, hyphens and numerals. If update is false, then algorithm name
 * must be unique, else it must already be present in the collection. description must be free text. className must be
 * present in algorithm string, such that it is defined as a class and must consist of
 * alphabets, underscores and numerals only.
 * @param req
 * @param update
 * @return true if request is valid, false otherwise.
 */
AlgoController.prototype.checkReq = function (req, update) {
    let update = update ? update : false;
}
