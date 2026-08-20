var http = require('http');
var fs = require('fs');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var builtEntry = path.join(__dirname, '..', 'js', 'index.js');
if (!fs.existsSync(builtEntry)) {
	console.error('Built files are missing. From the project root run: npm run build');
	process.exit(1);
}

var pdfmake = require('../js/index');

var app = express();
var host = process.env.HOST || '0.0.0.0';
var port = Number(process.env.PORT || 1234);
var playgroundUser = process.env.PLAYGROUND_USER;
var playgroundPassword = process.env.PLAYGROUND_PASSWORD;

app.set('trust proxy', 1);
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: false }));

if (playgroundUser && playgroundPassword) {
	app.use(function (req, res, next) {
		var header = req.headers.authorization || '';
		var encoded = header.split(' ')[1] || '';
		var decoded = Buffer.from(encoded, 'base64').toString();
		var separator = decoded.indexOf(':');
		var user = decoded.slice(0, separator);
		var password = decoded.slice(separator + 1);

		if (user === playgroundUser && password === playgroundPassword) {
			return next();
		}

		res.set('WWW-Authenticate', 'Basic realm="pdfmake playground"');
		return res.status(401).send('Authentication required');
	});
}

var Roboto = require('../fonts/Roboto');
pdfmake.addFonts(Roboto);
pdfmake.setUrlAccessPolicy(function (url) {
	return typeof url === 'string' && url.indexOf('https://') === 0;
});
pdfmake.setLocalAccessPolicy(function () {
	return true;
});

function createPdfBinary(docDefinition) {
	var pdf = pdfmake.createPdf(docDefinition);
	return pdf.getBuffer();
}

app.get('/health', function (req, res) {
	res.json({ ok: true });
});

app.post('/pdf', function (req, res) {
	try {
		const dd = new Function(req.body.content + '; return dd;')();

		createPdfBinary(dd).then(function (binary) {
			res.contentType('application/pdf');
			res.send(binary);
		}, function (error) {
			res.status(400).json({ error: String(error) });
		});
	} catch (error) {
		res.status(400).json({ error: String(error) });
	}
});

var server = http.createServer(app);
server.listen(port, host, function () {
	console.log('pdfmake playground listening on http://%s:%d', host, port);
});
