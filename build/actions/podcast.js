function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let getLatestPodcastUrl = require('../helpers/get-latest-podcast-url');

module.exports = _asyncToGenerator(function* () {
    const response = yield getLatestPodcastUrl({
        rssFeed: 'https://podcasts.subsplash.com/b77dd7e/podcast.rss',
        type: 'youth podcast'
    });

    return response;
});