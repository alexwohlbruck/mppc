function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let moment = require('moment-timezone');
let AWS = require('aws-sdk');

let dynamodb = new AWS.DynamoDB({ region: 'us-east-1' });

module.exports = (() => {
  var _ref = _asyncToGenerator(function* ({ reqSource }) {

    /*
     * Timezones in DB are EST
     * There is no conversion when querying DB
     * Response times should be localized based on reqSource.timeZone
     * reqSource is coming up empty, check Dialogflow docs
     */

    const now = new Date();
    const end = new Date();
    end.setHours(24, 0, 0, 0); // Closest midnight in future (EST - server's local time)

    const dateToISO = function (date) {
      return date.toISOString().slice(0, 10);
    };
    const formatEventTime = function (fullTime) {
      const time = moment(fullTime, 'HH:mm:ss').tz('America/Los_Angeles' /*reqSource.timeZone*/);
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
          S: dateToISO(end)
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

    return response;
  });

  return function (_x) {
    return _ref.apply(this, arguments);
  };
})();