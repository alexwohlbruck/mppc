function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

module.exports = (() => {
    var _ref = _asyncToGenerator(function* (sendResponse) {
        sendResponse('Invalid action');
    });

    return function (_x) {
        return _ref.apply(this, arguments);
    };
})();
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let request = require('request-promise');
let xml2js = require('xml2js-es6-promise');
let JSSoup = require('jssoup').default;

let utf8ToAscii = require('../helpers/utf8-to-ascii');

module.exports = (() => {
    var _ref = _asyncToGenerator(function* (sendResponse) {
        const rss = yield request('https://devotions.mppcblogs.org/feed');
        const { rss: parsed } = yield xml2js(rss);
        const devotions = parsed.channel[0].item;

        // Also get link: link[0], title: title[0], description: description[0]
        const html = devotions[0]['content:encoded'][0];
        const soup = new JSSoup(html);

        // TODO: Use JSSoup to remove section titles

        // TODO: Remove verse numbers

        let response = `<speak><prosody rate="slow>${soup.text}</prosody></speak>`;

        // Replace UTF-8 characters with ascii - API Gateway doesn't like them
        response = utf8ToAscii(response);

        sendResponse(response);
    });

    return function (_x) {
        return _ref.apply(this, arguments);
    };
})();
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let moment = require('moment');
let AWS = require('aws-sdk');

let dynamodb = new AWS.DynamoDB({ region: 'us-east-1' });

module.exports = (() => {
    var _ref = _asyncToGenerator(function* (sendResponse) {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const dateToISO = function (date) {
            return date.toISOString().slice(0, 10);
        };
        const formatEventTime = function (fullTime) {
            const time = moment(fullTime, 'HH:mm:ss');
            return time.format('h:mma');
        };

        // Query DB for events
        let { Items: events } = yield dynamodb.scan({
            TableName: 'myers-church-events',
            FilterExpression: "#date between :start_date and :end_date",
            ExpressionAttributeNames: {
                "#date": "event_date"
            },
            ExpressionAttributeValues: {
                ":start_date": {
                    S: dateToISO(now)
                },
                ":end_date": {
                    S: dateToISO(tomorrow)
                }
            }
        }).promise();

        const eventsCount = events.length;

        // TODO: Event times might not be localized. Check with Josh

        // Sort events by time
        events = events.sort(function (a, b) {
            if (a.event_time.S < b.event_time.S) return -1;
            if (a.event_time.S > b.event_time.S) return 1;
            return 0;
        });

        // Create comma separated list of events by name
        let listEvents = '';
        events.forEach(function (event, index) {
            if (index == eventsCount - 1) {
                listEvents += 'and ';
            }
            listEvents += `
    		${event.event_name.S} at
    		<say-as interpret-as="time" format="hms12">${formatEventTime(event.event_time.S)}</say-as>`;

            listEvents += index == eventsCount - 1 ? '.' : ', ';
        });

        const response = `<speak>Our ${eventsCount} event${eventsCount == 1 ? '' : 's'} for today are: ${listEvents}</speak>`;

        sendResponse(response);
    });

    return function (_x) {
        return _ref.apply(this, arguments);
    };
})();
let defaultAction = require('./default');
let devotion = require('./devotion');
let events = require('./events');
let podcast = require('./podcast');
let sermon = require('./sermon');

module.exports = sendResponse => {
    return {
        defaultAction,
        devotion,
        events,
        podcast,
        sermon
    };
};
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let getLatestPodcastUrl = require('../helpers/get-latest-podcast-url');

module.exports = (() => {
    var _ref = _asyncToGenerator(function* (sendResponse) {
        const response = yield getLatestPodcastUrl({
            rssFeed: 'https://podcasts.subsplash.com/b77dd7e/podcast.rss',
            type: 'youth podcast'
        });

        sendResponse(response);
    });

    return function (_x) {
        return _ref.apply(this, arguments);
    };
})();
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let getLatestPodcastUrl = require('../helpers/get-latest-podcast-url');

module.exports = (() => {
    var _ref = _asyncToGenerator(function* (sendResponse) {
        const response = yield getLatestPodcastUrl({
            rssFeed: 'https://podcasts.subsplash.com/6527700/podcast.rss',
            type: 'sermon'
        });

        sendResponse(response);
    });

    return function (_x) {
        return _ref.apply(this, arguments);
    };
})();
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let request = require('request-promise');
let xml2js = require('xml2js-es6-promise');

let utf8ToAscii = require('./utf8-to-ascii');
let getRedirectedUrl = require('./get-redirected-url');

module.exports = (() => {
	var _ref = _asyncToGenerator(function* ({ rssFeed, type }) {
		const rss = yield request(rssFeed);
		const { rss: parsed } = yield xml2js(rss);

		let podcast = parsed.channel[0].item[0];
		const latestPodcastUrl = podcast.enclosure[0].$.url;
		const redirectedUrl = yield getRedirectedUrl(latestPodcastUrl);

		console.log(podcast);

		podcast = {
			title: podcast.title,
			subtitle: utf8ToAscii(podcast['itunes.subtitle']),
			description: utf8ToAscii(podcast['itunes.summary'])
		};

		const response = `<speak>
			<audio src="${redirectedUrl}">
				Okay, here's the latest ${type} called ${podcast.title}. ${podcast.subtitle}
			</audio>
		</speak>`;

		return response;
	});

	return function (_x) {
		return _ref.apply(this, arguments);
	};
})();
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let request = require('request-promise');

module.exports = (() => {
	var _ref = _asyncToGenerator(function* (originalUrl) {
		const response = yield request({
			followAllRedirects: true,
			resolveWithFullResponse: true,
			uri: originalUrl
		});
		return response.request.uri.href;
	});

	return function (_x) {
		return _ref.apply(this, arguments);
	};
})();
module.exports = string => {
	console.log(string);
	return typeof string != 'string' ? null : string.replace('–', '-').replace('–', '--').replace('“', '"').replace('”', '"').replace(`'`, `'`).replace(' ', ' ').replace('&nbsp;', '') // Remove no-break spaces
	.replace(/ *\[[^\]]*]/, '') // Remove text in brackets
	.replace(/[^\x00-\x7F]/g, '');
};
// import request from 'request-promise-native';
// import xml2js from 'xml2js-es6-promise';
// import JSSoup from 'jssoup';
// import moment from 'moment';
// import AWS from 'aws-sdk';

exports.handler = (event, context, callback) => {

	const requestBody = typeof event.body == 'string' ? JSON.parse(event.body) : event.body;

	const done = ({ err, res }) => callback(null, {
		statusCode: err ? '400' : '200',
		body: err ? err.message : JSON.stringify(res),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	const sendResponse = responseToUser => {

		console.log(responseToUser);

		// TODO: Add rich text responses

		// if the response is a string send it as a response to the user
		if (typeof responseToUser === 'string') {
			let responseJson = { fulfillmentText: responseToUser }; // displayed response
			done({ res: responseJson }); // Send response to Dialogflow
		} else {
			// If the response to the user includes rich responses or contexts send them to Dialogflow
			let responseJson = {};
			// Define the text response
			responseJson.fulfillmentText = responseToUser.fulfillmentText;
			// Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
			if (responseToUser.fulfillmentMessages) {
				responseJson.fulfillmentMessages = responseToUser.fulfillmentMessages;
			}
			// Optional: add contexts (https://dialogflow.com/docs/contexts)
			if (responseToUser.outputContexts) {
				responseJson.outputContexts = responseToUser.outputContexts;
			}
			// Send the response to Dialogflow
			done({ res: responseJson });
		}
	};

	try {
		var action = requestBody.queryResult.action ? requestBody.queryResult.action : 'default';
		var parameters = requestBody.queryResult.parameters || {};
		var inputContexts = requestBody.queryResult.contexts;
		var reqSource = requestBody.originalDetectIntentreq ? requestBody.originalDetectIntentreq.source : undefined;
		var session = requestBody.session ? requestBody.session : undefined;
	} catch (err) {
		console.error(`Couldn't parse request`, err);
	}

	const actions = require('./actions')(sendResponse);

	if (actions[action]) {
		actions[action]();
	} else {
		actions.defaultAction();
	}
};
