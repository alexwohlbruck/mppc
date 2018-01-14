let moment = require('moment');
let AWS = require('aws-sdk');

let dynamodb = new AWS.DynamoDB({region: 'us-east-1'});

module.exports = async sendResponse => {
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
};