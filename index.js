var _ = require('lodash');
var restify = require('restify');
var Virgilio = require('virgilio');
var virgilioHttp = require('virgilio-http');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require("fs"));

var virgilio = new Virgilio();

virgilio.loadModule$(virgilioHttp);
virgilio.http.use$(virgilio.http.queryParser());
virgilio.http.use$(virgilio.http.bodyParser({mapParams: true}));

virgilio.defineAction$(function putFile(name, data) {
	return fs.writeFileAsync(name, data);
});

virgilio.defineAction$(function getFile(name) {
	return fs.readFileAsync(name, {encoding: 'utf8'});
});

virgilio.http._server$.get(/public/, restify.serveStatic({
	directory: __dirname
}));

function edit(virgGetFile, res, name) {
	return virgGetFile.execute$(name)
		.then(function (html) {
			return virgGetFile.execute$('./views/edit.html')
				.then(function (tmpl) {
					return _.template(tmpl)({"data": html, "name": name});
				});
		})
		.then(function (html) {
			res.writeHead(200, {
				'Content-Length': Buffer.byteLength(html),
				'Content-Type': 'text/html'
			});
			res.write(html);
			res.end();
		});
}

virgilio.getFile.get('/')
	.transform(function(req, res) {
		return edit(this, res, './index.js');
	});

virgilio.getFile.get('/edit')
	.transform(function(req, res) {
		return edit(this, res, req.params.name);
	});

virgilio.getFile.get('/file/get')
	.transform(function(req, res) {
		return this.execute$(req.params.name).
			then(function (data) {
				res.send(200, {"data": data});
				res.end();
			})
	});

virgilio.putFile.post('/file/put')
	.transform(function(req, res) {
		var name = req.params.name;
		return this.execute$(name, req.params.data).
			then(function () {
				res.send(200, {"name": name});
				res.end();
			})
	});
