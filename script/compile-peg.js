const fs = require('fs');
const peg = require('pegjs');

var header = fs.readFileSync('./src/parser/druidsql.header.js', 'utf-8');
var rules = fs.readFileSync('./src/parser/druidsql.pegjs', 'utf-8');

var parser = peg.generate(header + '\n\n' + rules, {
  output: 'source',
});

const wrappedParser = `
var ast = require('../ast');
var SqlQuery = ast.SqlQuery;
var Column = ast.Column;
var Columns = ast.Columns;
var RefExpression = ast.RefExpression;
var FromClause = ast.FromClause;
var Alias = ast.Alias;
var OrExpression = ast.OrExpression;
var OrPart = ast.OrPart;
var AndExpression = ast.AndExpression;
var AndPart = ast.AndPart;
var NotExpression = ast.NotExpression;
var ComparisonExpression = ast.ComparisonExpression;
var ComparisonExpressionRhs = ast.ComparisonExpressionRhs;
var AdditiveExpression = ast.AdditiveExpression;
var MultiplicativeExpression = ast.MultiplicativeExpression;
var StringType = ast.StringType; 
var NumberType = ast.NumberType; 
var CaseExpression = ast.CaseExpression; 
var CasePart = ast.CasePart; 
var Function = ast.Function;
var ExpressionMaybeFiltered = ast.ExpressionMaybeFiltered;
var WhereClause = ast.WhereClause;
var GroupByClause = ast.GroupByClause;
var HavingClause = ast.HavingClause;
var OrderByClause = ast.OrderByClause;
var OrderByPart = ast.OrderByPart;
var LimitClause = ast.LimitClause;
var Sub = ast.Sub;
var FilterClause = ast.FilterClause;
var LikeExpression = ast.LikeExpression;
var InExpression = ast.InExpression;
var ContainsExpression = ast.ContainsExpression;
var BetweenExpression = ast.BetweenExpression;
var Concat = ast.Concat;
var Interval = ast.Interval;
var Timestamp = ast.Timestamp;


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
