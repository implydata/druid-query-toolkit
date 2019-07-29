const fs = require('fs');
const peg = require('pegjs');

var parser = peg.generate(fs.readFileSync('./src/parser/druidsql.pegjs', 'utf-8'), {
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
var Integer = ast.Integer; 
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
