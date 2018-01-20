let getLatestPodcastUrl = require('../helpers/get-latest-podcast-url');

module.exports = async () => {
    const response = await getLatestPodcastUrl({
    	rssFeed: 'https://podcasts.subsplash.com/b77dd7e/podcast.rss',
    	type: 'youth podcast'
    });
    
    return response;
};