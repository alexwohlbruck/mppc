module.exports = string => {
	console.log(string);
	return typeof string != 'string' ? null : string.replace('–', '-').replace('–', '--').replace('“', '"').replace('”', '"').replace(`'`, `'`).replace(' ', ' ').replace('&nbsp;', '') // Remove no-break spaces
	.replace(/ *\[[^\]]*]/, '') // Remove text in brackets
	.replace(/[^\x00-\x7F]/g, '');
};