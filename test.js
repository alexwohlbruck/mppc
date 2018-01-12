const request = require('request-promise');
const xml2js = require('xml2js-es6-promise');
const JSSoup = require('jssoup').default;
const encoding = require('encoding');

async function run() {
	const rss = await request('https://devotions.mppcblogs.org/feed');
	const {rss: parsed} = await xml2js(rss);
	
	const devotions = parsed.channel[0].item;
	
	// Also get link: link[0], title: title[0], description: description[0]
	const html = devotions[0]['content:encoded'][0];
	const soup = new JSSoup(html);
	
	const response = `<speak><prosody rate="slow>${soup.text}</prosody></speak>`;
	
	return response;
}

run();