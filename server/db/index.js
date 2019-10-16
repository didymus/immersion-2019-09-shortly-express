const mysql = require('promise-mysql');

const initializeSchema = require('./initializeSchema');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'shortly',
});

module.exports.db = db;
module.exports.initializeSchema = initializeSchema;
