const qs = require('querystring');

/**
 * Reads the incoming data from the general request.
 * 
 * Sends the data in a string to the callback function
 */
exports.readIncomingData = function (stream, callback) {
    var body = '';
    stream.on('data', function (chunk) {
        body += chunk.toString(); // convert Buffer to string
    });
    stream.on('end', function () {
        callback(body);
    });
}

/**
 * Reads the incoming data from a form
 * 
 * Sends the data as a Json object to the callback function
 */
exports.readIncomingFormData = function (stream, callback) {
    var body = '';
    stream.on('data', function (chunk) {
        body += chunk.toString(); // convert Buffer to string
    });
    stream.on('end', function () {
        var json;
        json = qs.parse(body);
        callback(json);
    });
}


/**
 * Reads the incoming data from a form
 * 
 * Sends the data as a Json object to the callback function
 */
exports.readIncomingFormDataPromise = function (stream) {
    return new Promise(function(resolve, reject){
        var body = '';
        stream.on('data', function (chunk) {
            body += chunk.toString(); // convert Buffer to string
        });
        stream.on('end', function () {
            var json;
            try{
                json = qs.parse(body);
                resolve(json);
            } catch (err){
                reject();
            }
        });
    });
}



exports.decryptQueryData = function (string) {
    var json = qs.parse(string);
    return json;
}

/**
 * Reads the incoming data as a JSON string
 * 
 * Sends the data as a Json object to the callback function
 */
exports.readIncomingJsonData = function (stream, callback) {
    var body = '';
    stream.on('data', function (chunk) {
        body += chunk.toString(); // convert Buffer to string
    });
    stream.on('end', function () {
        // try{
            var json = JSON.parse(body);
            callback(json);
        // } catch (err){
            
        // }
    });
}


/**
 * Reads the incoming data as a JSON string
 * 
 * Sends the data as a Json object to the callback function
 */
exports.readIncomingJsonDataPromise = function (stream) {
    return new Promise(function(resolve, reject){
        var body = '';
        stream.on('data', function (chunk) {
            body += chunk.toString(); // convert Buffer to string
        });
        stream.on('end', function () {
            try{
                var json = JSON.parse(body);
                resolve(json);
            } catch (err){
                reject();
            }
        });
    });
}