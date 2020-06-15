var request = require('request');
const $ = require('cheerio');


exports.getAssignments = function (email, password) {
    return new Promise(function (resolve, reject) {
        var j = request.jar();
        request.get({
            uri: 'https://app.schoology.com/login',
            jar: j
        }, function (err, res, body) {
            if (err || body == '' || body == null || body == undefined) {
                console.log(err);
                reject();
            } else {
                body = body.substring((body.indexOf('name="form_build_id" id="') + ('name="form_build_id" id="').length), body.length);
                var formBuildId = body.substring(0, body.indexOf('"'));
                // console.log(formBuildId);
                request.post({
                    uri: 'https://app.schoology.com/login',
                    jar: j,
                    form: {
                        'mail': email,
                        'pass': password,
                        'school': '',
                        'school_nid': '',
                        'form_build_id': formBuildId,
                        'form_id': 's_user_login_form'
                    }
                }, function (err, res, body) {
                    if (err) {
                        console.log(err);
                        reject();
                    } else {
                        request.get({
                            uri: res.headers.location,
                            jar: j,
                        }, function (err, res, body) {
                            if (err) {
                                console.log(err);
                                reject();
                            } else {
                                request.get({
                                    uri: 'https://app.schoology.com/home/upcoming_ajax',
                                    jar: j,
                                }, function (err, res, body) {
                                    if (err || body == '' || body == null || body == undefined) {
                                        console.log(err);
                                        reject();
                                    } else {
                                        // console.log(body);
                                        try {
                                            // console.log(body);
                                            var json = JSON.parse(body);
                                            var eventHtml = json['html'];
                                            var events = [];
    
                                            var p = getEvents(j, events, eventHtml).then(function (events) {
                                                resolve(events);
                                            }).catch(function () {
                                                reject();
                                            });
                                        } catch (err){
                                            console.log(err);
                                            reject();
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
};

function getEvents(j, events, eventHtml) {
    return new Promise(function (resolve, reject) {

        var list = $('.upcoming-list', eventHtml);
        var elementList = list.children('.upcoming-event.course-event');
        var dateElementList = list.children('.date-header');
        var completeList = {};
        var str = eventHtml;
        var dateElementListI = 0;
        var elementlistI = 0;

        while ((dateElementListI + elementlistI) < (elementList.length + dateElementList.length)) {

            // console.log('date-Header = ' + str.indexOf('date-header'));
            // console.log('upcoming-event = ' + str.indexOf('upcoming-event '));
            // console.log(str);
            if (str.indexOf('date-header') < str.indexOf('upcoming-event ') && str.indexOf('date-header') != -1) { // date header comes first
                completeList['date' + dateElementListI] = (dateElementList[dateElementListI]);
                dateElementListI++;
                str = str.substring(str.indexOf('date-header') + ('date-header').length, str.length);

            } else if ((((str.indexOf('date-header') > str.indexOf('upcoming-event ')) || (str.indexOf('date-header') == -1 && str.indexOf('upcoming-event ') != -1)) && (str.indexOf('upcoming-event ') != -1))) {
                completeList['event' + elementlistI] = (elementList[elementlistI]);
                elementlistI++;
                str = str.substring(str.indexOf('upcoming-event ') + ('upcoming-event ').length, str.length);
            } else {
                break;
            }
        }

        var day, month, year;
        for (var key in completeList) {
            if (key.indexOf('date') != -1) { // a date
                // console.log("key = " + key)
                // var iStr = parseInt(key, 10);
                var date = $(completeList[key]).text();
                // //$(dateElementList[i]).text()
                var month = getMonth(date);
                var day = getDay(date);
                var year = getYear(date);

                // console.log(day);
                // console.log(month);
                // console.log(year);
            } else { // an event
                var nameElement = $(completeList[key]).children().children().children('a');
                var classNameElement = $(completeList[key]).children().children().children('.infotip-content');
                var className = $(classNameElement).text();
                var name = $(nameElement).text();
                var href = $(nameElement).attr('href');
                href = 'https://app.schoology.com' + href;
                // console.log(name);
                // console.log(href);
                // console.log(classNameElement.length);
                // console.log(className);

                var event = {
                    'name': name,
                    'day': day,
                    'class': className,
                    'year': year,
                    'month': month,
                    'source': "Schoology",
                    'href': href
                }
                events.push(event);
                // var event = {
                //         'name': name,
                //         'description': description,
                //         'day': day,
                //         'year': year,
                //         'month': month,
                //         'source': "Schoology",
                //  }
            }
        }

        // console.log(JSON.stringify(events));
        var i = 0;
        // console.log('length: ' + events.length);
        var p = getDescription(i, j, events).then(function(events){
            resolve(events);
        }).catch(function(){
            reject();
        });


        function getDescription(i, j, events) {
            return new Promise(function (resolve, reject) {
                if (i < events.length) {
                    // console.log(i);
                    // console.log(events[i]['href']);
                    request.get({
                        uri: events[i]['href'],
                        jar: j,
                    }, function (err, res, descriptionHtml) {
                        if (err || descriptionHtml == '' || descriptionHtml == null || descriptionHtml == undefined) {
                            console.log(err);
                            reject();
                        } else {
                            // console.log("HELLOO!");
                            var description = $('.s-rte', descriptionHtml).text();
                            events[i]['description'] = description;

                            i++;
                            var p = getDescription(i, j, events).then(function(events){
                                resolve(events);
                            }).catch(function(){
                                reject();
                            });
                        }
                    });

                } else {
                    // console.log("YOOOOOOOOOOOOOO");
                    // console.log(JSON.stringify(events));
                    resolve(events);
                }
            });
        }
    });

    // // json now has a ton of elements that 

    // var date = $(dateElementList[i]).text();
    // var month = getMonth(date);
    // var day = getDay(date);
    // var year = getYear(date);
    // var nameElement = $(list.children('.upcoming-event.course-event')[i]).children().children().children('a');
    // var name = $(nameElement).text();
    // var href = $(nameElement).attr('href');
    // href = 'https://app.schoology.com' + href;

    // // console.log(day);
    // // console.log(month);
    // // console.log(year);
    // // console.log(i);
    // // console.log(name);
    // // console.log(href);
    // request.get({
    //     uri: href,
    //     jar: j,
    // }, function (err, res, descriptionHtml) {
    //     // console.log("HELLOO!");
    //     var description = $('.s-rte', descriptionHtml).text();
    //     var event = {
    //         'name': name,
    //         'description': description,
    //         'day': day,
    //         'year': year,
    //         'month': month,
    //         'source': "Schoology",
    //     }
    //     events.push(event);

    //     if (i < dateElementList.length) {
    //         i++;
    //         getEvents(i, j, events, eventHtml, callback);
    //     } else {
    //         // console.log("YOOOOOOOOOOOOOO");
    //         // console.log(JSON.stringify(event));
    //         callback(events);
    //     }
    // });
}


function getMonth(date) {
    if (date.indexOf("January") != -1) {
        return 1;
    } else if (date.indexOf("February") != -1) {
        return 2;
    } else if (date.indexOf("March") != -1) {
        return 3;
    } else if (date.indexOf("April") != -1) {
        return 4;
    } else if (date.indexOf("May") != -1) {
        return 5;
    } else if (date.indexOf("June") != -1) {
        return 6;
    } else if (date.indexOf("July") != -1) {
        return 7;
    } else if (date.indexOf("August") != -1) {
        return 8;
    } else if (date.indexOf("September") != -1) {
        return 9;
    } else if (date.indexOf("October") != -1) {
        return 10;
    } else if (date.indexOf("November") != -1) {
        return 11;
    } else if (date.indexOf("December") != -1) {
        return 12;
    }
}


function getDay(date) {
    var numString = date.substring((date.lastIndexOf(',') - 2), date.lastIndexOf(','));
    var day = parseInt(numString, 10);
    return day;
}


function getYear(date) {
    var numString = date.substring((date.lastIndexOf(',') + 1));
    var year = parseInt(numString, 10);
    return year;
}