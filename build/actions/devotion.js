function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

let request = require('request-promise');
let xml2js = require('xml2js-es6-promise');
let JSSoup = require('jssoup').default;

let utf8ToAscii = require('../helpers/utf8-to-ascii');

module.exports = _asyncToGenerator(function* () {
    const rss = yield request('https://devotions.mppcblogs.org/feed');
    const { rss: parsed } = yield xml2js(rss);
    const devotions = parsed.channel[0].item;

    // Also get link: link[0], title: title[0], description: description[0]
    const html = devotions[0]['content:encoded'][0];
    const soup = new JSSoup(html);

    // TODO: Use JSSoup to remove section titles

    // TODO: Remove verse numbers

    let response = `<speak><prosody rate="slow>${soup.text}</prosody></speak>`;

    // Replace UTF-8 characters with ascii - API Gateway doesn't like them
    response = utf8ToAscii(response);

    return response;
});