const request = require('request-promise');
const xml2js = require('xml2js-es6-promise');
const JSSoup = require('jssoup').default;
const moment = require('moment');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({region: 'us-east-1'});

exports.handler = (event, context, callback) => {
	
	const requestBody = typeof event.body == 'string' ? JSON.parse(event.body) : event.body;
	
	const done = ({err, res}) => callback(null, {
		statusCode: err ? '400' : '200',
		body: err ? err.message : JSON.stringify(res),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	
	const sendResponse = responseToUser => {
		
		console.log(responseToUser);
		
		// TODO: Add rich text responses
		
		// if the response is a string send it as a response to the user
		if (typeof responseToUser === 'string') {
			let responseJson = {fulfillmentText: responseToUser}; // displayed response
			done({res: responseJson}); // Send response to Dialogflow
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
			done({res: responseJson});
		}
	};
	
	const getRedirectedUrl = async originalUrl => {
		const response = await request({
			followAllRedirects: true,
			resolveWithFullResponse: true,
			uri: originalUrl
		});
		return response.request.uri.href;
	};
	
	const utf6ToAscii = string => {
		console.log(string);
		return typeof string != 'string' ? null : string
			.replace('–', '-')
			.replace('–', '--')
			.replace('“', '"')
			.replace('”', '"')
			.replace(`'`, `'`)
			.replace(' ', ' ')
			.replace('&nbsp;', '') // Remove no-break spaces
			.replace(/ *\[[^\]]*]/, '') // Remove text in brackets
			.replace(/[^\x00-\x7F]/g, '');
	};
	
	const getLatestPodcastUrl = async ({rssFeed, type}) => {
		const rss = await request(rssFeed);
		const {rss: parsed} = await xml2js(rss);
		
		let podcast = parsed.channel[0].item[0];
		const latestPodcastUrl = podcast.enclosure[0].$.url;
		const redirectedUrl = await getRedirectedUrl(latestPodcastUrl);
		
		console.log(podcast);
		
		podcast = {
			title: podcast.title,
			subtitle: utf6ToAscii(podcast['itunes.subtitle']),
			description: utf6ToAscii(podcast['itunes.summary'])
		};
		
		const response =
		   `<speak>
				<audio src="${redirectedUrl}">
					Okay, here's the latest ${type} called ${podcast.title}. ${podcast.subtitle}
				</audio>
			</speak>`;
		
		return response;
	};
	
	try {
		var action = (requestBody.queryResult.action) ? requestBody.queryResult.action : 'default';
		var parameters = requestBody.queryResult.parameters || {};
		var inputContexts = requestBody.queryResult.contexts;
		var reqSource = (requestBody.originalDetectIntentreq) ? requestBody.originalDetectIntentreq.source : undefined;
		var session = (requestBody.session) ? requestBody.session : undefined;
	} catch (err) {
		console.error(`Couldn't parse request`, err);
	}
	
	const actions = {
		default: () => {
			sendResponse('Invalid action');
		},
		
		podcast: async () => {
			const response = await getLatestPodcastUrl({
				rssFeed: 'https://podcasts.subsplash.com/b77dd7e/podcast.rss',
				type: 'youth podcast'
			});
			
			sendResponse(response);
		},
		
		sermon: async() => {
			const response = await getLatestPodcastUrl({
				rssFeed: 'https://podcasts.subsplash.com/6527700/podcast.rss',
				type: 'sermon'
			});
				
			sendResponse(response);
		},
		
		devotion: async() => {
			const rss = await request('https://devotions.mppcblogs.org/feed');
			const {rss: parsed} = await xml2js(rss);
			const devotions = parsed.channel[0].item;
			
			// Also get link: link[0], title: title[0], description: description[0]
			const html = devotions[0]['content:encoded'][0];
			const soup = new JSSoup(html);
				
			// TODO: Use JSSoup to remove section titles
			
			// TODO: Remove verse numbers
			
			let response = `<speak><prosody rate="slow>${soup.text}</prosody></speak>`;
			
			// Replace UTF-8 characters with ascii - API Gateway doesn't like them
			response = utf6ToAscii(response);
			
			sendResponse(response);
		},
		
		events: async() => {
			const now = new Date();
			const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
			const dateToISO = date => date.toISOString().slice(0,10);
			const formatEventTime = fullTime => {
				const time = moment(fullTime, 'HH:mm:ss');
				return time.format('h:mma');
			};
			
			// Query DB for events
			let {Items: events} = await dynamodb.scan({
				TableName: 'myers-church-events',
				FilterExpression: "#date between :start_date and :end_date",
				ExpressionAttributeNames: {
					"#date": "event_date",
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
			events = events.sort((a, b) => {
				if (a.event_time.S < b.event_time.S)
					return -1;
				if (a.event_time.S > b.event_time.S)
					return 1;
				return 0;
			});
			
			// Create comma separated list of events by name
			let listEvents = '';
			events.forEach((event, index) => {
				if (index == eventsCount - 1) {
					listEvents += 'and ';
				}
				listEvents +=
					`
					${event.event_name.S} at
					<say-as interpret-as="time" format="hms12">${formatEventTime(event.event_time.S)}</say-as>`;
					
				listEvents += (index == eventsCount - 1 ? '.' : ', ');
			});
			
			const response = `<speak>Our ${eventsCount} event${eventsCount == 1 ? '' : 's'} for today are: ${listEvents}</speak>`;
			
			sendResponse(response);
		}
	};
	
	if (actions[action]) {
		actions[action]();
	} else {
		actions.default();
	}
};