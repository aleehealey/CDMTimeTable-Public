const { google } = require('googleapis');
const fs = require('../serverUtility/fileSystem');

exports.getAssignmentsList = function (token) {
  return new Promise(function (resolve, reject) {
    fs.readBack('test2_credentials.json', (content) => {  // Authorize a client with credentials, then call the Google Classroom API. 
      // create oAuth2Client object to handle authorization                                                           
      var credentials = JSON.parse(content);
      const { client_secret, client_id, redirect_uris } = credentials.web;
      const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

      oAuth2Client.setCredentials(token);
      var coursePromise = listCourses(oAuth2Client).then(function (coursesArray) {
        // console.log(JSON.stringify(courseIdArray));
        if (coursesArray == null || coursesArray == undefined) {
          error('code', 'Google Request Failed');
          reject();
        } else {
          log("compile", 'Received Google Classes, Google request Working!');
          var events = [];
          var i = 0;
          var assignmentsPromise = listAssignments(oAuth2Client, coursesArray, i, events).then(function (events) {
            resolve(events);
          }).catch(function () {
            reject();
          });
        }
      }).catch(function () {
        reject();
      });

    });
  });
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

/**
 * Lists the first 10 courses the user has access to.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listCourses(auth) {
  return new Promise(function (resolve, reject) {
    const classroom = google.classroom({ version: 'v1', auth });
    classroom.courses.list({
    }, (err, res) => {
      if (err) {
        console.error('The API returned an error: ' + err);
        reject();
      } else {
        const courses = res.data.courses;
        var courseIds = [];
        courses.forEach(function (element, i) {
          // console.log(element.courseState);
          if (element.courseState == "ACTIVE") {
            courseIds.push(element.id);
          }
        });
        resolve(courses);
        // console.log(JSON.stringify(courseIds));
      }
    });
  });
}

function listAssignments(auth, courses, i, events) {
  // console.log('I = ' + i);
  return new Promise(function(resolve, reject){

    if (i < courses.length) {
      const classroom = google.classroom({ version: 'v1', auth });
      classroom.courses.courseWork.list({
        courseId: courses[i].id
      }, function (err, res) {
        if (err || res == null || res == undefined) {
          console.error('The API returned an error: ' + err);
          reject();
        } else {
          var courseWork = res.data.courseWork;
          if (courseWork) {
            for (var j = 0; j < courseWork.length; j++) {
              if (courseWork[j].state == 'PUBLISHED') {
  
                if (courseWork[j].dueDate == null) {
                  event = {
                    'name': courseWork[j].title,
                    'description': courseWork[j].description,
                    'href': courseWork[j].alternateLink,
                    'class': courses[i].name,
                    'day': 0,
                    'year': 0,
                    'month': 0,
                    'source': 'Google Classroom'
                  }
                } else {
                  var day = courseWork[j].dueDate.day;
                  var month = courseWork[j].dueDate.month;
                  var year = courseWork[j].dueDate.year;
  
                  // console.log(day);
                  // console.log(month);
                  // console.log(year);
                  day = day - 1;
  
                  if (day == 0) {
                    month = month - 1;
                    if (month == 0) {
                      month = 12;
                      year = year - 1;
                    }
                    day = getLastDayOf(month, year);
                  }
  
                  // console.log(day);
                  // console.log(month);
                  // console.log(year);
  
                  event = {
                    'name': courseWork[j].title,
                    'description': courseWork[j].description,
                    'href': courseWork[j].alternateLink,
                    'class': courses[i].name,
                    'day': day,
                    'year': year,
                    'month': month,
                    'source': 'Google Classroom'
                  }
                }
                // console.log(JSON.stringify(event));
                events.push(event);
              }
            }
            var p = listAssignments(auth, courses, (i + 1), events).then(function (events) {
              resolve(events);
            }).catch(function () {
              reject();
            });
          } else {
            // console.log('No course Work found.');
            var p = listAssignments(auth, courses, (i + 1), events).then(function (events) {
              resolve(events);
            }).catch(function () {
              reject();
            });
          }
        }
      });
    } else {
      resolve(events);
    }
  
  });
}



function getLastDayOf(month, year) {
  if (month == 1) { // jan
    return 31;
  } else if (month == 2) { // feb
    if (isLeapYear(year)) {
      return 29;
    } else {
      return 28;
    }
  } else if (month == 3) { // Mar
    return 31;
  } else if (month == 4) { // Apr
    return 30;
  } else if (month == 5) { // May
    return 31;
  } else if (month == 6) { // Jun
    return 30;
  } else if (month == 7) { // Jul
    return 31;
  } else if (month == 8) { // Aug
    return 31;
  } else if (month == 9) { // Sep
    return 30;
  } else if (month == 10) { // Oct
    return 31;
  } else if (month == 11) { // Nov
    return 30;
  } else if (month == 12) {
    return 31;
  }

}

function isLeapYear(year) {
  return (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);
}