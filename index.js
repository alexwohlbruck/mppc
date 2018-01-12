'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const request = require('request-promise');
const xml2js = require('xml2js-es6-promise');
const JSSoup = require('jssoup').default;
const moment = require('moment');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({ region: 'us-east-1' });

exports.handler = (event, context, callback) => {

	const requestBody = typeof event.body == 'string' ? JSON.parse(event.body) : event.body;

	console.log(requestBody);

	const done = ({ err, res }) => callback(null, {
		statusCode: err ? '400' : '200',
		body: err ? err.message : JSON.stringify(res),
		headers: {
			'Content-Type': 'application/json'
		}
	});

	const sendResponse = responseToUser => {

		console.log(responseToUser);

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

	const getRedirectedUrl = (() => {
		var _ref = _asyncToGenerator(function* (originalUrl) {
			const response = yield request({
				followAllRedirects: true,
				resolveWithFullResponse: true,
				uri: originalUrl
			});
			return response.request.uri.href;
		});

		return function getRedirectedUrl(_x) {
			return _ref.apply(this, arguments);
		};
	})();

	const getLatestPodcastUrl = (() => {
		var _ref2 = _asyncToGenerator(function* ({ rssFeed, message }) {
			const rss = yield request(rssFeed);
			const { rss: parsed } = yield xml2js(rss);

			const podcasts = parsed.channel[0].item;
			const latestPodcastUrl = podcasts[0].enclosure[0].$.url;
			const redirectedUrl = yield getRedirectedUrl(latestPodcastUrl);

			const response = `<speak>
				<audio src="${redirectedUrl}">
					${message}
				</audio>
			</speak>`;

			return response;
		});

		return function getLatestPodcastUrl(_x2) {
			return _ref2.apply(this, arguments);
		};
	})();

	try {
		var action = requestBody.queryResult.action ? requestBody.queryResult.action : 'default';
		var parameters = requestBody.queryResult.parameters || {};
		var inputContexts = requestBody.queryResult.contexts;
		var reqSource = requestBody.originalDetectIntentreq ? requestBody.originalDetectIntentreq.source : undefined;
		var session = requestBody.session ? requestBody.session : undefined;
	} catch (err) {
		var action = 'podcast';
		console.error(`Couldn't parse request`, err);
	}

	console.log(action);

	const actions = {
		default: () => {
			sendResponse(`Invalid action`);
		},

		podcast: (() => {
			var _ref3 = _asyncToGenerator(function* () {
				const response = yield getLatestPodcastUrl({
					rssFeed: 'https://podcasts.subsplash.com/b77dd7e/podcast.rss',
					message: `Okay, here's the latest youth podcast`
				});

				sendResponse(response);
			});

			return function podcast() {
				return _ref3.apply(this, arguments);
			};
		})(),

		devotion: (() => {
			var _ref4 = _asyncToGenerator(function* () {
				const rss = yield request('https://devotions.mppcblogs.org/feed');
				const { rss: parsed } = yield xml2js(rss);
				const devotions = parsed.channel[0].item;

				// Also get link: link[0], title: title[0], description: description[0]
				const html = devotions[0]['content:encoded'][0];
				const soup = new JSSoup(html);

				const response = `<speak><prosody rate="slow>${soup.text}</prosody></speak>`;

				console.log(response);

				sendResponse(response);
			});

			return function devotion() {
				return _ref4.apply(this, arguments);
			};
		})(),

		sermon: (() => {
			var _ref5 = _asyncToGenerator(function* () {
				const response = yield getLatestPodcastUrl({
					rssFeed: 'https://podcasts.subsplash.com/6527700/podcast.rss',
					message: `Okay, here's the latest sermon`
				});

				sendResponse(response);
			});

			return function sermon() {
				return _ref5.apply(this, arguments);
			};
		})(),

		events: (() => {
			var _ref6 = _asyncToGenerator(function* () {
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

			return function events() {
				return _ref6.apply(this, arguments);
			};
		})()
	};

	if (actions[action]) {
		actions[action]();
	} else {
		actions.default();
	}
};