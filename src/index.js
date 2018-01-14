// import request from 'request-promise-native';
// import xml2js from 'xml2js-es6-promise';
// import JSSoup from 'jssoup';
// import moment from 'moment';
// import AWS from 'aws-sdk';

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
	
	try {
		var action = (requestBody.queryResult.action) ? requestBody.queryResult.action : 'default';
		var parameters = requestBody.queryResult.parameters || {};
		var inputContexts = requestBody.queryResult.contexts;
		var reqSource = (requestBody.originalDetectIntentreq) ? requestBody.originalDetectIntentreq.source : undefined;
		var session = (requestBody.session) ? requestBody.session : undefined;
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