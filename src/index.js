const parse = require('./druidsql');
const stringify = require('./druidsqltostring');

module.exports = {
  parse: parse.parse,
  stringify: stringify.toSQL
}
