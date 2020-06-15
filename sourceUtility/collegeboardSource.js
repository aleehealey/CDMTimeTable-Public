var request = require('request');
var responseHandler = require('../serverUtility/responseHandler');

var j = request.jar();

exports.getAssignments = function (username, password, callback) {
    request.get({
        uri: "https://account.collegeboard.org/login",
        jar: j
    }, function (err, res, body) {
        request.post({
            uri: "https://account.collegeboard.org/login/authenticateUser",
            jar: j,
            form: {
                DURL: "https://apstudents.collegeboard.org/",
                appId: 282,
                username: username,
                password: password,
                rememberMe: false
            }
        }, function (err, res, body) {
            // console.log(res.headers["set-cookie"]);
            for(var i = 0; i < res.headers["set-cookie"].length; i++){
                // console.log(res.headers["set-cookie"][i]);
                var str = res.headers["set-cookie"][i];
                if((res.headers["set-cookie"][i].indexOf('cb_login=') != -1) && !(res.headers["set-cookie"][i].indexOf('"') != -1)){
                    var token = str.substring((str.indexOf('cb_login=') + ('cb_login=').length), str.indexOf(";"));
                }
            }
            var url = res.headers.location;
            request.get({
                uri: url,
                jar: j,
            }, function (err, res, body) {
                console.log(token);
                request.post({
                    uri: 'https://dgtkl2ep7natjmkbefhxflglie.appsync-api.us-east-1.amazonaws.com/graphql',
                    jar: j,
                    authority: 'dgtkl2ep7natjmkbefhxflglie.appsync-api.us-east-1.amazonaws.com',
                    body: '{"operationName":"getStudentEnrollments","variables":{"code":21},"query":"query getStudentEnrollments($code: Int!) {\n  getStudentEnrollments(educationPeriod: $code) {\n    ...enrollmentFragment\n    __typename\n  }\n}\n\nfragment enrollmentFragment on enrollment {\n  orgName\n  orgId\n  courseName\n  testCd\n  sectionName\n  sectionType\n  teachers\n  testDate\n  examIntent\n  testDayType\n  enrollmentId\n  joinCode\n  transferCode\n  studentOrTeacherCanChangeExamIntent\n  registrationDeadline\n  isPreAP\n  isDigitalPortfolio\n  isCapstone\n  isStudioArt\n  address {\n    city\n    state\n    country\n    __typename\n  }\n  ...classroomFragment\n  __typename\n}\n\nfragment classroomFragment on enrollment {\n  numResults\n  numToComplete\n  numToScore\n  assignmentsLink\n  resultsLink\n  assignments {\n    title\n    startDate\n    dueDate\n    link\n    __typename\n  }\n  __typename\n}\n"}',
                    headers: {
                        'authorization': 'AWS4-HMAC-SHA256 Credential=ASIAYEB3RCQDLQ5KH4T5/20200111/us-east-1/appsync/aws4_request, SignedHeaders=accept;content-type;host;x-amz-date;x-amz-security-token, Signature=e2316d130993ee96f457930742459aa1f876a975302121b441b437e9445fa1db',
                        'content-length': '903',
                        'content-type': 'application/json',
                        'origin': 'https://apstudents.collegeboard.org',
                        'referer': 'https://apstudents.collegeboard.org/?TST=f289f698t5d55ts972t95sft1b5ff2ae287e&userName=AUSTINLEEHEALEY',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-site': 'cross-site',
                        'user-agent': 'Mozilla/5.0',
                        'x-amz-date': '20200111T192417Z',
                        'x-amz-security-token': 'FwoGZXIvYXdzEKX//////////wEaDIzpVwreqnrKnIBiBSKDA0Ie8sgbPsvg//bftY5Sa7ii+26BnTvp9ZaBtq/b+CO+I/YIX8mLEVoTttA/4NwRi0kGinAZffQ8XSl7LT7bGPaK0n2o2BiVa5+M4eR2KZsILiKwISC88SkfloNI90QFUXrfKIFh7KqHRedY3uJ+4EAYlOfwKzQDkDSlHlft97QQDZ5lM4hl3W6HnhUtE0zUPDcB4c5fi+vgE2mbsoOVKe8Si78FusPHHJ7AiPBIwzMtsDvATT0cgScYWsT685xLZAKXBJmaOpBpV5/tb8D44YSyPbdfoRQCoKPP+m0zHUeCRKZ3w0EEa6OahCk9oZQ7SIh0jwjuGH99lIapfzj847Mfvcx3Jnm4TixZG0TOLjaJqTa7fFzETVCp9hL6Vdh5hygzauaktit9HC46EK6IrTxr4E8FNmphUlhaPeD9shWEtcfsCINvyi1Kz96uacC5AUBDRoTli66ZG8/8dr792/JI3+wCTT/FLsoU5jtJVWQxh7IxxsnXcsQxYQqLvbyiL1PZOCjgwejwBTKTAf7tNnJrM5YJNezAZ0caUE3vlN4Y6b5Q/AIZzQiFElpua8C68yuHHBF95m9lejHt3foFoLKUpjeXvN0PPSAVwLaE5FZ/ChQfk75HHnnySc3FqPxt1sNXdt+VA9lB1+aRDjO89E4gsL+HrJhBVEFZ4ag9sGFkEFtJZj2kRML5zdPBQg2uEazZzAHt0g3XKebEoA1r0g==',
                        'x-amz-user-agent': 'aws-amplify/2.0.0',
                        'x-cb-catapult-authentication-token': token,
                        'x-cb-catapult-authorization-token': 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1Nzg3NzE1NTYsImNiIjp7ImVudiI6InBpbmUiLCJ1biI6IkFVU1RJTkxFRUhFQUxFWSIsIm5zIjoic3QiLCJsdHQiOiJDQkxvZ2luIiwiZW0iOiJhdXN0aW5sZWVoZWFsZXlAZ21haWwuY29tIiwicGlkIjoiODM1MTA0NzciLCJhaWQiOiI1ODIxODY3OSIsImRwIjp7ImZpcnN0TmFtZSI6IkF1c3RpbiIsIm1pZGRsZUluaXRpYWwiOiJFIiwiZ3JhZHVhdGlvbkRhdGUiOjE1OTA5ODQwMDAwMDAsImdlbmRlciI6Ik1BTEUiLCJhZGRyZXNzIjp7InN0cmVldDEiOiIyMSBXaGl0ZXNhbmRzIERyIiwic3RyZWV0MiI6bnVsbCwic3RyZWV0MyI6bnVsbCwiY2l0eSI6Ik5ld3BvcnQgQ29hc3QiLCJzdGF0ZUNvZGUiOiJDQSIsInppcDQiOiIxMDU4IiwiemlwNSI6IjkyNjU3IiwicmVnaW9uQ29kZSI6bnVsbCwicHJvdmluY2UiOm51bGwsImNvdW50cnlDb2RlIjoiVVMiLCJpbnRlcm5hdGlvbmFsUG9zdGFsQ29kZSI6bnVsbCwiYWRkcmVzc1R5cGUiOiJET01FU1RJQyJ9LCJzdHVkZW50U2VhcmNoU2VydmljZU9wdEluIjoiTiIsInN0dWRlbnRTZWFyY2hTZXJ2aWNlT3B0RGF0ZSI6MTU1MjIzNjMyNzAwMH0sInNpbG9JbmZvIjp7InNpbG9BcHBJZCI6MzY2LCJzaWxvSWRzIjpbeyJzaWxvSWQiOiI5OVhYMFZaMiIsInNpbG9JZFN0YXR1cyI6IlkifV19fSwiaWF0IjoxNTc4NzcwNjU2LCJpc3MiOiJjYXRhcHVsdC5jb2xsZWdlYm9hcmQub3JnIiwic3ViIjoidXMtZWFzdC0xOjRkYTEzZTcyLTRmODItNDA4Ny1iNzNlLTVmY2I0ODkyMWEwMSJ9.ha2kGYPa2hU0Ge-wNftM1Z9-AI34m32ZsqDyTXS6OyVTkUclk1d7fK9AAeuz-U-XufQLZKUX8p77YJFRYXWjPkJ9cZ0grmh83JaluTZqxrUei7Hz7GtrrF9TOTCaiiy8hZquc6H0ANHDeqpk8Qa62NRwd7o05lBAvANoSQdTvzjXrBXUqLInfrMsWJJlqRnLyY__NSQAm9KHN2XD6VauFPGp7w5gyXiP2sZRQCTizeMRgTZmj5WJapSYI3b5obW-k-9LoDvM2GZB5tSwflNKkGQfE9uLu7lcnTxI0kfkCnsIPeyltsX-ali35gEqT5WzVdefUk7mz_48sVpyjygc-g',
                    }
                }, function (err, res, body) {
                    console.log(body);
                    callback(body);
                });
            });
        });
    });
}