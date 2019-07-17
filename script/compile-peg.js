const fs = require('fs');
const peg = require('pegjs');

var parser = peg.generate(fs.readFileSync('./src/druidsql.pegjs', 'utf-8'), {
  output: 'source'
});

const wrappedParser = `
function sqlParserFactory(functions) {
var p =
${parser}

return function(druidSqlString) {
  return p.parse(druidSqlString);
}
};

module.exports.sqlParserFactory = sqlParserFactory;
`;


fs.writeFileSync('./lib/druidsql.js', wrappedParser);
