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

virgilio.defineAction$(function edit(res, name) {
	return virgilio.getFile(name)
		.then(function (html) {
			return virgilio.getFile('./views/edit.html')
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
});

virgilio.http._server$.get(/public/, restify.serveStatic({
	directory: __dirname
}));

virgilio.edit.get('/')
	.transform(function(req, res) {
		return this.execute$(res, './index.js');
	});

virgilio.edit.get('/edit')
	.transform(function(req, res) {
		return this.execute$(res, req.params.name);
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
