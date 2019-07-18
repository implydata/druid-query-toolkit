const fs = require('fs');
const peg = require('pegjs');

var parser = peg.generate(fs.readFileSync('./src/parser/druidsql.pegjs', 'utf-8'), {
  output: 'source',
});

const wrappedParser = `
var ast = require('../ast');
var SqlQuery = ast.SqlQuery;

function sqlParserFactory(functions) {
var p =
${parser}

return function(druidSqlString) {
  return p.parse(druidSqlString);
}
};

module.exports.sqlParserFactory = sqlParserFactory;
`;

fs.writeFileSync('./src/parser/druidsql.js', wrappedParser);
