const fs = require('fs');
const peg = require('pegjs');

var header = fs.readFileSync('./src/parser/druidsql.header.js', 'utf-8');
var rules = fs.readFileSync('./src/parser/druidsql.pegjs', 'utf-8');

var parser = peg.generate(header + '\n\n' + rules, {
  output: 'source',
});

const wrappedParser = `
var sql = require('../sql');
var utils = require('../utils');
var deepGet = utils.deepGet;
var SqlBase = sql.SqlBase;

var p =
${parser}

function parseSql(input) {
  return p.parse(input);
}

function parseSqlQuery(input) {
  var ast = parseSql(input);
  if (!(ast instanceof SqlBase)) return;
  return ast;
}

module.exports.parseSql = parseSql;
module.exports.parseSqlQuery = parseSqlQuery;
`;

fs.writeFileSync('./src/parser/druidsql.js', wrappedParser);
