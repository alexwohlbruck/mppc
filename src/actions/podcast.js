let getPodcastUrl = require('../helpers/get-podcast-url')

module.exports = async ({params}) => {
    const response = await getPodcastUrl({
    	rssFeed: 'https://podcasts.subsplash.com/b77dd7e/podcast.rss',
    	type: 'youth podcast',
    	datePeriod: params['date-period'] || undefined
    })
    
    return response
}