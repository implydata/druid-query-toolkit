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

function sqlParserFactory() {
var p =
${parser}

return function(druidSqlString) {
  return p.parse(druidSqlString);
}
};

module.exports.sqlParserFactory = sqlParserFactory;
`;

fs.writeFileSync('./src/parser/druidsql.js', wrappedParser);
