let getLatestPodcastUrl = require('../helpers/get-latest-podcast-url');

module.exports = async sendResponse => {
    const response = await getLatestPodcastUrl({
    	rssFeed: 'https://podcasts.subsplash.com/6527700/podcast.rss',
    	type: 'sermon'
    });
    	
    sendResponse(response);
};