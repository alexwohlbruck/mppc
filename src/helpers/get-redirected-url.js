let request = require('request-promise');

module.exports = async originalUrl => {
	const response = await request({
		followAllRedirects: true,
		resolveWithFullResponse: true,
		uri: originalUrl
	});
	return response.request.uri.href;
};