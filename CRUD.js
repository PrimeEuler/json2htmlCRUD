
var Lexer = require('./lib/util-lexer');
var MongoCrud = require('./lib/util-mongocrud');
var ObjectID = require('mongodb').ObjectID;

var express = require('express.io');
var fs = require('fs');
var app = express();

/*
options = {
key: fs.readFileSync('./ssl/myServer.key'),
cert: fs.readFileSync('./ssl/myServer.crt'),
passphrase: 'password'
}
app = express().https(options).io()
*/
app = express().http().io();
app.use(express.cookieParser());
app.use(express.session({ secret: 'Crud-9973' }));
app.use(express.static(__dirname));
app.listen(9973);
app.get('/', function (req, res) {

	req.session.loginDate = new Date().toString();
	res.sendfile(__dirname + '/index.html');

})
app.io.route('READ', function (req) {
	var value = req.data.label;
	var path = req.data.value;
	var data = {};

	crud.READ(value, path, schemaName, function (json) {
		if (path != '*') {
			data.path = path;
			data.json = json[0];
		} else {
			data = json;
		}
		console.log(data);
		req.io.respond(data);
		data = {};
	});

})
app.io.route('UPDATE', function (req) {

	crud.UPDATE(req.data, schemaName, function (data) {
		req.io.respond(data);
	});
});


var crud = new MongoCrud('mongodb://127.0.0.1:27017/test');
var schemaName = 'ION';
var fs = require('fs')
var lex = new Lexer();
fs.readFile(schemaName + '.txt', 'utf8', function (err, data) {
	if (err) throw err;
	lex.ion2json(schemaName, data, '::', function (json) {
		crud.collections[schemaName] = {};
		crud.collections[schemaName] = json;
		crud.collections[schemaName]._id = new ObjectID();
		console.log(crud.collections[schemaName]);
		//console.log(JSON.stringify(CRUD.collections[schemaName], null, '\t'));
		/*
		CRUD.CREATE( CRUD.collections[schemaName], schemaName, function (results) {
			console.log(results);
		});
		*/
	});

});









