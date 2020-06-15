var calendar = {};
var userData = {};
var mousePosition = {};

/* 
This is the form of the arrays and jsons outlining the calendar

day = {
    'day': startDay.getDate(),
    'month': (startDay.getMonth() + 1),
    'year': parseInt(currentDay.toString('yyyy'), 10),
    'id': 'DD/MM/YYYY'
} 
calendar = {
    'calArray':[
        [7 days] (this is a week)
        [7 days]
        ...
    ],
    'topDay': startDay,
    'bottomDay': endDay



}*/

/* mousePosition = {
    'x':num,
    'y':num
} */


//***********************************
//
// Server Methods
//
//***********************************

function requestUserData(callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.status == 200 || this.readyState == 4) {
            var data = xhttp.responseText;
            callback(data);
        }
    };
    xhttp.open('POST', '/user');
    xhttp.send();
}

function requestNewUserData(callback) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.status == 200 || this.readyState == 4) {
            var data = xhttp.responseText;
            // print('YOOO!');
            callback(data);
        }
    };
    xhttp.open('POST', '/compile');
    xhttp.send();
}

function sendEvent(eventStr) {
    var xhttp = new XMLHttpRequest();
    var alreadyGone = false;
    xhttp.onreadystatechange = function () {
        if (this.status == 200 || this.readyState == 4) {
            if(alreadyGone == false){
                window.alert('Created New Event!');
                window.location.href = '';
                alreadyGone = true;
            } 
        }
    };
    xhttp.open('POST', '/new');
    xhttp.send(eventStr);
}

function sendSettings(userSettingsStr) {
    var xhttp = new XMLHttpRequest();
    var alreadyGone = false;
    xhttp.onreadystatechange = function () {
        if (this.status == 200 || this.readyState == 4) {
            var res = xhttp.responseText;
            if (res == 'failed') {
                var currentPasswordInput = document.getElementById('currentPasswordInput');
                currentPasswordInput.style.borderColor = 'var(--close_out_red)';
                currentPasswordInput.value = '';
                currentPasswordInput.placeholder = 'Incorrect Current Password';
            } else if (res == 'success') {
                
                if(alreadyGone == false){
                    window.alert('Saved New Settings!\nNote: If you changed your source settings, you may need to log in a few times to receive your new assignments.\nLogging out to full reset.');
                    // clear cookies 
                    document.cookie = 'code' + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                    // page redirect
                    window.location.href = '';
                    alreadyGone = true;
                } 
            }
        }
    };
    xhttp.open('POST', '/newSettings');
    xhttp.send(userSettingsStr);
}

function sendDeleteEvent(deleteEventsStr) {
    var xhttp = new XMLHttpRequest();
    var alreadyGone = false;
    xhttp.onreadystatechange = function () {
        if (this.status == 200 || this.readyState == 4) {
            if(alreadyGone == false){
                window.alert('Deleted Event!');
                window.location.href = '';
                alreadyGone = true;
            } 
        }
    };
    xhttp.open('POST', '/delete');
    xhttp.send(deleteEventsStr);
}


function sendFirstTime(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {};
    xhttp.open('POST', '/first');
    xhttp.send();
}


//***********************************
//
// Window Methods
//
//***********************************

/**
 * This function is called when the calendar is first created and initializes the user's account in the client page
 * 
 */

function onStart() {
    if (window.Event) {
        document.captureEvents(Event.MOUSEMOVE);
    }
    document.onmousemove = getCursorXY;

    // request for the data into a json excluding the password -- cool
    // check if the user is first time user -- Awesome
    // find today's date -- 
    // generate calendar 
    // generate this month, month before, and month after
    // then add user information to calendar
    // add event names to a list
    // then add today's event list to today tab
    // add events to recommended to do list


    // commenting this out for now bc it takes too long...
    requestUserData(function (userDataStr) {
        startFn(userDataStr);
        requestNewUserData(function (userDataStr) {
            startFn(userDataStr);
        });
    });

    function startFn(userDataStr) {
        var caltBody = document.getElementById('calendarTableBody');
        caltBody.innerHTML = '';

        // for the reset button
        todayPosition = 0;

        userData = JSON.parse(userDataStr);

        if (userData['firstTime'] == 1) {
            // execute first time user protocall\
            openFirstTime();
            
        } else if(userData['firstTime'] == 2){
            openForHarvard();
        }
        createStartingCalendar();
        adjustCalendar();
        populateSideBlue();
    }
}


function getCursorXY(e) {
    mousePosition = {
        'x': (window.Event) ? e.pageX : event.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft),
        'y': (window.Event) ? e.pageY : event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop)
    };
    // print(mousePosition['x'] + ", " + mousePosition['y']);
}

//***********************************
//
// Side Blue Methods 
//
//***********************************

function populateSideBlue() {

    // populate logo
    var logoDiv = document.getElementById('logoDiv');
    logoDiv.innerHTML = '';
    logoDiv.style.height = document.getElementById('topWhite').offsetHeight + document.getElementById('weekDayLabels').offsetHeight;

    var img = document.createElement('img');
    img.src = 'logo.png';
    var hi = logoDiv.offsetWidth;
    img.style.width = logoDiv.offsetWidth - 10;
    img.style.padding = '5px';
    img.style.paddingTop = '8px';
    img.style.paddingBottom = '0px';


    logoDiv.append(img);

    // populate todayInfo
    var todayInfo = document.getElementById('todayInfo');
    var todayDiv = document.createElement('div');
    todayDiv.innerHTML = "Today";
    todayInfo.innerHTML = '';
    todayInfo.append(todayDiv);

    var today = Date.today().setTimeToNow(); // find today
    var day = today.getDate();
    var month = today.getMonth() + 1;
    var year = parseInt(today.toString('yyyy'), 10);

    var assignmentList = document.createElement('ul');
    findEvents(day, month, year, function (event) {
        var assignmentName = document.createElement('li');
        assignmentName.innerHTML = event['name'];
        assignmentList.append(assignmentName);
    });
    todayInfo.append(assignmentList);

    // populate recommendedToDoList
    // var recommendedToDoList = document.getElementById('recommendedToDoList');
    // var recommendedTitleDiv = document.createElement('div');
    // recommendedTitleDiv.innerHTML = 'Recommended To Do List';
    // recommendedToDoList.innerHTML = '';
    // recommendedToDoList.append(recommendedTitleDiv);
    // recommendedToDoList.append("AI helper yet to be incorperated...");
    // recommendedToDoList.style.textAlign = 'center';

    // populate suggestionDiv
    var suggestionDiv = document.getElementById("suggestionDiv");
    suggestionDiv.innerHTML = '';
    suggestionDiv.style.height = document.getElementById('sideBlue').offsetHeight -
        document.getElementById('logoDiv').offsetHeight -
        document.getElementById('informationDiv').offsetHeight;
}


//***********************************
//
// Calendar Methods 
//
//*********************************** 

function returnToToday() {
    var calendarDiv = document.getElementById('calendarDiv');
    calendarDiv.scrollTo(0, todayPosition);
}

var todayPosition;

function adjustCalendar() {

    // adjust calendar
    var calendarDiv = document.getElementById('calendarDiv');
    var position = calendarDiv.scrollTop; // distance scrolled in pixels from the top of the calDiv


    if (Math.abs(position - todayPosition) > 500) {
        // make the return button visible
        var returnToTodayButton = document.getElementById('returnToTodayButton');
        returnToTodayButton.style.display = 'inline-block';
    }

    var totalHeight = 0;
    var tableBody = calendarDiv.children[0].children[2];
    for (var r = 0; r < tableBody.children.length; r++) {
        totalHeight = totalHeight + tableBody.children[r].children[0].children[0].offsetHeight;
    }

    var tableHeadHeight = calendarDiv.children[0].children[1].offsetHeight;
    var tableHeight = calendarDiv.offsetHeight;
    var heightCantScrollThrough = tableHeight - tableHeadHeight;

    var scrollableHeight = totalHeight - heightCantScrollThrough;

    var topBarrier = scrollableHeight * .05;
    var bottomBarrier = scrollableHeight * .95;


    if (position <= topBarrier) {
        // add Row Time
        // create row on top
        createCalRow(true);
        var th = tableBody.children[r].children[0].children[0].offsetHeight
        var x = th * .7
        calendarDiv.scrollTo(0, x);

        todayPosition = todayPosition + tableBody.children[r].children[0].children[0].offsetHeight;
        // print(todayPosition);

    } else if (position >= bottomBarrier) {
        createCalRow(false);
    }

    var curnPosition = position;
    var i = 0;
    while (curnPosition > tableBody.children[i].children[0].children[0].offsetHeight) {
        curnPosition = curnPosition - tableBody.children[i].children[0].children[0].offsetHeight;
        i++;
    }
    i++;

    var month = calendar['calArray'][i][0]['month'];
    var monthStr = getMonthName(month);
    var monthDiv = document.getElementById('monthDiv');
    monthDiv.innerHTML = monthStr;

    var year = calendar['calArray'][i][0]['year'];
    var yearDiv = document.getElementById('yearDiv');
    yearDiv.innerHTML = year;
}

function createStartingCalendar() {
    var today = Date.today().setTimeToNow(); // find today
    var lastDayOfNextMonth = Date.today().next().month().moveToLastDayOfMonth(); // find last day of next month

    var topDay;// find the sunday of this week
    var endDay;
    if (today.is().sunday()) {
        topDay = today;
    } else {
        topDay = today.last().sunday();
    }
    var bottomDay = topDay.clone(); // sunday
    bottomDay.addDays(-1);// saturday now


    calendar = {
        'calArray': [],
        'topDay': topDay.clone(),
        'bottomDay': bottomDay.clone()
    }

    // start a loop that goes from the start day to the end day
    // create table elements along the way
    // make the days into buttons

    for (var i = 0; i < 7; i++) {
        createCalRow(false);
    }

}
/* 
function drawStartingCalendar() {

    var calendarTableBody = document.getElementById('calendarTableBody');
    // calendarTableBody
    for (var i = 0; i < calendar['calArray'].length; i++) {
        var tr = document.createElement('tr');
        for (var j = 0; j < 7; j++) {
            var td = document.createElement('td');
            var button = document.createElement('button');
            button.id = calendar['calArray'][i][j]['id'];
            button.addEventListener("mouseover", function () { openDescriptionBox() });

            var innerDiv = document.createElement('div');
            innerDiv.innerHTML = calendar['calArray'][i][j]['day']; // date

            var assignmentList = document.createElement('ul');
            for (var k = 0; k < userData['events'].length; k++) {
                var eventDay = parseInt(userData['events'][k]['day'], 10);
                var currentDay = calendar['calArray'][i][j]['day'];

                var eventMonth = parseInt(userData['events'][k]['month'], 10);
                var currentMonth = calendar['calArray'][i][j]['month'];

                var eventYear = parseInt(userData['events'][k]['year'], 10);
                var currentYear = calendar['calArray'][i][j]['year'];

                if (eventDay == currentDay) {
                    if (eventMonth == currentMonth) {
                        if (eventYear == currentYear) {
                            var assignmentTag = document.createElement('li');
                            assignmentTag.innerHTML = userData['events'][k]['name'];
                            assignmentList.append(assignmentTag);
                        }
                    }
                }
            }
            // make the assignment element the whole list of assignments on this day.
            // maybe make it an actual list?

            button.append(innerDiv);
            button.append(assignmentList);
            td.append(button);
            tr.append(td);
        }
        calendarTableBody.append(tr);
    }
} */

/**
 * true or false
 * true to make a row on the top, false to make a row on the bottom
 * 
 * this function assumes that the topDay in the calendar Json is a sunday while the bottomDay is a saturday
 * @param {*} bool
 */
function createCalRow(bool) {
    var week = [];
    // for every week

    var targetDay;
    var currentDay;
    if (bool == true) {
        targetDay = calendar['topDay'];
        currentDay = targetDay.clone();
        currentDay.addDays(-1);
        targetDay.addWeeks(-1);
    } else {
        targetDay = calendar['bottomDay'];
        currentDay = targetDay.clone();
        currentDay.addDays(1);
        targetDay.addWeeks(1);

    }

    for (var i = 0; (i < 7); i++) {
        day = {
            'day': currentDay.getDate(),
            'month': (currentDay.getMonth() + 1),
            'year': parseInt(currentDay.toString('yyyy'), 10),
            'id': (currentDay.getMonth() + 1) + '/' + currentDay.getDate() + '/' + parseInt(currentDay.toString('yyyy'), 10)
        }
        if (bool) {
            week.unshift(day);
            currentDay.addDays(-1);
        } else {
            week.push(day);
            currentDay.addDays(1);
        }
    }
    if (bool) {
        calendar['calArray'].unshift(week);
        calendar['topDay'] = targetDay.clone();
    } else {
        calendar['calArray'].push(week);
        calendar['bottomDay'] = targetDay.clone();
    }

    if (bool) {
        var i = 0; // for the first week
    } else {
        var i = calendar['calArray'].length - 1; // for the last week
    }
    var tr = document.createElement('tr');
    for (var j = 0; j < 7; j++) {
        var td = document.createElement('td');
        var button = document.createElement('button');

        // setting up class and id of these buttons
        button.id = calendar['calArray'][i][j]['id'];
        button.class = 'calButton';

        var innerDiv = document.createElement('div');
        innerDiv.innerHTML = calendar['calArray'][i][j]['day']; // date

        var assignmentList = document.createElement('ul');

        var currentYear = calendar['calArray'][i][j]['year'];
        var currentMonth = calendar['calArray'][i][j]['month'];
        var currentDay = calendar['calArray'][i][j]['day'];

        findEvents(currentDay, currentMonth, currentYear, function (event) {

            var assignmentTag = document.createElement('li');
            assignmentTag.innerHTML = event['name'];
            assignmentList.append(assignmentTag);

        });
        // make the assignment element the whole list of assignments on this day.
        // maybe make it an actual list?


        if (currentDay == Date.today().setTimeToNow().getDate() &&
            currentMonth == (Date.today().setTimeToNow().getMonth() + 1) &&
            currentYear == parseInt(Date.today().setTimeToNow().toString('yyyy'), 10)) {
            // innerDiv.style.backgroundColor = 'var(--secondary_blue)';
            // innerDiv.style.outline = 'solid';
            // innerDiv.style.outlineWidth = '1.5px';
            // innerDiv.style.outlineColor = 'var(--secondary_blue)';
            // innerDiv.style.color = 'var(--main_background_white)';
            innerDiv.style.color = 'var(--blue4)';
        }

        button.append(innerDiv);
        button.append(assignmentList);
        td.append(button);
        tr.append(td);
    }
    var calendarTableBody = document.getElementById('calendarTableBody');
    if (bool) {
        calendarTableBody.prepend(tr);
    } else {
        calendarTableBody.append(tr);
    }

    setTrButtonsHeight(tr);
    setTrButtonsOnClickFunction(tr);

    function setTrButtonsHeight(tr) {
        // fixing the height of the buttons in rows
        var height = tr.offsetHeight;
        for (var i = 0; i < tr.children.length; i++) {
            var button = tr.children[i].children[0];
            button.style.minHeight = height;
        }
    }

    function setTrButtonsOnClickFunction(tr) {
        // setting the onclick functions of the buttons in rows
        for (var i = 0; i < tr.children.length; i++) {
            var button = tr.children[i].children[0];
            button.addEventListener('click', function () {
                closeElement('addEventButton');
                openDescriptionWindow(this.id);
            });
        }
    }
}

/* function makeCalBotRow() {
    var week = [];
    // for every week
    var bottomDay = calendar['bottomDay'];
    var currentDay = bottomDay.clone();
    currentDay.addDays(1);
    bottomDay.addWeeks(1);

    for (var i = 0; (i < 7); i++) {
        day = {
            'day': currentDay.getDate(),
            'month': (currentDay.getMonth() + 1),
            'year': parseInt(currentDay.toString('yyyy'), 10),
            'id': currentDay.getDate() + '/' + (currentDay.getMonth() + 1) + '/' + parseInt(currentDay.toString('yyyy'), 10)
        }
        week.push(day);
        currentDay.addDays(1);
    }
    calendar['calArray'].push(week);
    calendar['bottomDay'] = bottomDay.clone();

    var i = calendar['calArray'].length - 1; // for the last week
    var tr = document.createElement('tr');
    for (var j = 0; j < 7; j++) {
        var td = document.createElement('td');
        var button = document.createElement('button');
        button.id = calendar['calArray'][i][j]['id'];
        var innerDiv = document.createElement('div');
        innerDiv.innerHTML = calendar['calArray'][i][j]['day']; // date

        var assignmentList = document.createElement('ul');
        for (var k = 0; k < userData['events'].length; k++) {
            var eventDay = parseInt(userData['events'][k]['day'], 10);
            var currentDay = calendar['calArray'][i][j]['day'];

            var eventMonth = parseInt(userData['events'][k]['month'], 10);
            var currentMonth = calendar['calArray'][i][j]['month'];

            var eventYear = parseInt(userData['events'][k]['year'], 10);
            var currentYear = calendar['calArray'][i][j]['year'];

            if (eventDay == currentDay) {
                if (eventMonth == currentMonth) {
                    if (eventYear == currentYear) {
                        var assignmentTag = document.createElement('li');
                        assignmentTag.innerHTML = userData['events'][k]['name'];
                        assignmentList.append(assignmentTag);
                    }
                }
            }
        }
        // make the assignment element the whole list of assignments on this day.
        // maybe make it an actual list?

        button.append(innerDiv);
        button.append(assignmentList);
        td.append(button);
        tr.append(td);
    }
    return tr;
}

function makeCalTopRow() {
    var week = [];
    // for every week
    var topDay = calendar['topDay'];
    var currentDay = topDay.clone();
    currentDay.addDays(-1);
    topDay.addWeeks(-1);

    for (var i = 0; (i < 7); i++) {
        day = {
            'day': currentDay.getDate(),
            'month': (currentDay.getMonth() + 1),
            'year': parseInt(currentDay.toString('yyyy'), 10),
            'id': currentDay.getDate() + '/' + (currentDay.getMonth() + 1) + '/' + parseInt(currentDay.toString('yyyy'), 10)
        }
        week.unshift(day);
        currentDay.addDays(-1);
    }
    var str = JSON.stringify(week);
    calendar['calArray'].unshift(week);
    calendar['topDay'] = topDay.clone();


    var i = 0; // for the last week
    var tr = document.createElement('tr');
    for (var j = 0; j < 7; j++) {
        var td = document.createElement('td');
        var button = document.createElement('button');
        button.id = calendar['calArray'][i][j]['id'];
        var innerDiv = document.createElement('div');
        innerDiv.innerHTML = calendar['calArray'][i][j]['day']; // date

        var assignmentList = document.createElement('ul');
        for (var k = 0; k < userData['events'].length; k++) {
            var eventDay = parseInt(userData['events'][k]['day'], 10);
            var currentDay = calendar['calArray'][i][j]['day'];

            var eventMonth = parseInt(userData['events'][k]['month'], 10);
            var currentMonth = calendar['calArray'][i][j]['month'];

            var eventYear = parseInt(userData['events'][k]['year'], 10);
            var currentYear = calendar['calArray'][i][j]['year'];

            if (eventDay == currentDay) {
                if (eventMonth == currentMonth) {
                    if (eventYear == currentYear) {
                        var assignmentTag = document.createElement('li');
                        assignmentTag.innerHTML = userData['events'][k]['name'];
                        assignmentList.append(assignmentTag);
                    }
                }
            }
        }
        // make the assignment element the whole list of assignments on this day.
        // maybe make it an actual list?

        button.append(innerDiv);
        button.append(assignmentList);
        td.append(button);
        tr.append(td);
    }
    return tr;
} */

//***********************************
//
// Attribute Methods
//
//***********************************

/**
 * quick explanation! I switched to coding in all the elements here bc i have to rewrite it every time and this is just easier.
 * @param {*} id 
 */
function openDescriptionWindow(id) {
    var dayDescriptionDiv = document.getElementById('dayDescriptionDiv');
    dayDescriptionDiv.innerHTML = '';
    dayDescriptionDiv.style.display = 'inline-block';

    var innerDiv = document.createElement('div');
    innerDiv.style.overflowY = 'auto';
    innerDiv.style.height = '100%';

    // add close out button
    var closeButton = document.createElement('button');
    closeButton.id = "closeDayDescriptionButton";
    closeButton.innerHTML = 'X';
    closeButton.addEventListener('click', function () {
        //function
        closeElement('dayDescriptionDiv');
        openElement('addEventButton');
    });
    innerDiv.append(closeButton);

    // add date at top
    var dateDiv = document.createElement('div');
    dateDiv.id = 'dayDescriptionDate';
    var date = id;
    dateDiv.innerHTML = date;
    innerDiv.append(dateDiv);

    // event description
    var month = parseInt(id.substring(0, id.indexOf('/')), 10);
    id = id.substring(id.indexOf('/') + 1, id.length);
    var day = parseInt(id.substring(0, id.indexOf('/')), 10);
    id = id.substring(id.indexOf('/') + 1, id.length);
    var year = parseInt(id, 10);

    var infoDiv = document.createElement('div');
    infoDiv.id = 'dayDescriptionInfo';

    var events = [];
    var classNames = {};
    findEvents(day, month, year, function (event) {
        events.push(event);
        classNames[(event['class'] + " - " + event['source'])] = 0;
    });

    for (var key in classNames) {

        var classHeaderInfo = key;
        infoDiv.append(classHeaderInfo);
        var ul = document.createElement('ul');
        ul.style.marginBottom = '30px';
        for (var i = 0; i < events.length; i++) {
            if (key == (events[i]['class'] + " - " + events[i]['source'])) {
                var nameLi = document.createElement('li');
                nameLi.style.marginTop = "10px";

                var assignmentNameInfo = events[i]['name'];
                var assignmentDescriptionInfo = events[i]['description'];

                nameLi.append(assignmentNameInfo);

                ul.append(nameLi);
                ul.append(assignmentDescriptionInfo);

                // var hi = events[i]['href'];

                if (events[i]['href'] != '' && events[i]['href'] != null) {
                    // if(events[i]['href'] == "https://cdm.schoolloop.com/portal/student_home"){
                    //     events[i]['href'] = "https://cdm.schoolloop.com/calendar/month";
                    // }
                    var a = document.createElement('a');
                    a.target = '_blank'
                    a.href = events[i]['href'];
                    a.innerHTML = 'Link to Assignment';
                    ul.append(a);
                }
                // display that event
            }
        }
        infoDiv.append(ul);
    }
    innerDiv.append(infoDiv);

    dayDescriptionDiv.append(innerDiv);

    //add windowAddEventButton
    var windowAddEventButton = document.createElement('button');
    windowAddEventButton.id = 'windowAddEventButton';
    windowAddEventButton.innerHTML = '+';
    windowAddEventButton.addEventListener('click', function () {
        openAddEventPage(day, month, year);
    });

    var deleteEventButton = document.createElement('button');
    var img = document.createElement('img');

    deleteEventButton.id = 'deleteEventButton';
    deleteEventButton.addEventListener('click', function () {
        openDeleteEventDiv(day, month, year);
    });
    deleteEventButton.append(img);
    img.src = 'mainPage/delete.png'

    dayDescriptionDiv.append(windowAddEventButton);
    dayDescriptionDiv.append(deleteEventButton);
}


function openFirstTime() {
    var firstTime = document.getElementById('firstTime');
    firstTime.innerHTML = '';
    firstTime.style.display = 'inline-block';

    // add close out button
    var closeButton = document.createElement('button');
    closeButton.id = "closeDayDescriptionButton";
    closeButton.innerHTML = 'X';
    closeButton.addEventListener('click', function () {
        //function
        closeElement('firstTime');
        if(userData['firstTime'] == 2){

        } else {
            sendFirstTime();
        }
    });
    firstTime.append(closeButton);

    var p1 = document.createElement('p');
    p1.innerHTML = 'HELLO USER!';
    p1.style.marginTop = '55px';
    var p2 = document.createElement('p');
    p2.innerHTML = 'Welcome to the CDM Time Table!';

    var p3 = document.createElement('p');
    p3.innerHTML = '';
    var p4 = document.createElement('p');
    p4.innerHTML = '';
    var p5 = document.createElement('p');
    p5.innerHTML = 'Time Table was created to help students manage and track their homework. Due to the fact that teachers often use multiple platforms to distribute homework, many students were upset with the unnecessary confusion. This website helps compile all of student\'s assignments from all platforms used at CDM.';

    var p6 = document.createElement('p');
    p6.innerHTML = '' ;
    var p7 = document.createElement('p');
    p7.innerHTML = '';
    var p8 = document.createElement('p');
    p8.innerHTML = 'To start using the website click the settings button (in the top right corner) and enable the school platforms you need.  I hope my website makes your life just a little bit simpler.';
    var p10 = document.createElement('p');
    p10.innerHTML = '';
    var p11 = document.createElement('p');
    p11.innerHTML = '';
    var p12 = document.createElement('p');
    p12.innerHTML = '- Austin Leehealey';

    firstTime.append(p1);
    firstTime.append(p2);
    firstTime.append(p3);
    firstTime.append(p4);
    firstTime.append(p5);
    firstTime.append(p6);
    firstTime.append(p7);
    firstTime.append(p8);
    firstTime.append(p10);
    firstTime.append(p11);
    firstTime.append(p12);
}


function openForHarvard() {
    var firstTime = document.getElementById('firstTime');
    firstTime.innerHTML = '';
    firstTime.style.display = 'inline-block';

    // add close out button
    var closeButton = document.createElement('button');
    closeButton.id = "closeDayDescriptionButton";
    closeButton.innerHTML = 'X';
    closeButton.addEventListener('click', function () {
        //function
        closeElement('firstTime');
        openFirstTime();
    });
    firstTime.append(closeButton);

    var p1 = document.createElement('p');
    p1.innerHTML = 'HELLO HARVARD!';
    p1.style.marginTop = '55px';
    var p2 = document.createElement('p');
    p2.innerHTML = 'Welcome to the Corona Del Mar (CDM) Time Table!';

    var p3 = document.createElement('p');
    p3.innerHTML = '';
    var p4 = document.createElement('p');
    p4.innerHTML = ' ';
    var p5 = document.createElement('p');
    p5.innerHTML = 'This account was created so that you could take a look at what I have done during the pandemic so far.  It is available to all students at my school and is currently being used by 138 of them. The tool utilizes a nodeJS backend to aggregate information from the mulitple scheduling tools used by CDM. To accomplish this I researched the APIs of these systems and employed screen scraping when no API was present.';

    var p6 = document.createElement('p');
    p6.innerHTML = '';
    var p7 = document.createElement('p');
    p7.innerHTML = 'The information you see on the calendar is compiled from my personal accounts, so you can have the full student experience.';
    var p8 = document.createElement('p');
    p8.innerHTML = 'Thank you so much for taking the time to visit my website.';
    var p9 = document.createElement('p');
    p9.innerHTML = '-Austin Leehealey';

    firstTime.append(p1);
    firstTime.append(p2);
    firstTime.append(p3);
    firstTime.append(p4);
    firstTime.append(p5);
    firstTime.append(p6);
    firstTime.append(p7);
    firstTime.append(p8);
    firstTime.append(p9);
}


function openAddEventPage(day, month, year) {
    // open the div and clear it
    openElement('addEventDiv');
    var addEventDiv = document.getElementById('addEventDiv');
    addEventDiv.innerHTML = '';

    // add close out button
    var closeButton = document.createElement('button');
    closeButton.id = "closeDayDescriptionButton";
    closeButton.innerHTML = 'X';
    closeButton.addEventListener('click', function () {
        //function
        closeElement('addEventDiv');
    });
    addEventDiv.append(closeButton);

    // Title
    var titleDiv = document.createElement('div');
    titleDiv.id = 'addEventDivTitle';
    titleDiv.innerHTML = 'Create New Event';
    addEventDiv.append(titleDiv);

    // Adding in all the elements 

    // Name and Date ******************************************
    var nameDateDiv = document.createElement('div');
    nameDateDiv.id = 'addEventNameDateDiv';

    var nameDiv = document.createElement('div'); // Big one
    nameDiv.id = 'addEventNameDiv';

    var nameLabelDiv = document.createElement('div'); // sub Big ones
    var nameInput = document.createElement('input');
    nameDiv.append(nameLabelDiv);// sub bigs inside big
    nameDiv.append(nameInput);
    nameLabelDiv.innerHTML = 'Name: ';// tiny inside sub bigs
    nameInput.id = 'addEventNameInput';

    var dateDiv = document.createElement('div'); // Big one
    dateDiv.id = 'addEventDateDiv';

    var dateLabelDiv = document.createElement('div'); // sub Big ones
    var dateInputMonth = document.createElement('input'); // ones inside the INput sub Big one
    var dateInputDay = document.createElement('input'); // 
    var dateInputYear = document.createElement('input');

    dateInputMonth.id = 'addEventMonthInput';
    dateInputDay.id = 'addEventDayInput';
    dateInputYear.id = 'addEventYearInput';

    dateInputMonth.type = 'number';
    dateInputDay.type = 'number';
    dateInputYear.type = 'number';

    dateDiv.append(dateLabelDiv); // sub bigs inside big
    dateLabelDiv.innerHTML = 'Date: '; // tiny inside sub bigs
    dateDiv.append(dateInputMonth);
    dateDiv.append("/");
    dateDiv.append(dateInputDay);
    dateDiv.append("/");
    dateDiv.append(dateInputYear);

    nameDateDiv.append(nameDiv); // bigs inside super big
    nameDateDiv.append(dateDiv);

    addEventDiv.append(nameDateDiv); // super big inside Main Div

    // Class and Description ******************************************
    var classDescriptionDiv = document.createElement('div'); // super big
    classDescriptionDiv.id = 'addEventClassDescriptionDiv';
    var descriptionDiv = document.createElement('div'); // big
    descriptionDiv.id = 'addEventDescriptionDiv';

    var classDiv = document.createElement('div'); // big
    classDiv.id = 'addEventClassDiv';

    var classLabel = document.createElement('div'); // medium 
    classLabel.innerHTML = 'Class: ';
    var classInput = document.createElement('input');
    classInput.id = 'addEventClassInput';

    var descriptionLabel = document.createElement('div'); // medium
    descriptionLabel.innerHTML = 'Description: ';
    var descriptionInput = document.createElement('textarea');
    descriptionInput.id = 'addEventDescriptionInput';

    descriptionDiv.append(descriptionLabel);
    descriptionDiv.append(descriptionInput);
    classDescriptionDiv.append(classDiv);
    classDescriptionDiv.append(descriptionDiv);
    classDiv.append(classLabel);
    classDiv.append(classInput);
    addEventDiv.append(classDescriptionDiv);

    var submitButton = document.createElement('button');
    submitButton.innerHTML = 'Submit';
    submitButton.id = 'addEventSubmitButton';
    submitButton.addEventListener('click', function () {
        sendNewEvent();
        this.disabled = "true";
    });
    addEventDiv.append(submitButton);

    if (day != null && month != null && year != null) {
        dateInputMonth.value = month;
        dateInputDay.value = day;
        dateInputYear.value = year;
    } else {
        dateInputMonth.placeholder = 'MM';
        dateInputDay.placeholder = "DD";
        dateInputYear.placeholder = "YYYY";
    }


    // 
}

function openSettings() {
    openElement('settingsDiv');
    // 1 find the user's array and check if classroom, schoology, and schoolloop are enabled
    openGoogleTag();
    openSchoolloopTag();
    openSchoologyTag();

}
function openGoogleTag() {
    var settingsEnableGoogle = document.getElementById('settingsEnableGoogle');
    settingsEnableGoogle.innerHTML = '';
    if (userData['sources'].hasOwnProperty('classroom')) { // if it already has google enabled
        // Enable Google Classroom
        //     <label class="switch" >
        //         <input type="checkbox" onclick="">
        //         <span class="slider round"></span>
        //     </label>
        var schoolloopTagStr = 'Google Classroom enabled';
        var label = document.createElement('label');
        var input = document.createElement('input');
        var span = document.createElement('span');

        // label
        label.append(input);
        label.append(span);
        label.className = 'switch';
        // input
        input.type = 'checkbox';
        input.checked = true;
        input.id = 'settingsGoogleCheckbox';
        input.addEventListener('click', function () {
            delete userData['sources']['classroom'];
            openGoogleTag();
        });
        //span
        span.classList.add("slider");
        span.classList.add("round");

        // enable google tag
        settingsEnableGoogle.append(schoolloopTagStr);
        settingsEnableGoogle.append(label);
        
        var googleWarning = document.getElementById('googleWarning');
        googleWarning.style.display = 'inline-block';
        
    } else {
        var schoolloopTagStr = 'Google Classroom disabled';
        var label = document.createElement('label');
        var input = document.createElement('input');
        var span = document.createElement('span');

        // label
        label.append(input);
        label.append(span);
        label.className = 'switch';
        // input
        input.type = 'checkbox';
        input.checked = false;
        input.id = 'settingsGoogleCheckbox';
        input.addEventListener('click', function () {
            userData['sources']['classroom'] = '';
            openGoogleTag();
        });
        //span
        span.classList.add("slider");
        span.classList.add("round");
        // enable google tag
        settingsEnableGoogle.append(schoolloopTagStr);
        settingsEnableGoogle.append(label);
        
        var googleWarning = document.getElementById('googleWarning');
        googleWarning.style.display = 'none';
    }
}
function openSchoolloopTag() {
    var settingsEnableSchoolloop = document.getElementById('settingsEnableSchoolloop');
    settingsEnableSchoolloop.innerHTML = '';
    if (userData['sources'].hasOwnProperty('schoolloop')) { // if schoolloop is already enabled
        var schoolloopTagStr = 'Schoolloop enabled';
        var label = document.createElement('label');
        var input = document.createElement('input');
        var span = document.createElement('span');

        // label
        label.append(input);
        label.append(span);
        label.className = 'switch';
        // input
        input.type = 'checkbox';
        input.checked = true;
        input.id = 'settingsSchoolloopCheckbox';
        input.addEventListener('click', function () {
            delete userData['sources']['schoolloop'];
            openSchoolloopTag();
        });
        //span
        span.classList.add("slider");
        span.classList.add("round");

        // enable google tag
        settingsEnableSchoolloop.append(schoolloopTagStr);
        settingsEnableSchoolloop.append(label);

        openElement('settingsSchoolloopDiv');
        var settingsSchoollooopUsername = document.getElementById('settingsSchoolloopUsername');
        var settingsSchoollooopPassword = document.getElementById('settingsSchoolloopPassword');
        settingsSchoollooopUsername.placeholder = 'Update account username';
        settingsSchoollooopPassword.placeholder = 'Update account password';

    } else {
        var schoolloopTagStr = 'Schoolloop disabled';
        var label = document.createElement('label');
        var input = document.createElement('input');
        var span = document.createElement('span');

        // label
        label.append(input);
        label.append(span);
        label.className = 'switch';
        // input
        input.type = 'checkbox';
        input.checked = false;
        input.id = 'settingsSchoolloopCheckbox';
        input.addEventListener('click', function () {
            userData['sources']['schoolloop'] = {
                'username': '',
                'password': ''
            };
            openSchoolloopTag();
        });
        //span
        span.classList.add("slider");
        span.classList.add("round");

        // enable google tag
        settingsEnableSchoolloop.append(schoolloopTagStr);
        settingsEnableSchoolloop.append(label);

        closeElement('settingsSchoolloopDiv');
    }
}
function openSchoologyTag() {

    var settingsEnableSchoology = document.getElementById('settingsEnableSchoology');
    settingsEnableSchoology.innerHTML = '';
    if (userData['sources'].hasOwnProperty('schoology')) {
        var schoologyTagStr = 'Schoology enabled';
        var label = document.createElement('label');
        var input = document.createElement('input');
        var span = document.createElement('span');

        // label
        label.append(input);
        label.append(span);
        label.className = 'switch';
        // input
        input.type = 'checkbox';
        input.checked = true;
        input.id = 'settingsSchoologyCheckbox';
        input.addEventListener('click', function () {
            delete userData['sources']['schoology'];
            openSchoologyTag();
        });
        //span
        span.classList.add("slider");
        span.classList.add("round");

        // enable google tag
        settingsEnableSchoology.append(schoologyTagStr);
        settingsEnableSchoology.append(label);

        var settingsSchoologyUsername = document.getElementById('settingsSchoologyUsername');
        var settingsSchoologyPassword = document.getElementById('settingsSchoologyPassword');
        settingsSchoologyUsername.placeholder = 'Update account username';
        settingsSchoologyPassword.placeholder = 'Update account password';

        openElement('settingsSchoologyDiv');
    } else {
        var schoologyTagStr = 'Schoology disabled';
        var label = document.createElement('label');
        var input = document.createElement('input');
        var span = document.createElement('span');

        // label
        label.append(input);
        label.append(span);
        label.className = 'switch';
        // input
        input.type = 'checkbox';
        input.checked = false;
        input.id = 'settingsSchoologyCheckbox';
        input.addEventListener('click', function () {
            userData['sources']['schoology'] = {
                'username': '',
                'password': ''
            };
            openSchoologyTag();
        });
        //span
        span.classList.add("slider");
        span.classList.add("round");

        // enable google tag
        settingsEnableSchoology.append(schoologyTagStr);
        settingsEnableSchoology.append(label);

        closeElement('settingsSchoologyDiv');
    }
}

function openDeleteEventDiv(day, month, year) {
    openElement('deleteEventDiv');

    var deleteEventDiv = document.getElementById('deleteEventDiv');
    deleteEventDiv.innerHTML = '';

    // add close out button
    var closeButton = document.createElement('button');
    closeButton.id = "closeDayDescriptionButton";
    closeButton.innerHTML = 'X';
    closeButton.addEventListener('click', function () {
        //function
        closeElement('deleteEventDiv');
        markedEvents = [];
    });
    deleteEventDiv.append(closeButton);

    // Title
    var titleDiv = document.createElement('div');
    titleDiv.id = 'addEventDivTitle';
    titleDiv.innerHTML = 'Delete Event ' + month + '/' + day + '/' + year;
    deleteEventDiv.append(titleDiv);

    // Buttons
    var infoDiv = document.createElement('div');
    infoDiv.id = 'dayDescriptionInfo';


    var events = [];
    var classNames = {};
    findEvents(day, month, year, function (event) {
        events.push(event);
        classNames[(event['class'] + " - " + event['source'])] = 0;
    });

    for (var key in classNames) {

        var classHeaderInfo = key;
        infoDiv.append(classHeaderInfo);
        // var ul = document.createElement('ul');
        for (var i = 0; i < events.length; i++) {
            if (key == (events[i]['class'] + " - " + events[i]['source'])) {
                var eventButton = document.createElement('button');
                eventButton.id = JSON.stringify(events[i]);
                eventButton.style.backgroundColor = 'buttonface';
                eventButton.style.minWidth = '100%';
                eventButton.addEventListener('click', function () {
                    markEvent(this);
                });

                var nameLi = document.createElement('p');

                var assignmentNameInfo = events[i]['name'];
                var assignmentDescriptionInfo = events[i]['description'];

                nameLi.append(assignmentNameInfo);

                eventButton.append(nameLi);
                eventButton.append(assignmentDescriptionInfo);

                infoDiv.append(eventButton);

                // var hi = events[i]['href'];

                if (events[i]['href'] != '' && events[i]['href'] != null) {
                    var a = document.createElement('a');
                    a.target = '_blank'
                    a.href = events[i]['href'];
                    a.innerHTML = 'Link to Assignment';
                    eventButton.append(a);
                }
                // display that event
            }
        }
        // infoDiv.append(ul);
    }
    deleteEventDiv.append(infoDiv);

    // final Delete button
    var deleteButton = document.createElement('button');
    deleteButton.innerHTML = 'Delete';
    deleteButton.id = 'finishDeleteButton';
    deleteButton.addEventListener('click', function () {
        deleteEvents();
        this.disabled = 'true';
    });
    deleteEventDiv.append(deleteButton);
}

var markedEvents = [];
function markEvent(button) {
    var event = JSON.parse(button.id);
    if (button.style.backgroundColor == 'buttonface') {
        button.style.backgroundColor = 'var(--tertiary_white)';
        markedEvents.push(event);
    } else if (button.style.backgroundColor == 'var(--tertiary_white)'){
        // Button styling
        button.style.backgroundColor = 'buttonface';


        // delete the event form the array
        var newArray = [];
        for (var i = 0; i < markedEvents.length; i++) {
            var userEvent = markedEvents[i];

            if (userEvent['name'] == event['name'] &&
                userEvent['description'] == event['description'] &&
                userEvent['class'] == event['class'] &&
                userEvent['href'] == event['href'] &&
                userEvent['day'] == event['day'] &&
                userEvent['year'] == event['year'] &&
                userEvent['month'] == event['month'] &&
                userEvent['source'] == event['source']
            ) {

            } else {
                newArray.push(userEvent);
            }
        }
        markedEvents = newArray;
    }
    // print(JSON.stringify(markedEvents));
}

function deleteEvents() {
    sendDeleteEvent(JSON.stringify(markedEvents));
    markedEvents = [];
}

function sendNewSettings() {
    var userSettings = {
        'sources': {}
    }

    var settingsChangePasswordDiv = document.getElementById('settingsChangePasswordDiv');
    var settingsGoogleCheckbox = document.getElementById('settingsGoogleCheckbox');
    var settingsSchoolloopCheckbox = document.getElementById('settingsSchoolloopCheckbox');
    var settingsSchoologyCheckbox = document.getElementById('settingsSchoologyCheckbox');

    if (settingsChangePasswordDiv.style.display == 'inline-block') {
        var currentPasswordInput = document.getElementById('currentPasswordInput');
        var newPasswordInput = document.getElementById('newPasswordInput');
        var newRetypePasswordInput = document.getElementById('newRetypePasswordInput');

        var curnPassword = currentPasswordInput.value;
        var newPassword = newPasswordInput.value;
        var retypedPassword = newRetypePasswordInput.value;

        if (newPassword != retypedPassword) {
            newPasswordInput.value = '';
            newRetypePasswordInput.value = '';
            newPasswordInput.placeholder = 'Passwords do not match';
            newRetypePasswordInput.placeholder = 'Passwords do not match';
            newPasswordInput.style.borderColor = 'var(--close_out_red)';
            newRetypePasswordInput.style.borderColor = 'var(--close_out_red)';
            return;
        }

        if (newPassword.length <= 7) {
            newPasswordInput.value = '';
            newRetypePasswordInput.value = '';
            newPasswordInput.placeholder = 'Password must be at least 8 characters';
            newRetypePasswordInput.placeholder = 'Password must be at least 8 characters';
            newPasswordInput.style.borderColor = 'var(--close_out_red)';
            newRetypePasswordInput.style.borderColor = 'var(--close_out_red)';
            return;
        }

        if (!(/\d/.test(newPassword))) {
            newPasswordInput.value = '';
            newRetypePasswordInput.value = '';
            newPasswordInput.placeholder = 'Password must have at least one number';
            newRetypePasswordInput.placeholder = 'Password must have at least one number';
            newPasswordInput.style.borderColor = 'var(--close_out_red)';
            newRetypePasswordInput.style.borderColor = 'var(--close_out_red)';
            return;
        }

        userSettings['passwords'] = {
            'currentPassword': curnPassword,
            'newPassword': newPassword
        };
    }
    if (settingsGoogleCheckbox.checked == true) {
        userSettings['sources']['classroom'] = '';
    }
    if (settingsSchoolloopCheckbox.checked == true) {
        var settingsSchoolloopUsername = document.getElementById('settingsSchoolloopUsername');
        var settingsSchoolloopPassword = document.getElementById('settingsSchoolloopPassword');

        var schoolloopUsername = settingsSchoolloopUsername.value;
        var schoolloopPassword = settingsSchoolloopPassword.value;
        if (schoolloopUsername == '' || schoolloopPassword == '') {
            userSettings['sources']['schoolloop'] = '';
        } else {
            userSettings['sources']['schoolloop'] = {
                'username': schoolloopUsername,
                'password': schoolloopPassword
            }
        }
    }
    if (settingsSchoologyCheckbox.checked == true) {
        var settingsSchoologyUsername = document.getElementById('settingsSchoologyUsername');
        var settingsSchoologyPassword = document.getElementById('settingsSchoologyPassword');

        var schoologyUsername = settingsSchoologyUsername.value;
        var schoologyPassword = settingsSchoologyPassword.value;

        if (schoologyUsername == '' || schoologyPassword == '') {
            userSettings['sources']['schoology'] = '';
        } else {
            userSettings['sources']['schoology'] = {
                'username': schoologyUsername,
                'password': schoologyPassword
            }
        }
    }

    sendSettings(JSON.stringify(userSettings));
    // get this id and chheck if it's display is not none settingsChangePasswordDiv
    // if it is none, do nothing ot the password
    // if it is not none then get check the current password to see if it is right
    // if settingsGoogleCheckbox is checked make sure that the userJson has that element 'classroom' = ''
}

function sendNewEvent() {
    var name = document.getElementById('addEventNameInput').value;
    var description = document.getElementById('addEventDescriptionInput').value;
    var month = document.getElementById('addEventMonthInput').value;
    var day = document.getElementById('addEventDayInput').value;
    var year = document.getElementById('addEventYearInput').value;
    var course = document.getElementById('addEventClassInput').value;

    if (name == null) {
        name = '';
    }
    if (description == null) {
        description = '';
    }
    if (month == null) {
        month = '';
    }
    if (day == null) {
        day = '';
    }
    if (year == null) {
        year = '';
    }
    if (course == null) {
        course = '';
    }

    var event = {
        "name": name,
        "description": description,
        "class": course,
        "href": "",
        "day": day,
        "year": year,
        "month": month,
        "source": "Me"
    }
    var eventStr = JSON.stringify(event);

    sendEvent(eventStr);
}

function logOut() {
    // clear cookies 
    document.cookie = 'code' + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // page redirect
    window.location.href = '';
}

function toggleElement(id) {
    var el = document.getElementById(id);
    var display = el.style.display;
    if (display == 'none' || display == '') {
        openElement(id);
    } else {
        closeElement(id);
    }
}

function openElement(id) {
    var el = document.getElementById(id);
    el.style.display = 'inline-block';
}

function closeElement(id) {
    var el = document.getElementById(id);
    el.style.display = 'none';
}

//***********************************
//
// Helper Methods
//
//***********************************

function getMonthName(month) {
    if (month == 1) {
        return "January";
    } else if (month == 2) {
        return "February";
    } else if (month == 3) {
        return "March";
    } else if (month == 4) {
        return "April";
    } else if (month == 5) {
        return "May";
    } else if (month == 6) {
        return "June";
    } else if (month == 7) {
        return "July";
    } else if (month == 8) {
        return "August";
    } else if (month == 9) {
        return "September";
    } else if (month == 10) {
        return "October";
    } else if (month == 11) {
        return "November";
    } else if (month == 12) {
        return "December";
    }
    return '';
}

function print(string) {
    var div = document.getElementById('printDiv');
    div.innerHTML = string;
}

/**
 * This function takes a day, month, year and runs through the userData json object to find the events that occur on that day
 * When it finds an event on the param day, it executes the function. passing the function the specific event Json
 * 
 * @param {*} day 
 * @param {*} month 
 * @param {*} year 
 * @param {*} fn 
 */
function findEvents(day, month, year, fn) {
    for (var k = 0; k < userData['events'].length; k++) {
        var eventDay = parseInt(userData['events'][k]['day'], 10);
        var eventMonth = parseInt(userData['events'][k]['month'], 10);
        var eventYear = parseInt(userData['events'][k]['year'], 10);

        if (eventDay == day) {
            if (eventMonth == month) {
                if (eventYear == year) {
                    fn(userData['events'][k]);
                }
            }
        }
    }
}