let moment = require('moment-timezone')
let AWS = require('aws-sdk')

let dynamodb = new AWS.DynamoDB({region: 'us-east-1'})

module.exports = async ({reqSource}) => {

    /*
     * Timezones in DB are EST
     * There is no conversion when querying DB
     * Response times should be localized based on reqSource.timeZone
     * reqSource is coming up empty, check Dialogflow docs
     */

    const now = new Date()
    const end = new Date()
          end.setHours(24, 0, 0, 0) // Closest midnight in future (EST - server's local time)

    const dateToISO = date => date.toISOString().slice(0,10)
    const formatEventTime = fullTime => {
    	const time = moment(fullTime, 'HH:mm:ss').tz('America/Los_Angeles'/*reqSource.timeZone*/)
    	return time.format('h:mma')
    }
    
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
    			S: dateToISO(end)
    		}
    	}
    }).promise()
    
    const eventsCount = events.length
    
    // Sort events by time
    events = events.sort((a, b) => {
    	if (a.event_time.S < b.event_time.S)
    		return -1
    	if (a.event_time.S > b.event_time.S)
    		return 1
    	return 0
    })
    
    // Create comma separated list of events by name
    let listEvents = ''
    events.forEach((event, index) => {
    	if (index == eventsCount - 1) {
    		listEvents += 'and '
    	}
    	listEvents +=
    		`
    		${event.event_name.S} at
    		<say-as interpret-as="time" format="hms12">${formatEventTime(event.event_time.S)}</say-as>`
    		
    	listEvents += (index == eventsCount - 1 ? '.' : ', ')
    })
    
    const response = `<speak>Our ${eventsCount} event${eventsCount == 1 ? '' : 's'} for today are: ${listEvents}</speak>`
    
    return response
}