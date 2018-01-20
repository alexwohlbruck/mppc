function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let request = require('request-promise');
let xml2js = require('xml2js-es6-promise');

let utf8ToAscii = require('./utf8-to-ascii');
let getRedirectedUrl = require('./get-redirected-url');

module.exports = (() => {
	var _ref = _asyncToGenerator(function* ({ rssFeed, type }) {
		const rss = yield request(rssFeed);
		const { rss: parsed } = yield xml2js(rss);

		let podcast = parsed.channel[0].item[0];
		const latestPodcastUrl = podcast.enclosure[0].$.url;
		const redirectedUrl = yield getRedirectedUrl(latestPodcastUrl);

		console.log(podcast);

		podcast = {
			title: podcast.title,
			subtitle: utf8ToAscii(podcast['itunes.subtitle']),
			description: utf8ToAscii(podcast['itunes.summary'])
		};

		const response = `<speak>
			<audio src="${redirectedUrl}">
				Okay, here's the latest ${type} called ${podcast.title}. ${podcast.subtitle}
			</audio>
		</speak>`;

		return response;
	});

	return function (_x) {
		return _ref.apply(this, arguments);
	};
})();