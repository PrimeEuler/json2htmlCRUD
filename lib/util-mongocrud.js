/*
Create or add new entries
Read, retrieve, search, or view existing entries
Update or edit existing entries
Delete/deactivate existing entries
*/
var $ = require('jquery');
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
function MongoCrud(url) {
	var _self = this;
	_self.db = {};
	_self.queries;
	_self.lastTerm = '';
	//_self.base = {};
	_self.collections = {};
	MongoClient.connect(url, function (err, db) {
		if (err) { console.log(err); }
		else {
			_self.db = db
		}
	});

}
MongoCrud.prototype.CREATE = function (json, collection, callback) {
	_self = this;
	_self.db.collectionNames(collection, function (err, items) {
		if (items.length < 1) {
			_self.db.createCollection(collection, function (err, result) {
				console.log('created:', collection, err, result);
			});
		}
	});

	_self.db.collection(collection).find(json).toArray(function (err, results) {
		if (results.length == 0) {
			_self.db.collection(collection).insert(json, function (err, result) {
				console.log('insert', err, result);
			});
			_self.db.ensureIndex(collection, json, { unique: true, background: true, dropDups: true, w: 1 }, function (err, indexName) {
				callback('inserted new record');
			});
		}
	});


}
MongoCrud.prototype.UPDATE = function (query, collection, callback) {
	var _self = this;
	//console.log({ _id: query._id }, { $set: query.set });
	_self.db.collection(collection).update({ _id: ObjectID(query._id) }, { $set: query.set }, function (err, json) {
		if (err) { console.log(err); }
		console.log(json);
		callback(json);
	}

);
}
MongoCrud.prototype.READ = function (term, path, collection, callback) {
	var _self = this;
	var query = {};
	if (_self.lastTerm.length > term.length || term.length == 3) {
		_self.queries = undefined;
	}
	_self.lastTerm = term;
	if (!_self.queries) {
		_self.queries = _self._buildQuerys(false, term, _self.collections[collection]).queries;
	}
	if (path == "*") {
		query = { $or: _self.queries }
	}
	else {
		query[path] = term;
	}
	console.log(query);
	_self.db.collection(collection).find(query).toArray(function (err, json) {
		_self._results(path,term, json, callback);
	});


}
MongoCrud.prototype.DELETE = function (query, callback) {
}
MongoCrud.prototype._results = function (path,term, json, callback) {
	var _self = this;
	var data = [];
	var jsonData = {};
	if (json) {

		if (path == "*") {
			_self.queries = [];
			for (var i = 0; i < json.length; i++) {
				var results = _self._buildQuerys(true, term, json[i]);

				for (var j = 0; j < results.values.length; j++) {

					_self.queries.push(results.queries[j]);

					jsonData = {};
					jsonData.path = results.paths[j];
					jsonData.value = results.values[j];

					data.push(jsonData);

				}
			}
		} else {

			data = json;
		}
	}

	callback(data);
}
MongoCrud.prototype._buildQuerys = function (match, term, json, path, paths, values, query, queries, _id) {
	var _self = this;
	var type = $.type(json);
	var children = [];
	var delimiter = "";
	if (!_id) { _id = json._id.toString(); }
	if (!queries) { queries = []; }
	if (!query) { query = ''; }
	if (!paths) { paths = []; }
	if (!values) { values = []; }
	if (!path) { path = ''; }
	if (path != '') { delimiter = "."; }
	switch (type) {
		case 'array':
			for (var j = 0; j < json.length; ++j) {
				children[j] = _self._buildQuerys(match, term, json[j], path + delimiter + j, paths, values, query, queries, _id);
			}
			break;
		case 'function':
			break;
		case 'object':
			for (var prop in json) {
				if (prop != '_id' && prop != '__v') {
					children[j] = _self._buildQuerys(match, term, json[prop], path + delimiter + prop, paths, values, query + delimiter + prop, queries, _id);
				}
			}
			break;
		default:
			if (!match || json.match(new RegExp(term, 'i'))) {
				var queryObject = {};
				queryObject[query] = new RegExp(term, 'i');
				if (!match) {
					if (queries.indexOf(queryObject) == -1) {
						queries.push(queryObject);
					}
				} else {
					queryObject['_id'] = ObjectID(_id);
					queries.push(queryObject);
				}
				paths.push(path);
				values.push(json);
				children = json;
			}
			break;
	}
	return ({ 'match': match, 'term': term, 'json': children, 'path': path, 'paths': paths, 'values': values, 'query': query, 'queries': queries, '_id': _id });
}

module.exports = exports = MongoCrud;
exports.MongoCrud = MongoCrud;
exports.native = undefined;