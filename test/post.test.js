// Test POST requests.
const request = require('request');
const eaeutils = require('eae-utils');
let config = require('../config/opal.algoservice.config.js');
let TestServer = require('./testserver.js');
const fs = require('fs');

let ts = new TestServer();

/**
 * @fn getFileBase64
 * @desc Read file in base64 string.
 * @param filepath
 * @return {string}
 */
function getFileBase64(filepath) {
    let data = fs.readFileSync(filepath, 'utf8');
    return new Buffer(data).toString('base64');
}

/**
 * @fn getPostData
 * @desc Return data for Post request, replace the actual arguments if data is supplied.
 * @param data {JSON} JSON object that will have parameters that needs to be replaced, else defaults will be used.
 * @return {{algoName: string, description: string, algorithm: {code: string, className: string }}}
 */
function getPostData(data) {
    data = data ? data : {};
    let filename = data.hasOwnProperty('filename') ? data.filename : 'test/algorithms/popDensity.py';
    return {
        algoName: data.hasOwnProperty('algoName') ? data.algoName : 'pop-density',
        description: data.hasOwnProperty('description') ? data.description : 'Population density',
        algorithm: {
            code:   getFileBase64(filename),
            className: data.hasOwnProperty('className') ? data.description : 'PopulationDensity',
        }
    };
}

beforeAll(function() {
    return new Promise(function (resolve, reject) {
        ts.run().then(function() {
            resolve(true);
        }, function (error) {
            reject(error.toString());
        });
    });
});

/**
 * @fn beforeEach
 * @desc Before each test, sanitize the DB collection.
 */
beforeEach(function () {
    return new Promise(function (resolve, reject) {
        ts.mongo().collection(config.collectionName).drop(function(err, reply) {
            if(err){
                reject(eaeutils.ErrorHelper('Deletion of collection unsuccessful', err));
            } else {
                ts.mongo().createCollection(config.collectionName, function (err, res) {
                    if(err){
                        reject(eaeutils.ErrorHelper('Creation of collection unsuccessful', err));
                    } else {
                        resolve(true);
                    }
                });
            }
        });
    });
});

test('AlgoName with capital characters', function(done) {
    request({
        method: 'POST',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/add',
        body: getPostData({algoName: 'pop-Density'}),
        json: true
        }, function(error, response, body) {
            if (error) {
                done.fail(error.toString());
            }
            expect(response).toBeDefined();
            expect(response.statusCode).toEqual(400);
            done();
        });
});

test('AlgoName with special characters except hyphens', function(done) {
    request({
        method: 'POST',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/add',
        body: getPostData({algoName: 'pop_density'}),
        json: true
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
        }
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(400);
        done();
    });
});

test('Already inserted algoName.', function(done) {
    request({
        method: 'POST',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/add',
        body: getPostData(),
        json: true
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
        }
        expect(response).toBeDefined();
        // console.log(response.body);
        expect(response.statusCode).toEqual(200);
        request({
            method: 'POST',
            baseUrl: 'http://127.0.0.1:' + config.port,
            uri: '/add',
            body: getPostData(),
            json: true
        }, function(error, response, body) {
            if (error) {
                done.fail(error.toString());
            }
            expect(response).toBeDefined();
            expect(response.statusCode).toEqual(400);
            done();
        });
    });
});

test('Undefined description', function(done) {
    request({
        method: 'POST',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/add',
        body: getPostData({description: undefined}),
        json: true
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
        }
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(400);
        done();
    });
});

test('Numerical description', function(done) {
    request({
        method: 'POST',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/add',
        body: getPostData({description: undefined}),
        json: true
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
        }
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(400);
        done();
    });
});

test('Empty description', function(done) {
    request({
        method: 'POST',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/add',
        body: getPostData({description: ''}),
        json: true
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
        }
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(400);
        done();
    });
});

test('Code with multiprocessing library', function (done) {
    request({
        method: 'POST',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/add',
        body: getPostData({filename: 'test/algorithms/popDensityMulti.py'}),
        json: true
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
        }
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(400);
        done();
    });
});

test('Code not using opalalgorithms library', function (done) {
    request({
        method: 'POST',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/add',
        body: getPostData({filename: 'test/algorithms/popDensityOpal.py'}),
        json: true
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
        }
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(400);
        done();
    });
});

test('Code with wrong class name', function (done) {
    request({
        method: 'POST',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/add',
        body: getPostData({className: 'populationDensity'}),
        json: true
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
        }
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(400);
        done();
    });
});

test('Correct description, algoName and algorithm', function(done) {
    request({
        method: 'POST',
        baseUrl: 'http://127.0.0.1:' + config.port,
        uri: '/add',
        body: getPostData(),
        json: true
    }, function(error, response, body) {
        if (error) {
            done.fail(error.toString());
        }
        expect(fs.existsSync(body.item.ops[0].algorithm.code)).toBeTruthy();
        expect(response).toBeDefined();
        expect(response.statusCode).toEqual(200);
        done();
    });
});

afterAll(function() {
    return new Promise(function (resolve, reject) {
        ts.stop().then(function() {
            resolve(true);
        }, function (error) {
            reject(error.toString());
        });
    });
});
