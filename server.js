'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var http = require('http');
var path = require('path');
var socketio = require('socket.io');
var express = require('express');
var app = express();
// const server = http.createServer(app)

app.use(express.bodyParser());

var request = require('request-promise');
var xml2js = require('xml2js-es6-promise');
var JSSoup = require('jssoup').default;
var moment = require('moment');
var AWS = require('aws-sdk');
var dynamodb = new AWS.DynamoDB({ region: 'us-east-1' });

// https://us-central1-mppc-9cdb7.cloudfunctions.net/dialogflowFirebaseFulfillment
app.post('/dialogflowFirebaseFulfillment', function (req, res) {
  var getLatestPodcastUrl = function () {
    var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(_ref7) {
      var rssFeed = _ref7.rssFeed,
          message = _ref7.message;

      var rss, _ref9, parsed, podcasts, latestPodcastUrl, redirectedUrl, response;

      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return request(rssFeed);

            case 2:
              rss = _context5.sent;
              _context5.next = 5;
              return xml2js(rss);

            case 5:
              _ref9 = _context5.sent;
              parsed = _ref9.rss;
              podcasts = parsed.channel[0].item;
              latestPodcastUrl = podcasts[0].enclosure[0].$.url;
              _context5.next = 11;
              return getRedirectedUrl(latestPodcastUrl);

            case 11:
              redirectedUrl = _context5.sent;
              response = '<speak>\n        <audio src="' + redirectedUrl + '">\n          ' + message + '\n        </audio>\n      </speak>';
              return _context5.abrupt('return', response);

            case 14:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    return function getLatestPodcastUrl(_x) {
      return _ref8.apply(this, arguments);
    };
  }();

  var getRedirectedUrl = function () {
    var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(originalUrl) {
      var response;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return request({
                followAllRedirects: true,
                resolveWithFullResponse: true,
                uri: originalUrl
              });

            case 2:
              response = _context6.sent;
              return _context6.abrupt('return', response.request.uri.href);

            case 4:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    return function getRedirectedUrl(_x2) {
      return _ref10.apply(this, arguments);
    };
  }();

  try {
    var action = req.body.queryResult.action ? req.body.queryResult.action : 'default';
    var parameters = req.body.queryResult.parameters || {};
    var inputContexts = req.body.queryResult.contexts;
    var reqSource = req.body.originalDetectIntentreq ? req.body.originalDetectIntentreq.source : undefined;
    var session = req.body.session ? req.body.session : undefined;
  } catch (err) {
    var action = 'podcast';
    console.error('Couldn\'t parse request', err);
  }

  var actions = {
    default: function _default() {
      sendResponse('Invalid action');
    },

    podcast: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var response;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return getLatestPodcastUrl({
                  rssFeed: 'https://podcasts.subsplash.com/b77dd7e/podcast.rss',
                  message: 'Okay, here\'s the latest youth podcast'
                });

              case 2:
                response = _context.sent;


                sendResponse(response);

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, undefined);
      }));

      function podcast() {
        return _ref.apply(this, arguments);
      }

      return podcast;
    }(),

    devotion: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var rss, _ref3, parsed, devotions, html, soup, response;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return request('https://devotions.mppcblogs.org/feed');

              case 2:
                rss = _context2.sent;
                _context2.next = 5;
                return xml2js(rss);

              case 5:
                _ref3 = _context2.sent;
                parsed = _ref3.rss;
                devotions = parsed.channel[0].item;

                // Also get link: link[0], title: title[0], description: description[0]

                html = devotions[0]['content:encoded'][0];
                soup = new JSSoup(html);
                response = '<speak><prosody rate="slow>' + soup.text + '</prosody></speak>';


                sendResponse(response);

              case 12:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, undefined);
      }));

      function devotion() {
        return _ref2.apply(this, arguments);
      }

      return devotion;
    }(),

    sermon: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
        var response;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return getLatestPodcastUrl({
                  rssFeed: 'https://podcasts.subsplash.com/6527700/podcast.rss',
                  message: 'Okay, here\'s the latest sermon'
                });

              case 2:
                response = _context3.sent;


                sendResponse(response);

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, undefined);
      }));

      function sermon() {
        return _ref4.apply(this, arguments);
      }

      return sermon;
    }(),

    events: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        var now, tomorrow, dateToISO, formatEventTime, _ref6, events, eventsCount, listEvents, response;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                now = new Date();
                tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

                dateToISO = function dateToISO(date) {
                  return date.toISOString().slice(0, 10);
                };

                formatEventTime = function formatEventTime(fullTime) {
                  var time = moment(fullTime, 'HH:mm:ss');
                  return time.format('h:mma');
                };

                // Query DB for events


                _context4.next = 6;
                return dynamodb.scan({
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

              case 6:
                _ref6 = _context4.sent;
                events = _ref6.Items;
                eventsCount = events.length;

                // Sort events by time

                events = events.sort(function (a, b) {
                  if (a.event_time.S < b.event_time.S) return -1;
                  if (a.event_time.S > b.event_time.S) return 1;
                  return 0;
                });

                // Create comma separated list of events by name
                listEvents = '';

                events.forEach(function (event, index) {
                  if (index == eventsCount - 1) {
                    listEvents += 'and ';
                  }
                  listEvents += '\n          ' + event.event_name.S + ' at\n          <say-as interpret-as="time" format="hms12">' + formatEventTime(event.event_time.S) + '</say-as>';

                  listEvents += index == eventsCount - 1 ? '.' : ', ';
                });

                response = '<speak>Our ' + eventsCount + ' event' + (eventsCount == 1 ? '' : 's') + ' for today are: ' + listEvents + '</speak>';


                sendResponse(response);

              case 14:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, undefined);
      }));

      function events() {
        return _ref5.apply(this, arguments);
      }

      return events;
    }()
  };

  if (actions[action]) {
    actions[action]();
  } else {
    actions.default();
  }

  function sendResponse(responseToUser) {
    // console.log(responseToUser)
    return res.json({
      fulfillmentText: responseToUser
    });

    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      var responseJson = { fulfillmentText: responseToUser // displayed response
      };res.json(responseJson); // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      var _responseJson = {};
      // Define the text response
      _responseJson.fulfillmentText = responseToUser.fulfillmentText;
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      if (responseToUser.fulfillmentMessages) {
        _responseJson.fulfillmentMessages = responseToUser.fulfillmentMessages;
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.outputContexts) {
        _responseJson.outputContexts = responseToUser.outputContexts;
      }
      // Send the response to Dialogflow
      console.log('Response to Dialogflow: ' + JSON.stringify(_responseJson));
      res.json(_responseJson);
    }
  }
});

module.exports = app;

/*app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  // var addr = app.address()
  console.log('Server started')
})*/
