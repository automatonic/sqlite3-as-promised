/*
 * sqlite3-promises
 * https://github.com/automatonic/sqlite3-promises
 *
 * Copyright (c) 2013 Elliott B. Edwards
 * Licensed under the MIT license.
 */
var _ = require('underscore'),
    q = require('q');

function all(db,query) {
    var deferred = q.defer();
    db.all(query,
        function(errs, rows) {
            if (errs) {
                deferred.reject(new Error(errs));
            } else {
                deferred.resolve(rows);
            }
        }
    );
    return deferred.promise;
}
exports.all = all;

function allTables(db) {
    return all(db,
        "SELECT name"+
        " FROM sqlite_master" + 
        " WHERE type = 'table' AND name != 'android_metadata'"+
        " AND name != 'sqlite_sequence'"); 
}
exports.allTables = allTables;

exports.runSequentially = function(db, queries) {   
    if (!_.isArray(queries)) {
        queries = [queries];
    }
    
    function buildQueryExecute(query) {
        return function(db) { 
            var deferred = q.defer();
            db.run(query, function (error) {
                if (error) {
                    deferred.reject(new Error(error));
                } else {
                    deferred.resolve(db);
                }
            });
            return deferred.promise;
        };
    }    
    
    var promise = "test";
    
    //run the statements in serial
    db.serialize(function() {
        promise = _.chain(queries)
            .map(buildQueryExecute)
            .reduce(function (soFar, f) {
                return soFar.then(f);
            }, q.resolve(db)).value();
    });    
    
    return promise;
};