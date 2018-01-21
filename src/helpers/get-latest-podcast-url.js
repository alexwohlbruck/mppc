let request = require('request-promise')
let xml2js = require('xml2js-es6-promise')

let utf8ToAscii = require('./utf8-to-ascii')
let getRedirectedUrl = require('./get-redirected-url')

module.exports = async ({rssFeed, type}) => {
	const rss = await request(rssFeed)
	const {rss: parsed} = await xml2js(rss)
	
	let podcast = parsed.channel[0].item[0]
	const latestPodcastUrl = podcast.enclosure[0].$.url
	const redirectedUrl = await getRedirectedUrl(latestPodcastUrl)
	
	console.log(podcast)
	
	podcast = {
		title: podcast.title,
		subtitle: utf8ToAscii(podcast['itunes.subtitle']),
		description: utf8ToAscii(podcast['itunes.summary'])
	}
	
	const response =
	   `<speak>
			<audio src="${redirectedUrl}">
				Okay, here's the latest ${type} called ${podcast.title}. ${podcast.subtitle}
			</audio>
		</speak>`
	
	return response
}