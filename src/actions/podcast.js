let getLatestPodcastUrl = require('../helpers/get-latest-podcast-url');

module.exports = async sendResponse => {
    const response = await getLatestPodcastUrl({
    	rssFeed: 'https://podcasts.subsplash.com/b77dd7e/podcast.rss',
    	type: 'youth podcast'
    });
    
    sendResponse(response);
};