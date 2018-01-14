let defaultAction = require('./default');
let devotion = require('./devotion');
let events = require('./events');
let podcast = require('./podcast');
let sermon = require('./sermon');

module.exports = sendResponse => {
    return {
        defaultAction,
        devotion,
        events,
        podcast,
        sermon
    };
};