const http = require('http')
const path = require('path')
const async = require('async')
const socketio = require('socket.io')
const express = require('express')
const app = express()
const server = http.createServer(app)
const io = socketio.listen(server)

const morgan = require('morgan')

app.use(express.bodyParser())
app.use(morgan('tiny'))

const request = require('request-promise')
const xml2js = require('xml2js-es6-promise')
const JSSoup = require('jssoup').default
const moment = require('moment')
const AWS = require('aws-sdk')
const dynamodb = new AWS.DynamoDB({region: 'us-east-1'})

app.use(express.static(path.resolve(__dirname, 'client')))

// https://us-central1-mppc-9cdb7.cloudfunctions.net/dialogflowFirebaseFulfillment
app.post('/dialogflowFirebaseFulfillment', (req, res) => {
  
  try {
    var action = (req.body.queryResult.action) ? req.body.queryResult.action : 'default'
    var parameters = req.body.queryResult.parameters || {}
    var inputContexts = req.body.queryResult.contexts
    var reqSource = (req.body.originalDetectIntentreq) ? req.body.originalDetectIntentreq.source : undefined
    var session = (req.body.session) ? req.body.session : undefined
  } catch (err) {
    var action = 'podcast'
    console.error(`Couldn't parse request`, err)
  }
  
  const actions = {
    default: () => {
      sendResponse(`Invalid action`)
    },
    
    podcast: async () => {
      const response = await getLatestPodcastUrl({
        rssFeed: 'https://podcasts.subsplash.com/b77dd7e/podcast.rss',
        message: `Okay, here's the latest youth podcast`
      })
      
      sendResponse(response)
    },
    
    devotion: async() => {
      const rss = await request('https://devotions.mppcblogs.org/feed')
      const {rss: parsed} = await xml2js(rss)
      const devotions = parsed.channel[0].item
      
      // Also get link: link[0], title: title[0], description: description[0]
      const html = devotions[0]['content:encoded'][0]
      const soup = new JSSoup(html)
      
      const response = `<speak><prosody rate="slow>${soup.text}</prosody></speak>`
      
      sendResponse(response)
    },
    
    sermon: async() => {
      const response = await getLatestPodcastUrl({
        rssFeed: 'https://podcasts.subsplash.com/6527700/podcast.rss',
        message: `Okay, here's the latest sermon`
      })
        
      sendResponse(response)
    },
    
    events: async() => {
      const now = new Date()
      const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000))
      const dateToISO = date => date.toISOString().slice(0,10)
      const formatEventTime = fullTime => {
        const time = moment(fullTime, 'HH:mm:ss')
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
            S: dateToISO(tomorrow)
          }
        }
      }).promise()
      
      const eventsCount = events.length
      
      // Sort events by time
      events = events.sort((a, b) => {
        if (a.event_time.S < b.event_time.S)
          return -1;
        if (a.event_time.S > b.event_time.S)
          return 1;
        return 0;
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
      
      sendResponse(response)
    }
  }
  
  if (actions[action]) {
    actions[action]()
  } else {
    actions.default()
  }
  
  async function getLatestPodcastUrl({rssFeed, message}) {
    const rss = await request(rssFeed)
    const {rss: parsed} = await xml2js(rss)
    
    const podcasts = parsed.channel[0].item
    const latestPodcastUrl = podcasts[0].enclosure[0].$.url
    const redirectedUrl = await getRedirectedUrl(latestPodcastUrl)
    
    const response =
     `<speak>
        <audio src="${redirectedUrl}">
          ${message}
        </audio>
      </speak>`
      
    return response
  }
  
  async function getRedirectedUrl(originalUrl) {
    const response = await request({
      followAllRedirects: true,
      resolveWithFullResponse: true,
      uri: originalUrl
    })
    return response.request.uri.href
  }
  
  function sendResponse (responseToUser) {
    // console.log(responseToUser)
    return res.json({
      fulfillmentText: responseToUser
    });
    
    // if the response is a string send it as a response to the user
    if (typeof responseToUser === 'string') {
      let responseJson = {fulfillmentText: responseToUser} // displayed response
      res.json(responseJson) // Send response to Dialogflow
    } else {
      // If the response to the user includes rich responses or contexts send them to Dialogflow
      let responseJson = {}
      // Define the text response
      responseJson.fulfillmentText = responseToUser.fulfillmentText
      // Optional: add rich messages for integrations (https://dialogflow.com/docs/rich-messages)
      if (responseToUser.fulfillmentMessages) {
        responseJson.fulfillmentMessages = responseToUser.fulfillmentMessages
      }
      // Optional: add contexts (https://dialogflow.com/docs/contexts)
      if (responseToUser.outputContexts) {
        responseJson.outputContexts = responseToUser.outputContexts
      }
      // Send the response to Dialogflow
      console.log('Response to Dialogflow: ' + JSON.stringify(responseJson))
      res.json(responseJson)
    }
  }
})

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address()
  console.log('Server started')
})