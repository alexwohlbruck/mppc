let request = require('request-promise')
let xml2js = require('xml2js-es6-promise')

let utf8ToAscii = require('./utf8-to-ascii')
let getRedirectedUrl = require('./get-redirected-url')

module.exports = async ({rssFeed, type, datePeriod}) => {
	const rss = await request(rssFeed)
	const {rss: parsed} = await xml2js(rss)

	let podcast, podcasts = parsed.channel[0].item

	if (datePeriod) {
		const rangeStart = new Date(datePeriod.startDate)
			  rangeStart.setHours(0, 0, 0, 0)
		const rangeEnd = new Date(datePeriod.endDate)
			  rangeEnd.setHours(0, 0, 0, 0)

		podcast = podcasts.find(podcast => {
			const podcastDate = new Date(podcast.pubDate)
			return rangeStart < podcastDate && podcastDate <= rangeEnd
		})

		if (!podcast) {
			return `Sorry, I couldn't find that ${type}.`
		}
	} else {
		podcast = podcasts[0]
	}
	
	const podcastUrl = podcast.enclosure[0].$.url
	const redirectedUrl = await getRedirectedUrl(podcastUrl)
	
	podcast = {
		title: utf8ToAscii(podcast.title),
		subtitle: utf8ToAscii(podcast['itunes.subtitle']),
		description: utf8ToAscii(podcast['itunes.summary']),
		url: redirectedUrl
	}
	
	const response =
	   `<speak>
			Okay, here's the ${datePeriod ? '' : 'latest '}${type} called "${podcast.title}".
			<audio src="${podcast.url}"></audio>
		</speak>`
	
	return response
}