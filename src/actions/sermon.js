let getPodcastUrl = require('../helpers/get-podcast-url')

module.exports = async ({params}) => {
    const response = await getPodcastUrl({
    	rssFeed: 'https://podcasts.subsplash.com/6527700/podcast.rss',
    	type: 'sermon',
    	datePeriod: params['date-period'] || undefined
    })
    	
    return response
}