let express = require('express');
let os = require('os');
let app = express();

let config = require('../config/opal.algobank.config.js');
let OpalAlgobank = require('./opalAlgobank.js');

//Remove unwanted express headers
app.set('x-powered-by', false);

let options = Object.assign({}, config);
let algobank = new OpalAlgobank(options);

algobank.start().then(function(algobank_router) {
    app.use(algobank_router);
    app.listen(config.port, function (error) {
        if (error) {
            console.error(error); // eslint-disable-line no-console
            return;
        }
        console.log(`Listening at http://${os.hostname()}:${config.port}/`); // eslint-disable-line no-console
    });
}, function(error) {
    console.error(error); // eslint-disable-line no-console
});