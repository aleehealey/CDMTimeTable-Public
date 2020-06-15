const http = require('http');
const fs = require('./serverUtility/fileSystem');
const streamHandler = require('./serverUtility/streamHandler')
const responseHandler = require('./serverUtility/responseHandler');
const passwordHandler = require('./serverUtility/passwordHandler');
const opn = require('open');
const readline = require('readline');
const { google } = require('googleapis');
const schoolloop = require('./sourceUtility/schoolloopSource');
const classroom = require('./sourceUtility/classroomSource');
const schoology = require('./sourceUtility/schoologySource');


const SCOPES = ['https://www.googleapis.com/auth/classroom.courses.readonly', 'https://www.googleapis.com/auth/classroom.coursework.me.readonly'];
const hostname = '127.0.0.1';
const port = 3000;
const domain = 'https://www.cdmtimetable.com/';

var sessionKeys = {};

// console.log('hello!');

const options = {
    key: fs.readBackSync('key.key'),
    cert: fs.readBackSync('certificate.crt')
    // key: fs.readBackSync('privateKey.key'),
    // cert: fs.readBackSync('86fc881e07c2398e.crt'),
    // ca: [fs.readBackSync('gd.crt'), fs.readBackSync('gd2.crt'), fs.readBackSync('gd3.crt')]
};

// console.log(fs.readBackSync('privateKey.key') + " \n \n " + fs.readBackSync('certificate.crt'))

var app = http.createServer(/* options, */ function (mainRequest, mainResponse) {

    // console.log("New Request!")
//   var url = mainRequest.url;
  var mainReqUrl = mainRequest.url;

  if(mainReqUrl.indexOf('/public_html') != -1){
    var hi = mainReqUrl.substring(0, mainReqUrl.indexOf('/public_html'));
    var there = mainReqUrl.substring(mainReqUrl.indexOf('/public_html') + ('/public_html').length, mainReqUrl.length);
    // console.log(hi);
    // console.log(there);
    mainReqUrl = hi + there;
  }
  
    if(mainReqUrl.indexOf('index.html.var') != -1){
    var hi = mainReqUrl.substring(0, mainReqUrl.indexOf('index.html.var'));
    var there = mainReqUrl.substring(mainReqUrl.indexOf('index.html.var') + ('index.html.var').length, mainReqUrl.length);
    // console.log(hi);
    // console.log(there);
    mainReqUrl = hi + there;
  }
  
  mainReqUrl = mainReqUrl.substring(1, mainRequest.url.length); // cuts off the first unneccessary '/' idk whhy i wanted this but i aint changing it now....
  var mainReqMethod = mainRequest.method; // POST or GET

  alert('Requested URL : ' + mainReqUrl + '   Requested Method : ' + mainReqMethod);

  if (mainReqMethod == 'POST') {
      /**
       * Check the incoming form data to see if the username and passoword is right
       *      use the username to name the file name and check if the username even exists in our files
       * then if the username and password match, use the user's file to parse out their json and create their session Key
       * set their cookie to that hashedKey
       * and redirect them to the mani website, or google if they have that enabled.
       */
      if (mainReqUrl == 'login') {
          // i need to parse out the data from the incoming JSOn
          // build the fileName from the username
          var streamP = streamHandler.readIncomingFormDataPromise(mainRequest).then(function (incomingJson) {
              
              var j = JSON.stringify(incomingJson);
            //   console.log(j);
              incomingJson = JSON.parse(j);
              if (incomingJson.hasOwnProperty('loginUsername') || incomingJson.hasOwnProperty('loginPassword')) {
                  var fileName = 'data/' + incomingJson['loginUsername'] + '.txt';
                  login();
              } else {
                  mainResponse.end('Sorry an Error occured while you were logging in, Please try again.');
              }
              // check if the file exists and if the password is correct
              //if so send back the html file with the changes to it
              //if not, send back loginPage with the error message on it

              async function login() {
                  try {
                      await fs.existsPromise(fileName);
                      var data = await fs.readBackPromise(fileName);
                      var userJson = JSON.parse(data);
                      var key = await passwordHandler.generatePasswordPromise();
                      var hashedKey = await passwordHandler.cryptPasswordPromise(key);
                      await passwordHandler.comparePasswordPromise(incomingJson['loginPassword'], userJson['profile']['password']);

                      // if it goes through all those obstacles then go on to the actual task
                      sessionKeys[key] = {
                          'fileName': fileName,
                          'userJson': {}
                      };


                        await fs.existsPromise('traffic.txt');
                        var trafficData = await fs.readBackPromise('traffic.txt');
                        trafficData = trafficData + fileName + " " + getDateTime() + "\n";
                        // log('login', "traffic=" + trafficData);
                        await fs.writeFilePromise('traffic.txt', trafficData);
                        function getDateTime() {
                            var now = Date.now();
                            var date = new Date(now);
                            var hour = date.getHours();
                            hour = (hour < 10 ? "0" : "") + hour;
                            var min  = date.getMinutes();
                            min = (min < 10 ? "0" : "") + min;
                            var sec  = date.getSeconds();
                            sec = (sec < 10 ? "0" : "") + sec;
                            var year = date.getFullYear();
                            var month = date.getMonth() + 1;
                            month = (month < 10 ? "0" : "") + month;
                            var day  = date.getDate();
                            day = (day < 10 ? "0" : "") + day;
                            return " Date : " + month + "/" + day + "/" + year + "  Time : " + hour + ":" + min + ":" + sec;
                        }
                        function getTime() {
                            var now = Date.now();
                            var date = new Date(now);
                            var hour = date.getHours();
                            hour = (hour < 10 ? "0" : "") + hour;
                            var min  = date.getMinutes();
                            min = (min < 10 ? "0" : "") + min;
                            var sec  = date.getSeconds();
                            sec = (sec < 10 ? "0" : "") + sec;
                            return " Time : " + hour + ":" + min + ":" + sec;
                        }
    
                        updateSessions();

                        async function updateSessions(){
                            try {
                                var sessionArray = [];
                                for(var key in sessionKeys){
                                    sessionArray.push(sessionKeys[key]['fileName'] + ' ' + getTime());
                                }
                                var data = JSON.stringify(sessionArray);
                                await fs.writeFilePromise('sessions.txt', data);
                            } catch (err){
                                error('Did not output session');
                            }
                            
                        } 

                      sessionKeys[key]['userJson'] = userJson; // set the user's session data
                      mainResponse.setHeader("Set-Cookie", 'code=' + hashedKey); // set cookie

                      log('login', "User Session Created");
                      log('login', "Session Cookie Set");

                      // console.log(hashedKey)
                      if (userJson['sources'].hasOwnProperty('classroom')) {

                          log('login', "Google Classroom Enabled")
                          // Load client secrets from a local file.
                          fs.readBack('test2_credentials.json', (content) => {  // Authorize a client with credentials, then call the Google Classroom API. 
                              // create oAuth2Client object to handle authorization                                                           
                              var credentials = JSON.parse(content);
                              const { client_secret, client_id, redirect_uris } = credentials.web;
                              const oAuth2Client = new google.auth.OAuth2(
                                  client_id, client_secret, redirect_uris[0]);

                              // generate URL
                              const authUrl = oAuth2Client.generateAuthUrl({
                                  access_type: 'offline',
                                  scope: SCOPES,
                              });
                              // SEND CLIENT TO THAT URL!!!

                              log('login', "Redirecting Client to Google");
                              mainResponse.writeHead(301, { 'Location': authUrl });
                              mainResponse.end();
                          });
                      } else {
                          // go to main
                          log('login', "Google Classroom NOT Enabled")
                          mainResponse.writeHead(301, { 'Location': domain });
                          mainResponse.end('main');
                      }
                      setTimeout(function () {
                          delete sessionKeys[key];
                            updateSessions();
                          // console.log(JSON.stringify(sessionKeys));
                      }, (30 * 60000)); // 60000 milliseconds in a minute and 30 of theose is 30 minutes
                  } catch (err) {
                      responseHandler.readFileToClient(mainResponse, 'loginPage/loginError.html');
                  }
              }
          }).catch(function(){
              mainResponse.end('Sorry an Error occured while you were logging in, Please try again.');
          });
      } else if (mainReqUrl == 'create') {

          var streamP = streamHandler.readIncomingFormDataPromise(mainRequest).then(function (incomingJson) {

              var j = JSON.stringify(incomingJson);
              incomingJson = JSON.parse(j);
              // i need to see if there exists a file with this username, 
              // no then create a new file,  
              // write a json with 3 jsons in it profile, freetime, events {createdEvents{}}
              // if yes, then send an error page
              if (incomingJson.hasOwnProperty('createPassword') && incomingJson.hasOwnProperty('createPasswordRetype') && incomingJson.hasOwnProperty('createUsername')) {
                  if ((incomingJson['createPassword'] != incomingJson['createPasswordRetype'])) {
                      responseHandler.readFileToClient(mainResponse, 'register/createErrorPassword.html');
                  } else if (incomingJson['createPassword'].length <= 7 || !(/\d/.test(incomingJson['createPassword']))) {
                      responseHandler.readFileToClient(mainResponse, 'register/createErrorPassword.html');
                  } else {
                      fileName = 'data/' + incomingJson['createUsername'] + '.txt';
                      if (!fs.exists(fileName)) {
                          var p = passwordHandler.cryptPasswordPromise(incomingJson['createPassword']).then(function (hashedPassword) {
                              var writeData = JSON.stringify({
                                  'profile': {
                                      'username': incomingJson['createUsername'],
                                      'password': hashedPassword
                                  },
                                  'firstTime': 1,
                                  'freetime': {},
                                  'sources': {},
                                  'events': []
                              });
                              fs.writeFile(fileName, writeData, function (err) {
                                  if (err) {
                                      log('create', "Failed to create new account!");
                                      mainRequest.end("Error Encrypting Password.  Please try again.");
                                  } else {
                                      log('create', "Created New Account!");
                                      responseHandler.readFileToClient(mainResponse, 'register/createSuccess.html');
                                  }
                              });
                          }).catch(function () {
                              mainRequest.end("Error Encrypting Password.  Please try again.");
                          });
                      } else {
                          responseHandler.readFileToClient(mainResponse, 'register/createErrorUsername.html');
                      }
                  }
              }
          }).catch(function(){
              mainResponse.end('Sorry, an error occured while you were creating your account, please try again');
          });
      } else if (mainReqUrl == 'compile') {
          // verify users
          var cookieStr = mainRequest.headers.cookie;
          var p = verifyUserCookies(cookieStr);
          p.then(function (userKey) {
              // compile user data
              var events = [];

              var p1 = new Promise(function (resolve) {
                  if (sessionKeys[userKey]['userJson']['sources'].hasOwnProperty('schoolloop')) {
                      // console.log('Schoolloop');
                    //   log('schoolloop', "doing schoolloop");
                      schoolloopCompile();
                      async function schoolloopCompile() {
                          try {
                              var username = await passwordHandler.cryptoDecryptPassword(sessionKeys[userKey]['userJson']['sources']['schoolloop']['username']);
                              var password = await passwordHandler.cryptoDecryptPassword(sessionKeys[userKey]['userJson']['sources']['schoolloop']['password']);
                                // console.log('schoolloop');
                                // console.log(username);
                                // console.log(password);
                              
                                setTimeout(function(){
                                    resolve();
                                }, 1000 * 20);
                              var schoolloopPromise = schoolloop.getDataJson(username, password).then(function (array) {
                                //   console.log(JSON.stringify(array));
                                  addEvents(array);
                                  log('compile', 'Schoolloop Promise Resolved');
                                  resolve();
                              }).catch(function () {
                                  error('compile', 'Schoolloop Promise Rejected');
                                  resolve();
                              });
                          } catch (err) {
                              error('compile', 'Schoolloop Promise Rejected');
                              resolve();
                          }
                      }
                  } else {
                      resolve();
                  }
              });
              var p2 = new Promise(function (resolve) {
                  if (sessionKeys[userKey]['userJson']['sources'].hasOwnProperty('schoology')) {
                      // console.log('schoology');


                      schoologyCompile();
                      async function schoologyCompile() {
                          try {
                              var username = await passwordHandler.cryptoDecryptPassword(sessionKeys[userKey]['userJson']['sources']['schoology']['username']);
                              var password = await passwordHandler.cryptoDecryptPassword(sessionKeys[userKey]['userJson']['sources']['schoology']['password']);
                                // console.log('schoology');
                                // console.log(username);
                                // console.log(password);
                                
                                setTimeout(function(){
                                    resolve();
                                }, 1000 * 20);
                              var schoologyPromise = schoology.getAssignments(username, password).then(function (array) {
                                  addEvents(array);
                                  log('compile', 'Schoology Promise Resolved');
                                  resolve();
                              }).catch(function () {
                                  error('compile', 'Schoology Promise Rejected');
                                  resolve();
                              });
                          } catch (err) {
                              error('compile', 'Schoology Promise Rejected');
                              resolve();
                          }
                      }
                  } else {
                      resolve();
                  }
              });
              var p3 = new Promise(function (resolve) {
                  if (sessionKeys[userKey]['userJson']['sources'].hasOwnProperty('classroom')) {
                      // console.log('classroom');
                      // console.log('Token = ' + JSON.stringify(sessionKeys[userKey]['userJson']['sources']['classroom']));
                      
                        setTimeout(function(){
                            resolve();
                        }, 1000 * 20);
                      var classroomPromise = classroom.getAssignmentsList(sessionKeys[userKey]['userJson']['sources']['classroom']);
                      classroomPromise.then(function (array) {
                          addEvents(array);
                          log('compile', 'Google Classroom Promise Resolved');
                          resolve();
                      }).catch(function () {
                          error('compile', 'Google Classroom Promise Rejected');
                          resolve();
                      });
                  } else {
                      resolve();
                  }
              });
              Promise.all([p1, p2, p3]).then(function () {
                  // add events to the user json and send their json back
                  // console.log("Resolved!");

                  var existingEvents = sessionKeys[userKey]['userJson']['events'];
                  for (var i = 0; i < events.length; i++) {
                      var copy = false;
                      var event = events[i];
                      for (var j = 0; j < existingEvents.length; j++) {
                          var existingEvent = existingEvents[j];
                          if (event['name'] == existingEvent['name'] &&
                              event['description'] == existingEvent['description'] &&
                              event['class'] == existingEvent['class'] &&
                              event['href'] == existingEvent['href'] &&
                              event['day'] == existingEvent['day'] &&
                              event['year'] == existingEvent['year'] &&
                              event['month'] == existingEvent['month'] &&
                              event['source'] == existingEvent['source']
                          ) {
                              // console.log('same event, skipping');
                              copy = true;
                          }
                      }
                      if (copy == false) {
                          sessionKeys[userKey]['userJson']['events'].push(event);
                          // console.log('not the same, pushing');
                      }
                  }


                  // console.log(JSON.stringify(events));
                  var userJson = sessionKeys[userKey]['userJson'];


                  fs.writeFile(sessionKeys[userKey]['fileName'], JSON.stringify(userJson), function () {
                      log('compile', 'Saved Scraped Data');

                      // deleting passwords before sending it to user
                      // if (userJson['sources'].hasOwnProperty('schoology')) {
                      //     delete userJson['sources']['schoology']['password'];
                      //     delete userJson['sources']['schoology']['username'];
                      // }
                      // if (userJson['sources'].hasOwnProperty('schoolloop')) {
                      //     delete userJson['sources']['schoolloop']['password'];
                      //     delete userJson['sources']['schoolloop']['username'];
                      // }
                      mainResponse.writeHead(200, { 'Content-Type': 'text/plain' });
                      mainResponse.end(JSON.stringify(userJson));
                  });

              });

              function addEvents(array) {
                  array.forEach(function (element, i) {
                      events.push(element);
                  });
              }

          }).catch(function () {
              responseHandler.readFileToClient(mainResponse, 'loginPage/login.html');
          });


      } else if (mainReqUrl == 'new') {
          var cookieStr = mainRequest.headers.cookie;
          var p = verifyUserCookies(cookieStr);
          p.then(function (userKey) {
              // console.log('New Event!');
              var streamP = streamHandler.readIncomingJsonDataPromise(mainRequest).then(function (json) {
                  sessionKeys[userKey]['userJson']['events'].push(json);
                  console.log(JSON.stringify(json));
                  // resave data.
                  fs.writeFile(sessionKeys[userKey]['fileName'], JSON.stringify(sessionKeys[userKey]['userJson']), function (err) {
                      if (err) {
                          error('New', 'Failed to save new Event');
                      } else {
                          log('new', 'Saved New Event');
                      }
                      mainResponse.writeHead(301, { 'Location': domain });
                      mainResponse.end(domain);
                  });
              }).catch(function(){
                  error('New', 'Failed to save new Event');
                  mainResponse.writeHead(301, { 'Location': domain });
                  mainResponse.end(domain);
              });
          }).catch(function () {
              mainResponse.writeHead(301, { 'Location': domain });
              mainResponse.end(domain);
          });
      } else if (mainReqUrl == 'user') {
          var cookieStr = mainRequest.headers.cookie;

          var p = verifyUserCookies(cookieStr);
          p.then(function (userKey) {
              // console.log('sending User Information')
              log('user', "Sending User Information");
              var userJson = sessionKeys[userKey]['userJson'];

              // // deleting passwords
              // if (userJson['sources'].hasOwnProperty('schoology')) {
              //     delete userJson['sources']['schoology']['password'];
              //     delete userJson['sources']['schoology']['username'];
              // }
              // if (userJson['sources'].hasOwnProperty('schoolloop')) {
              //     delete userJson['sources']['schoolloop']['password'];
              //     delete userJson['sources']['schoolloop']['username'];
              // }

              var userJsonStr = JSON.stringify(userJson);
              mainResponse.writeHead(200, { 'Content-Type': 'text/plain' });
              mainResponse.end(userJsonStr);
          }).catch(function () {
              // none...
              mainResponse.writeHead(301, { 'Location': domain });
              mainResponse.end(domain);

          });
      } else if (mainReqUrl == 'newSettings') {
          var cookieStr = mainRequest.headers.cookie;
          var p = verifyUserCookies(cookieStr);
          p.then(function (userKey) {
              // console.log('New Event!');
              var streamP = streamHandler.readIncomingJsonDataPromise(mainRequest).then(function (userSettingsJson) {
                  saveSettings(userSettingsJson);
                  async function saveSettings(userSettingsJson) {

                      try {
                          // making userSettingsJson into a Json to hte server
                          var j = JSON.stringify(userSettingsJson);
                        //   console.log(j);
                          userSettingsJson = JSON.parse(j);


                          // saving the new passwords 
                          if (userSettingsJson.hasOwnProperty('passwords')) {
                              if (userSettingsJson['passwords'].hasOwnProperty('currentPassword') &&
                                  userSettingsJson['passwords'].hasOwnProperty('newPassword')) {


                                  await passwordHandler.comparePasswordPromise(userSettingsJson['passwords']['currentPassword'],
                                      sessionKeys[userKey]['userJson']['profile']['password']); // making sure that the passwords are the same
                                  var newHashedPassword = await passwordHandler.cryptPasswordPromise(userSettingsJson['passwords']['newPassword']);

                                  sessionKeys[userKey]['userJson']['profile']['password'] = newHashedPassword; // saved new Password
                                  log('newsetting', 'Saved New Password');
                              }
                          }

                          if (userSettingsJson.hasOwnProperty('sources')) {
                              // Google Classroom
                              if (userSettingsJson['sources'].hasOwnProperty('classroom')) {
                                  log('newSetting', 'Google Classroom Added');
                                  sessionKeys[userKey]['userJson']['sources']['classroom'] = '';
                              } else if (sessionKeys[userKey]['userJson']['sources'].hasOwnProperty('classroom')) {
                                  delete sessionKeys[userKey]['userJson']['sources']['classroom'];
                                  log('newSetting', 'Deleted Google Classroom');
                              }



                              // Schoolloop
                              if (userSettingsJson['sources'].hasOwnProperty('schoolloop')) {
                                  if (userSettingsJson['sources']['schoolloop'].hasOwnProperty('username') &&
                                      userSettingsJson['sources']['schoolloop'].hasOwnProperty('password')) {
                                      log('newSetting', 'New Schoolloop Account Added');

                                      var username = await passwordHandler.cryptoCryptPassword(userSettingsJson['sources']['schoolloop']['username']);
                                      var password = await passwordHandler.cryptoCryptPassword(userSettingsJson['sources']['schoolloop']['password']);
                                    //   console.log(username);
                                    //   console.log(password);
                                      sessionKeys[userKey]['userJson']['sources']['schoolloop'] = {
                                          'username': username,
                                          'password': password
                                      }
                                  } else {
                                      log('newSetting', 'Schooloop Account Still Exists');
                                  }

                              } else if (sessionKeys[userKey]['userJson']['sources'].hasOwnProperty('schoolloop')) {
                                  delete sessionKeys[userKey]['userJson']['sources']['schoolloop'];
                                  log('newSetting', 'Deleting Schoolloop');
                              }




                              // Schoology
                              if (userSettingsJson['sources'].hasOwnProperty('schoology')) {
                                  if (userSettingsJson['sources']['schoology'].hasOwnProperty('username') &&
                                      userSettingsJson['sources']['schoology'].hasOwnProperty('password')) {
                                      log('newSetting', 'New Schoology Account Added');

                                      var username = await passwordHandler.cryptoCryptPassword(userSettingsJson['sources']['schoology']['username']);
                                      var password = await passwordHandler.cryptoCryptPassword(userSettingsJson['sources']['schoology']['password']);
                                    //   console.log(username);
                                    //   console.log(password);
                                      sessionKeys[userKey]['userJson']['sources']['schoology'] = {
                                          'username': username,
                                          'password': password
                                      }
                                  } else {
                                      log('newSetting', 'Schoology Account Still Exists');
                                  }

                              } else if (sessionKeys[userKey]['userJson']['sources'].hasOwnProperty('schoology')) {
                                  delete sessionKeys[userKey]['userJson']['sources']['schoology'];
                                  log('newSetting', 'Deleting schoology');
                              }
                          }
                          fs.writeFile(sessionKeys[userKey]['fileName'], JSON.stringify(sessionKeys[userKey]['userJson']), function () {
                              log('newSetting', 'Saved New Settings');
                              mainResponse.writeHead(200, { 'Content-Type': 'text/plain' });
                              mainResponse.end('success');
                          });
                          // check if they sent us passwords, check if the password is right, if not send them failed, if yes, keep going
                          // check if they sent us schoolloop,
                          // if they did check if it is blank
                          // if so then do nothing
                          // if it equals something, check that the json has username nad password, encrypt them, and then save them to the sessionJSon
                      } catch (err) {
                          error('newSettings', 'Password didnt match or something');
                          mainResponse.writeHead(200, { 'Content-Type': 'text/plain' });
                          mainResponse.end('failed');
                      }

                  }

              }).catch(function(){
                  error('newSettings', 'Something went Wrong');
                  mainResponse.writeHead(200, { 'Content-Type': 'text/plain' });
                  mainResponse.end('failed');
              });
          }).catch(function () {
              mainResponse.writeHead(301, { 'Location': domain });
              mainResponse.end(domain);
          });
      } else if (mainReqUrl == 'delete') {
          var cookieStr = mainRequest.headers.cookie;
          var p = verifyUserCookies(cookieStr);
          p.then(function (userKey) {
              
              var streamP = streamHandler.readIncomingJsonDataPromise(mainRequest).then(function (deletedEvents) {

                  // console.log(JSON.stringify(deletedEvents));

                  var existingEvents = sessionKeys[userKey]['userJson']['events'];
                  for (var i = 0; i < deletedEvents.length; i++) {
                      var event = deletedEvents[i];
                      for (var j = 0; j < existingEvents.length; j++) {
                          var existingEvent = existingEvents[j];
                          if (event['name'] == existingEvent['name'] &&
                              event['description'] == existingEvent['description'] &&
                              event['class'] == existingEvent['class'] &&
                              event['href'] == existingEvent['href'] &&
                              event['day'] == existingEvent['day'] &&
                              event['year'] == existingEvent['year'] &&
                              event['month'] == existingEvent['month'] &&
                              event['source'] == existingEvent['source']
                          ) {
                              // console.log(JSON.stringify(sessionKeys[userKey]['userJson']['events'][j]));
                              // console.log(JSON.stringify(sessionKeys[userKey]['userJson']['events'][i + 1]));
                              // console.log(JSON.stringify(sessionKeys[userKey]['userJson']['events'][i - 1]));
                              sessionKeys[userKey]['userJson']['events'].splice(j, 1);
                          }
                      }
                  }


                  fs.writeFile(sessionKeys[userKey]['fileName'], JSON.stringify(sessionKeys[userKey]['userJson']), function (err) {
                      if (err) {
                          error('delete', 'Failed to delete Events');
                      } else {
                          log('delete', 'Deleted Events');
                      }
                      mainResponse.writeHead(301, { 'Location': domain });
                      mainResponse.end(domain);
                  });
              }).catch(function(){
                  error('delete', 'Failed to delete Events');
                  mainResponse.writeHead(301, { 'Location': domain});
                  mainResponse.end(domain);
              });
          }).catch(function () {
              mainResponse.writeHead(301, { 'Location': domain});
              mainResponse.end(domain);
          });
      } else if (mainReqUrl == 'first'){
        
          var cookieStr = mainRequest.headers.cookie;
          var p = verifyUserCookies(cookieStr);
          p.then(function (userKey) {
              // console.log('New Event!');
              // resave data.
              sessionKeys[userKey]['userJson']['firstTime'] = 0;
              fs.writeFile(sessionKeys[userKey]['fileName'], JSON.stringify(sessionKeys[userKey]['userJson']), function (err) {
                  if (err) {
                      error('first', 'Failed to revoke first time status');
                  } else {
                      log('first', 'Revoked First time status');
                  }
                  mainResponse.writeHead(301, { 'Location': domain });
                  mainResponse.end(domain);
              });
          }).catch(function () {
              mainResponse.writeHead(301, { 'Location': domain });
              mainResponse.end(domain);
          });    
      } else {
      mainResponse.writeHead(301, { 'Location': domain });
      mainResponse.end(domain);
      }
  } else if (mainReqMethod == 'GET') {

      var cookieStr = mainRequest.headers.cookie;
      routeUser(cookieStr);
      async function routeUser(cookieStr) {

          try {
              var userKey = await verifyUserCookies(cookieStr);
              if (userKey != null && mainReqUrl.indexOf('?code=') != -1) {
                  var query = streamHandler.decryptQueryData(mainReqUrl);
                  var code = query['?code'];
                  // console.log(code);
                  var content = await fs.readBackPromise('test2_credentials.json');
                  // Authorize a client with credentials, then call the Google Classroom API. 
                  // create oAuth2Client object to handle authorization                                                           
                  var credentials = JSON.parse(content);
                  const { client_secret, client_id, redirect_uris } = credentials.web;
                  const oAuth2Client = new google.auth.OAuth2(
                      client_id, client_secret, redirect_uris[0]);
                      console.log(code);
                  oAuth2Client.getToken(code, function (err, token) { // this function does not work with promises, so don't try.
                      if (err) {
                          console.error("Google login did not work");
                      } else {
                          // store token to userJson
                          log('code', "Google returned valid Token");
                          sessionKeys[userKey]['userJson']['sources']['classroom'] = token;
                      }
                      getMethodRouting(true);
                  });
              } else {
                  getMethodRouting(true);
              }

          } catch (err) {
              getMethodRouting(false);
          }
      }

      function getMethodRouting(canLogin) {
          if (fs.exists(mainReqUrl)) {
              if (fs.getFileType(mainReqUrl) != 'text/plain') {
                  responseHandler.readFileToClient(mainResponse, mainReqUrl);
              } else {
                  mainResponse.writeHead(200, { 'Content-Type': 'text/plain' });
                  mainResponse.end("OHHHHHH no you don't, you dirty bastard.");
              }
          } else if (canLogin) { // if their cookie is a cookie stored in sessionKeys
              // main page time
              // console.log("Cookie Matches SessionKEy")
              responseHandler.readFileToClient(mainResponse, 'mainPage/main.html');
          } else {
              responseHandler.readFileToClient(mainResponse, 'loginPage/login.html');
          }
      }

  } else {
      // read back, if sorry this request type is not supported
      mainResponse.writeHead(200, { 'Content-Type': 'text/plain' });
      mainResponse.end("Sorry, that request type is not supported by this website.");
  }



  /**
   * Makes sure that the user's cookies exist, 
   *      if nothing, reject, if cookies exist keep going
   * parse cookies
   * make list
   * check if the user has a cookie with the code in it
   * if the user has the correct cookie, resolve
   * if the user doesn't have the right cookie reject also
   * 
   */
  function verifyUserCookies(cookieStr) {
      return new Promise(function (resolve, reject) {
          var hashedKey = null; // thi is what the parsed cookie will become
          var userKey = null;
          var canLogin = false;
          if (cookieStr != null && cookieStr != undefined) {
              var cookieList = cookieStr.split(';'); // List of Client Cookies
              for (var i = 0; i < cookieList.length; i++) {
                  var cookie = cookieList[i];
                  if (cookie.indexOf('code=') != -1) {
                      hashedKey = cookie.substring(cookie.indexOf('code=') + ('code=').length, cookie.length);
                  }
              }
              if (hashedKey != null) {
                  for (var key in sessionKeys) {
                      if (passwordHandler.comparePasswordSync(key, hashedKey)) {
                          userKey = key; // this is the user's key, Can use it now to store google token if need be.
                          canLogin = true;
                          resolve(userKey);
                      }
                  }
              }
          }
          if (!canLogin) {
              reject();
          }
      });
  }
  /**
   * returns if the variable exists or not
   * @param {anything} val 
   */
  function isDefined(val) {
      // console.log(val);
      if (val == null || val == undefined) {
          return false;
      } else {
          return true
      }
  }
  
  
    function log(message) {
      console.log(message);
  }

  function log(path, message) {
      console.log(path.toUpperCase() + ": " + message);
  }

  function alert(message) {
      console.log('');
      console.log('');
      console.log(message);
  }

  function error(message) {
      console.log("**********************************************************************");
      console.log("Error: " + message);
      console.log("**********************************************************************");
  }
  function error(path, message) {
      console.log("**********************************************************************");
      console.log("Error: " + path.toUpperCase() + ": " + message);
      console.log("**********************************************************************");
  }


});

process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});

// app.use(function(err, req, res, next) {
//     res.status(err.status || 500);
//     res.render('error', {
//         message: err.message, 
//         error: err
//     });
//  });
 
// Start the server on port 3000
app.listen(port, () => {
//   console.log('Server running at http://' + hostname+ ':' + port + '/');
//   console.log('Server running at http://' + hostname+ ':' + port + '/');
	console.log('http');

	console.log('server running');
});
