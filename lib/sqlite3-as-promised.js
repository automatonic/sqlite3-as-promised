/*
 * sqlite3-promises
 * https://github.com/automatonic/sqlite3-promises
 *
 * Copyright (c) 2013 Elliott B. Edwards
 * Licensed under the MIT license.
 */
var _ = require('underscore'),
    util = require('util'),
    q = require('q'),
    _s = require('underscore.string');

function buildGetPromise(query, gotFunc) {
    return function(db) { 
        var deferred = q.defer();
        db.get(query, function (error, row) {
            if (!error) {
                try
                {
                    gotFunc(row);
                }
                catch (gotError)
                {
                    error = gotError;
                }
            }
            
            if (error) {
                console.log("ERROR Processing: "+query); 
                deferred.reject(new Error(error));
            } else {   
                deferred.resolve(db);
            }
        });
        return deferred.promise;
    };
}

function buildAllPromise(query, gotFunc) {
    return function(db) { 
        var deferred = q.defer();
        db.all(query, function (error, rows) {
            if (!error) {
                try
                {
                    gotFunc(rows);
                }
                catch (gotError)
                {
                    error = gotError;
                }
            }
            
            if (error) {
                console.log("ERROR Processing: "+query); 
                deferred.reject(new Error(error));
            } else {   
                deferred.resolve(db);
            }
        });
        return deferred.promise;
    };
}

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

function getTableCounts(db) {
    var tableCounts = {};
    return allTables(db)
        .then(function(tableRows) {
            var tables = _.pluck(tableRows,'name');
            //console.log(tables.join(', '));
    
            function addCount(row) {
                tableCounts[row.name] = row.count;
            }
            
            function buildPromise(table) {
                return buildGetPromise("SELECT COUNT(*) as count, '"+table+"' as name FROM "+table,addCount);
            }
            var promise = _.chain(tables)
                .map(buildPromise)
                .reduce(function (soFar, f) {
                    return soFar.then(f);
                }, q.resolve(db)).value();
            return promise
                .then(function() {
                   return tableCounts; 
                });
        });
}
exports.getTableCounts = getTableCounts;

function allTables(db) {
    return all(db,
        "SELECT name"+
        " FROM sqlite_master" + 
        " WHERE type = 'table' AND name != 'android_metadata'"+
        " AND name != 'sqlite_sequence'"); 
}
exports.allTables = allTables;

function deferError(error) {
    var deferred = q.defer();
    deferred.reject(new Error(error));
    return deferred.promise;
}

exports.runSequentially = function(db, queries) {   
    if (!queries) {
        deferError("Invalid queries");
    }
    
    if (!_.isArray(queries)) {
        queries = [queries];
    }
    
    if (queries.length < 1) {
        deferError("no queries");
    }
    
    var i;
    //Just test first query
    if (_.isString(queries[0]))
    {
        for (i = 0; i < queries.length; i+=1) {
            var query = queries[i];
            queries[i] = {text: query, line:i};
        }
    }
    else {
        for (i = 0; i < queries.length; i+=1) {
            queries[i].line = i;
        }
    }
    
    function dumpTable(row) {
        console.log(util.inspect(row));
    }
    
    function buildRunPromise(query) {
        if (_s.startsWith(query.text,'SELECT')) {
            return buildAllPromise(query.text, dumpTable);
        }
        return function(db) { 
            var deferred = q.defer();
            db.run(query.text, function (error) {
                if (error) {
                    if (_.isNumber(query.line)) {
                        
                        //Dump the script
                        _.chain(queries)
                            .each(function(ql) {
                                if (ql.line <= query.line &&
                                    ql.line > query.line - 3) {
                                        console.log(""+ql.line+": "+ql.text);   
                                    }
                                
                            });
                        
                        deferred.reject(new Error("Line "+query.line+": "+error));
                    }
                    else {    
                        deferred.reject(new Error(error));
                    }
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
            .map(buildRunPromise)
            .reduce(function (soFar, f) {
                return soFar.then(f);
            }, q.resolve(db)).value();
    });    
    
    return promise;
};