const fs = require('fs');

var fileSystem = this;


/**
 * Checks if a file exists.
 * returns a boolean.  nuf sed.
 */
exports.exists = function (fileName) {
    return fs.existsSync(fileName);
};




/**
 * Checks if a file exists.
 * returns a boolean.  nuf sed.
 */
exports.existsPromise = function (fileName) {
    return new Promise(function (resolve, reject) {
        if (fs.existsSync(fileName)) {
            resolve();
        } else {
            reject();
        }
    });
};

/**
 * This takes the requested url and finds the type of the file, if it has a type
 * This is useful for requests for script and css file GET requests
 * 
 * NOTE: THIS DOES NOT CHECK IF THE FILE IN QUESTION EXISTS, YOU WILL WANT TO CHECK THAT BEFORE YOU USE THIS.
 * 
 * For example, it returns the txt in data.txt 
 * 
 * This can be used to as the writeHead filetype in the html response.
 */
exports.getFileType = function (fileName) {
    var filetype = fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length);
    if (filetype == 'txt') {
        return 'text/plain';
    } else if (filetype == 'js') {
        return 'text/javascript';
    } else {
        return 'text/' + filetype;
    }
};



/**
 * This function takes a filename, sees if the file exists and then, if it does, uses the callback to handle the next step with the data.
 * 
 * NOTE: THIS DOES NOT CHECK IF THE FILE IN QUESTION EXISTS, YOU WILL WANT TO CHECK THAT BEFORE YOU USE THIS.
 */
exports.readBack = function (fileName, callback) {
    if (fileSystem.exists(fileName)) {
        fs.readFile(fileName, function (err, data) {
            var dataStr = data.toString();
            if (err) {
                console.log(err);
                callback(null);
            } else {
                callback(dataStr);
            }
        });
    } else {
        callback('');
    }
};

exports.readBackPromise = function (fileName) {
    // console.log(fileName);
    return new Promise(function (resolve, reject) {

        if (fileSystem.exists(fileName)) {
            fs.readFile(fileName, function (err, data) {
                var dataStr = data.toString();
                if (err) {
                    console.log(err);
                    reject();
                } else {
                    resolve(dataStr);
                }
            });
        } else {
            reject();
        }
    });
}


exports.readBackJson = function (fileName, callback) {
    if (fileSystem.exists(fileName)) {
        fs.readFile(fileName, function (err, data) {
            var dataStr = data.toString();
            if (err) {
                console.log(err);
            } else {
                callback(JSON.parse(dataStr));
            }
        });
    } else {
        callback({});
    }
};


exports.readBackSync = function (fileName) {
    if (fileSystem.exists(fileName)) {
        return fs.readFileSync(fileName);
    } else {
        return '';
    }
};






/**
 * I did this one just because I did it for everything else,  THis function is 
 * literally the same thing as fs.writeFile(filename, data, callback)
 * 
 */
exports.writeFile = function (fileName, data, callback) {
    fs.writeFile(fileName, data, callback);
};



/**
 * I did this one just because I did it for everything else,  THis function is 
 * literally the same thing as fs.writeFile(filename, data, callback)
 * 
 */
exports.writeFilePromise = function (fileName, data) {

    return new Promise(function(resolve, reject){
        fs.writeFile(fileName, data, function(err){
            if(err){
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

