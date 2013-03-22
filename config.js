/*!
 * todo - config.js
 * Copyright(c) 2012 JQ <whenjonny@gmail.com>
 * MIT Licensed
 */

"use strict";

exports.debug = true;
exports.email = 'whenjonny@gmail.com';
exports.site_name = 'jHoldem';
exports.site_desc = 'JQ Holdem evaluation';

//exports.db = 'mongodb://127.0.0.1/holdem';

var dbUrl = 'mongodb://127.0.0.1/holdem';

var mongoskin = require('mongoskin');
var noop = function () {};
var mongodb = mongoskin.db(dbUrl);
mongodb.bind('cards');
mongodb.cards.ensureIndex({ finished: 1 }, noop);
exports.db = mongodb;