var request = require('request');
const $ = require('cheerio');
const schoolloop = this;


var j = request.jar();


exports.getPage = function (username, password) {


    // request = request.defaults({ jar: true });
    return new Promise(function(resolve, reject){
        j = request.jar();
        request.get('https://cdm.schoolloop.com/portal/login', {
            jar: j,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }, function (err, res, body) {
            if(err || body == '' || body == undefined || body == null){
                console.log('1');
                console.log(err);
                reject();
            } else {
                body = body.substring(body.indexOf('id="form_data_id" value="') + ('id="form_data_id" value="').length, body.length);
                var formDataId = body.substring(0, body.indexOf('"'));
                request.post({
                    uri: 'https://cdm.schoolloop.com/portal/login?etarget=login_form',
                    method: 'POST',
                    jar: j,
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/x-www-form-urlencoded' },
                    form: {
                        'login_name': username,
                        'password': password,
                        'form_data_id': formDataId,
                        'event_override': 'login',
                    }
                }, function (err, res, body) {
                    if (err) {
                        console.log('2');
                        console.log(err);
                        reject();
                    } else {
                        request.get({
                            uri: 'https://cdm.schoolloop.com/',
                            jar: j,
                            method: 'GET',
                            headers: { 'User-Agent': 'Mozilla/5.0' },
                        }, function (err, res, userPageHtml) {
                            if (err) {
                                console.log('3');
                                console.log(err);
                                reject();
                            } else {
                                resolve(userPageHtml);
                            }
        
                        });
                    }
                });
            }
        });
    });
}




exports.getDataJson = function (username, password) {
    // get user data page
    // request the descriptions
    // parse the assignments and due dates
    // parse the descriptions
    // compile a json with all information formatted like an event
    // event like this {name, description, projected time, due date}
    return new Promise(function(resolve, reject){
        j = request.jar();
        var p = schoolloop.getPage(username, password).then(function (userPageHtml) {
            // console.log(username);
            // console.log(password);
            var i = 0;
            var events = [];
    
            var urls = $('.ajax_accordion_row.jsTrackerRefresh', userPageHtml);
            var eventsPromise = schoolloop.compileEvents(urls, userPageHtml, events, i);
            eventsPromise.then(function(json){
                j = request.jar();
                resolve(json);
            }).catch(function(){
                j = request.jar();
                reject();
            });
        }).catch(function(){
            j = request.jar();
            reject();
        });
    });
}


exports.compileEvents = function (urls, userPageHtml, events, i) {
    // console.log(i);
    return new Promise(function(resolve, reject){
        var url = 'https://cdm.schoolloop.com' + urls[i].attribs['data-url'];
        // console.log(url); 
        request.get({
            jar: j,
            uri: url,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        }, function (err, res, descriptionHtml) {
            if (err || descriptionHtml == null || descriptionHtml == undefined || descriptionHtml == '') {
                console.log(err);
                reject();
            } else {
                // console.log(res.headers.location);
                // Comment this stuff out too and test the loop
                var itemTitles = $('.column.padding_5.item_title', userPageHtml);
                var dueDates = $('.column.padding_5.no_wrap', userPageHtml);
                var dueDate = $(dueDates[2 + 3 * i]).text();
                var classNames = $('.column.padding_5', userPageHtml);
    
                var itemTitle = $(itemTitles[i]).text();
                var className = $(classNames[3 + i * 5]).text();
                var description = $('.sllms-content-body', descriptionHtml).text();
                var month = dueDate.substring(dueDate.indexOf('/') - 1, dueDate.indexOf('/'));
                var day = dueDate.substring(dueDate.indexOf('/') + 1, dueDate.lastIndexOf('/'));
                var year = '20' + dueDate.substring(dueDate.lastIndexOf('/') + 1, dueDate.lastIndexOf('/') + 3);
                // console.log(descriptionHtml);
                // console.log($(itemTitles[i]).text());
                // console.log(description);
                // console.log(userPageHtml);
                // console.log(classNames.toString());
                // console.log(day);
                // console.log(month);
                // console.log(year);
    
                var event = {
                    'name': itemTitle,
                    'description': description,
                    'href': "https://cdm.schoolloop.com/portal/student_home",
                    'class': className,
                    'day': day,
                    'month': month,
                    'year': year,
                    'source': 'Schoolloop'
                }
                for (var key in event) {
                    var value = event[key];
                    while ((value.indexOf("\n") != -1) || (value.indexOf("  ") != -1)) {
                        if (value.indexOf("\n") != -1) {
                            value = value.substring(0, value.indexOf("\n")) + value.substring((value.indexOf("\n") + 1), value.length);
                        }
                        if (value.indexOf("  ") != -1) {
                            value = value.substring(0, value.indexOf("  ")) + value.substring((value.indexOf("  ") + 2), value.length);
                        }
                    }
                    event[key] = value;
                    // console.log(value);
                }
    
                events.push(event);
                i++;
                if (i < urls.length) {
                    // Test just the loop here
                    var p = schoolloop.compileEvents(urls, userPageHtml, events, i).then(function(events){
                        resolve(events);
                    }).catch(function(){
                        reject();
                    });
                } else {
                    // console.log(JSON.stringify(events));
                    resolve(events);
                }
            }
        });
    

    });
};