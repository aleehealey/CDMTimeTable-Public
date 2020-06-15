const bcrypt = require('bcryptjs');
const generator = require('generate-password');
const crypto = require('crypto-js');


/**
 * This function takes a password and a callback.
 * Encripts the password into a hashed password and sends it to the callback function.
 */
exports.cryptPassword = function (password, callback) {
  bcrypt.genSalt(10, function (err, salt) {
    if (err)
      return callback(err);

    bcrypt.hash(password, salt, function (err, hash) {
      if(err){
        return callback(err);
      }
      return callback(hash);
    });
  });
};


exports.cryptoCryptPassword = function(plainPassword){
  return new Promise(function(resolve, reject){
    try{
      var ciphertext = crypto.AES.encrypt(plainPassword, key).toString();
      resolve(ciphertext);
    } catch (err){
      reject();
    }
  });
}

exports.cryptoDecryptPassword = function(encryptedPassword){
  return new Promise(function(resolve, reject){
    try {
      var bytes  = crypto.AES.decrypt(encryptedPassword, key);
      var originalText = bytes.toString(crypto.enc.Utf8);
      resolve(originalText);
    } catch (err){
      reject();
    }
  });
}



/**
 * This function takes a password and a callback.
 * Encripts the password into a hashed password and sends it to the callback function.
 */
exports.cryptPasswordPromise = function (password) {
  return new Promise(function(resolve, reject){
    bcrypt.genSalt(10, function (err, salt) {
      if (err)
        return reject();
  
      bcrypt.hash(password, salt, function (err, hash) {
        if(err){
          return reject();
        }
        return resolve(hash);
      });
    });
  });
};

/**
 * This function takes a normal password, like the user's input, and a hashed password and a callback.
 * If the two passwords are the same after being decrypted, a boolean is sent to the callback.
 * True if the same, false if not the same.
 */
exports.comparePassword = function (plainPassword, hashword, callback) {
  bcrypt.compare(plainPassword, hashword, function (err, isPasswordMatch) {
    return err == null ?
      callback(isPasswordMatch) :
      callback(err);
  });
};

/**
 * This function takes a normal password, like the user's input, and a hashed password.
 * If the two passwords are the same after being decrypted, a boolean is sent to the callback.
 * True if the same, false if not the same.
 */
exports.comparePasswordPromise = function (plainPassword, hashword) {
  return new Promise(function (resolve, reject) {
    bcrypt.compare(plainPassword, hashword, function (err, isPasswordMatch) {
      if (err) {
        reject();
      } else {
        if (isPasswordMatch) {
          resolve();
        } else {
          reject();
        }
      }
    });
  });
};

/**
 * This function takes a normal password, like the user's input, and a hashed password and a callback.
 * If the two passwords are the same after being decrypted, a boolean is sent to the callback.
 * True if the same, false if not the same.
 */
exports.comparePasswordSync = function (plainPass, hashword) {
  return bcrypt.compareSync(plainPass, hashword);
};


/**
 * This function generates a password for you with a length of 10 characters.
 * Pretty cool... :)
 */
exports.generatePasswordPromise = function () {
  return new Promise(function (resolve, reject) {
    var password = generator.generate({
      length: 10,
      numbers: true
    });
    resolve(password);
  });
};