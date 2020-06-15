const fs = require('fs');
const fileSystem = require('./fileSystem');


/**
 * This function sends the client a string of data with a simple response.end() funnction.
 * It also sets the response header with a response.writeHead() function. This means, that
 * it is important you define the filetype in the context of response.writeHead(200, {'Content-Type': fileType});
 * 
 * NOTE: THIS DOES NOT CHECK IF THE FILE IN QUESTION EXISTS, YOU WILL WANT TO CHECK THAT BEFORE YOU USE THIS.
 */
exports.readDataToClient = function (response, data, filetype) {
    response.writeHead(200, { 'Content-Type': filetype });
    response.end(data);
};


/**
 * Gets the filetype from the filename and reads the output to the client 
 * This function has a built in callback and therefore should be used as the last step in a stream of code
 * 
 * NOTE: THIS DOES NOT CHECK IF THE FILE IN QUESTION EXISTS, YOU WILL WANT TO CHECK THAT BEFORE YOU USE THIS.
 */
exports.readFileToClient = function (response, fileName) {
    if(fileSystem.exists(fileName)){
        fs.readFile(fileName, function (err, data) {
            if (err) {
                console.log(err);
                response.end(err);
            } else {
                // console.log('DYING!');
                // console.log(data.toString());
                // console.log(fileName.substring(fileName.lastIndexOf('.') + 1, fileName.length));
                response.writeHead(200, { 'Content-Type': fileSystem.getFileType(fileName) });
                response.end(data);
                console.log('FileSystem: sending ' + fileName + " to client");
            }
        });
    } else {
        response.end('Sorry Something went wrong there brov.');
    }
};

