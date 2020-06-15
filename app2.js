const http = require('http');
const fs = require('./serverUtility/fileSystem');


// const hostname = '127.0.0.1';
const port = 3000;


// console.log('hello!');

const options = {
    key: fs.readBackSync('key.key'),
    cert: fs.readBackSync('certificate.crt')
    // ca: fs.readBackSync('gd_bundle-g2-g1.crt')
};

// console.log(fs.readBackSync('privateKey.key') + " \n \n " + fs.readBackSync('certificate.crt'))

// process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

var app = http.createServer(function (mainRequest, mainResponse) {
    mainResponse.end('YOOOOO it worked! Oh and Hello world!');
    
});
    

app.listen(port, () => {
    console.log('http');
    console.log('server running');
});
