Start = Sql

// Rest of the work...

Sql = SqlQuery / Expression

// ------------------------------

SqlQuery =
  preQuery:_?
  explainKeyword:(ExplainToken _)?
  withClause:(WithClause _)?
  select:SelectClause
  from:(_ FromClause)?
  join:(_ JoinClause)?
  where:(_ WhereClause)?
  groupBy:(_ GroupByClause)?
  having:(_ HavingClause)?
  orderBy:(_ OrderByClause)?
  limit:(_ LimitClause)?
  union:(_ UnionClause)?
  postQueryAnnotation:Annotation*
  postQuery:EndOfQuery?
{
  var value = {};
  var innerSpacing = value.innerSpacing = {};

  innerSpacing.preQuery = preQuery || '';

  if (explainKeyword) {
    value.explainKeyword = explainKeyword[0];
    innerSpacing.postExplain = explainKeyword[1];
  }

  if (withClause) {
    value.withKeyword = withClause[0].withKeyword;
    innerSpacing.postWith = withClause[0].postWith;
    value.withUnits = withClause[0].withUnits;
    value.withSeparators = withClause[0].withSeparators;
    innerSpacing.postWithQuery = withClause[1];
  }

  value.selectKeyword = select.selectKeyword;
  innerSpacing.postSelect = select.postSelect;
  value.selectDecorator = select.selectDecorator;
  value.selectSeparators = select.selectSeparators;
  value.selectValues = select.selectValues;
  value.selectAnnotations = select.selectAnnotations;
  innerSpacing.postSelectDecorator = select.postSelectDecorator;

  if (from) {
    innerSpacing.preFrom = from[0];
    value.fromKeyword = from[1].fromKeyword;
    innerSpacing.postFrom = from[1].postFrom;
    value.tables = from[1].tables;
    value.tableSeparators = from[1].tableSeparators;
  }

  if (join) {
    innerSpacing.preJoin = join[0];
    value.joinType = join[1].joinType;
    innerSpacing.postJoinType = join[1].postJoinTypeSpacing;
    value.joinKeyword = join[1].joinKeyword;
    innerSpacing.postJoinKeyword = join[1].postJoinKeywordSpacing;
    value.joinTable = join[1].table;
    innerSpacing.postJoinTable = join[1].postJoinTableSpacing;
    value.onKeyword = join[1].onKeyword;
    value.onExpression = join[1].onExpression;
    innerSpacing.postOn = join[1].postOnSpacing;
  }

  if (where) {
    innerSpacing.preWhereKeyword = where[0];
    value.whereKeyword = where[1].whereKeyword;
    innerSpacing.postWhereKeyword = where[1].postWhereKeyword;
    value.whereExpression = where[1].whereExpression;
  }

  if (groupBy) {
    innerSpacing.preGroupByKeyword = groupBy[0];
    value.groupByKeyword = groupBy[1].groupByKeyword;
    innerSpacing.postGroupByKeyword = groupBy[1].postGroupByKeyword;
    value.groupByExpression = groupBy[1].groupByExpression;
    value.groupByExpressionSeparators = groupBy[1].groupByExpressionSeparators;
  }

  if (having) {
    innerSpacing.preHavingKeyword = having[0];
    value.havingKeyword = having[1].havingKeyword;
    innerSpacing.postHavingKeyword = having[1].postHavingKeyword;
    value.havingExpression = having[1].havingExpression;
  }

  if (orderBy) {
    innerSpacing.preOrderByKeyword = orderBy[0];
    value.orderByKeyword = orderBy[1].orderByKeyword;
    innerSpacing.postOrderByKeyword = orderBy[1].postOrderByKeyword;
    value.orderByUnits = orderBy[1].orderByUnits;
    value.orderBySeparators = orderBy[1].orderBySeparators;
  }

  if (limit) {
    innerSpacing.preLimitKeyword = limit[0];
    value.limitKeyword = limit[1].limitKeyword;
    innerSpacing.postLimitKeyword = limit[1].postLimitKeyword;
    value.limitValue = limit[1].limitValue;
  }

  if (union) {
    innerSpacing.preUnionKeyword = union[0];
    value.unionKeyword = union[1].unionKeyword;
    innerSpacing.postUnionKeyword = union[1].postUnionKeyword;
    value.unionQuery = union[1].unionQuery;
  }

  value.postQueryAnnotation = postQueryAnnotation;

  innerSpacing.postQuery = postQuery || '';

  return new sql.SqlQuery(value);
}

WithClause =
  withKeyword:WithToken
  postWith:_
  withUnitsHead:WithUnit
  withUnitsTail: (Comma WithUnit)*
{
  return {
    withKeyword: withKeyword,
    postWith: postWith,
    withUnits: withUnitsTail ? makeListMap(withUnitsTail, 1, withUnitsHead) : [withUnitsHead],
    withSeparators: withUnitsTail ? makeListMap(withUnitsTail, 0): undefined,
  };
}


WithUnit =
  withTableName:Expression
  postWithTable:_?
  columns:(WithColumns _)?
  AsKeyword:AsToken
  postAs:_
  withQuery:SqlInParens
{
  return {
    withTableName: withTableName,
    postWithTable: postWithTable || '',
    postLeftParen: columns ? columns[0].postLeftParen : '',
    withColumns: columns ? columns[0].withColumns : undefined,
    withSeparators: columns ? columns[0].withSeparators : undefined,
    preRightParen: columns ? columns[0].preRightParen : '',
    postWithColumns: columns ? columns[1] : '',
    AsKeyword: AsKeyword,
    postAs: postAs,
    withQuery: withQuery
  };
}

WithColumns = OpenParen postLeftParen:_? withColumnsHead:BaseType withColumnsTail:(Comma BaseType)* preRightParen:_? CloseParen
{
  return {
    postLeftParen: postLeftParen || '',
    withColumns: withColumnsHead ? makeListMap(withColumnsTail, 1, withColumnsHead) : withColumnsHead,
    withSeparators: makeListMap(withColumnsTail, 1),
    preRightParen: preRightParen || ''
  };
}

SelectClause =
  selectKeyword:SelectToken
  postSelect:_
  selectDecorator:((AllToken / DistinctToken) _)?
  selectValuesHead:(Alias / Expression)
  annotationsHead:Annotation?
  selectValuesTail:(Comma (Alias / Expression) Annotation?)*
{
  return {
    selectKeyword: selectKeyword,
    postSelect: postSelect,
    selectDecorator: selectDecorator ? selectDecorator[0] : '',
    postSelectDecorator: selectDecorator ? selectDecorator[1] : '',
    selectValues: selectValuesTail ? makeListMap(selectValuesTail, 1, selectValuesHead) : [selectValuesHead],
    selectSeparators: makeListMap(selectValuesTail,0),
    selectAnnotations: selectValuesTail ? makeListMap(selectValuesTail, 2, annotationsHead) : [annotationsHead],
  };
}

FromClause = fromKeyword:FromToken postFrom:_ tableHead:(Alias / SqlRef) tableTail:(Comma (Alias / SqlRef))*
{
  return {
    fromKeyword: fromKeyword,
    postFrom: postFrom,
    tables: tableTail ? makeListMap(tableTail, 1, tableHead).map(table => table.upgrade()): [tableHead.upgrade()],
    tableSeparators: tableTail ? makeListMap(tableTail, 0) : undefined
  };
}

JoinClause =
  joinType:JoinType
  postJoinTypeSpacing:_
  joinKeyword:JoinToken
  postJoinKeywordSpacing:_?
  table:(Alias / SqlRef)
  postJoinTableSpacing:_
  onKeyword:OnToken
  postOnSpacing:_?
  onExpression:Expression
{
  return {
    joinType: joinType,
    postJoinTypeSpacing: postJoinTypeSpacing,
    joinKeyword: joinKeyword,
    postJoinKeywordSpacing: postJoinKeywordSpacing,
    table: table.upgrade(),
    postJoinTableSpacing: postJoinTableSpacing,
    onKeyword: onKeyword,
    postOnSpacing: postOnSpacing,
    onExpression: onExpression
  };
}

WhereClause = whereKeyword:WhereToken postWhereKeyword:_ whereExpression:Expression
{
  return {
    whereKeyword: whereKeyword,
    postWhereKeyword: postWhereKeyword,
    whereExpression: whereExpression
  };
}

GroupByClause = groupByKeyword:GroupByToken postGroupByKeyword:_ groupByExpressionHead:Expression groupByExpressionTail:(Comma Expression)*
{
  return {
    groupByKeyword: groupByKeyword,
    postGroupByKeyword: postGroupByKeyword,
    groupByExpression: groupByExpressionTail ? makeListMap(groupByExpressionTail, 1, groupByExpressionHead) : [groupByExpressionHead],
    groupByExpressionSeparators: groupByExpressionTail ? makeListMap(groupByExpressionTail, 0) : undefined,
  };
}

HavingClause = havingKeyword:HavingToken postHavingKeyword:_ havingExpression:Expression
{
  return {
    havingKeyword: havingKeyword,
    postHavingKeyword: postHavingKeyword,
    havingExpression: havingExpression
  };
}

OrderByClause = orderByKeyword:OrderToken postOrderByKeyword:_ orderByUnitsHead:OrderByPart orderByUnitsTail:(Comma OrderByPart)*
{
  return {
    orderByKeyword: orderByKeyword,
    postOrderByKeyword: postOrderByKeyword,
    orderByUnits: orderByUnitsHead ? makeListMap(orderByUnitsTail, 1, orderByUnitsHead) : [orderByUnitsHead],
    orderBySeparators: makeListMap(orderByUnitsTail, 0),
  };
}

OrderByPart = expression:Expression direction:(_ (AscToken / DescToken))?
{
  return {
    expression: expression,
    postExpression: direction ? direction[0] : '',
    direction: direction ? direction[1] : '',
  };
}

LimitClause = limitKeyword:LimitToken postLimitKeyword:_ limitValue:SqlLiteral
{
  return {
    limitKeyword: limitKeyword,
    postLimitKeyword: postLimitKeyword,
    limitValue: limitValue
  };
}

UnionClause = unionKeyword:UnionToken postUnionKeyword:_ unionQuery:SqlQuery
{
  return {
    unionKeyword: unionKeyword,
    postUnionKeyword: postUnionKeyword,
    unionQuery: unionQuery
  };
}

// ------------------------------

Alias = column:Expression postColumn:_ asKeyword:AsToken postAs:_ alias:SqlRef
{
  return new sql.SqlAliasRef({
    column: column,
    postColumn: postColumn || '',
    asKeyword: asKeyword,
    alias: alias,
    innerSpacing: {
      postAs: postAs,
    }
  });
}

/*
Expressions are defined below in acceding priority order

  Or (OR)
  And (AND)
  Not (NOT)
  Comparison (=, <=>, <, >, <=, >=, <>, !=, IS, LIKE, BETWEEN, IN, CONTAINS, REGEXP)
  Additive (+, -)
  Multiplicative (*), Division (/)
  Unary identity (+), negation (-)
*/

Expression = CaseExpression / OrExpression

OrExpression = head:AndExpression tail:(_ OrToken _ AndExpression)*
{
  return maybeMakeMulti('OR', head, tail);
}

AndExpression = head:NotExpression tail:(_ AndToken _ NotExpression)*
{
  return maybeMakeMulti('AND', head, tail);
}

NotExpression = keyword:NotToken postKeyword:_ argument:NotExpression
{
  return new sql.SqlUnary({
    expressionType: 'NOT',
    keyword: keyword,
    innerSpacing: {
      postKeyword: postKeyword
    },
    argument: argument
  });
}
  / ComparisonExpression

ComparisonExpression =
  head:AdditionExpression
  tail:((_ ComparisonOperator _ (ComparisonExpression / AdditionExpression)) / (_ BetweenToken _ (AndExpression / ComparisonExpression)) / (_ (IsNotToken / IsToken) __ (NullLiteral / BooleanLiteral)))*
{
  return maybeMakeMulti('Comparison', head, tail);
}

AdditionExpression = head:SubtractionExpression tail:(_ '+' _ SubtractionExpression)*
{
  return maybeMakeMulti('Additive', head, tail);
}

SubtractionExpression = head:MultiplicationExpression tail:(_ $('-' !'-') _ MultiplicationExpression)*
{
  return maybeMakeMulti('Additive', head, tail);
}

MultiplicationExpression = head:DivisionExpression tail:(_ '*' _ DivisionExpression)*
{
  return maybeMakeMulti('Multiplicative', head, tail);
}

DivisionExpression = head:UnaryExpression tail:(_ '/' _ UnaryExpression)*
{
  return maybeMakeMulti('Multiplicative', head, tail);
}

// !Number is to make sure that -3 parses as a number and not as -(3)
UnaryExpression = keyword:[+-] postKeyword:_ !Number argument:ConcatExpression
{
  return new sql.SqlUnary({
    expressionType: keyword,
    keyword: keyword,
    innerSpacing: {
      postKeyword: postKeyword
    },
    argument: argument
  });
}
  / ConcatExpression

ConcatExpression = head:BaseType tail:(_ '||' _ BaseType)*
{
  return maybeMakeMulti('Concat', head, tail);
}

BaseType
  = Function
  / Interval
  / SqlLiteral
  / SqlRef
  / SqlInParens

//--------------------------------------------------------------------------------------------------------------------------------------------------------

CaseExpression = SearchedCaseExpression / SimpleCaseExpression

SearchedCaseExpression =
  caseKeyword:CaseToken
  postCase:_
  whenThenUnitsHead:WhenThenPair
  whenThenUnitsTail:(_ WhenThenPair)*
  elseValue:(_ ElseToken _ Expression)?
  preEnd:_
  endKeyword:EndToken
{
  return new sql.SqlCaseSearched({
    caseKeyword: caseKeyword,
    whenThenUnits: whenThenUnitsTail ? makeListMap(whenThenUnitsTail, 1, whenThenUnitsHead) : [whenThenUnitsHead],
    postWhenThenUnitSpaces: whenThenUnitsTail ? makeListMap(whenThenUnitsTail, 0) : [],
    elseKeyword: elseValue ? elseValue[1] : undefined,
    elseExpression: elseValue ? elseValue[3] : undefined,
    endKeyword: endKeyword,
    innerSpacing: {
      postCase: postCase,
      postWhenThen: elseValue ? elseValue[0] : '',
      postElse: elseValue ? elseValue[2] : '',
      preEnd: preEnd,
    }
  });
}

SimpleCaseExpression =
  caseKeyword:CaseToken
  postCase:_
  caseExpression:Expression
  postCaseExpression:_
  whenThenUnitsHead:WhenThenPair
  whenThenUnitsTail:(_ WhenThenPair)*
  elseValue:(_ ElseToken _ Expression)?
  preEnd:_
  endKeyword:EndToken
{
  return new sql.SqlCaseSimple({
    caseKeyword: caseKeyword,
    caseExpression: caseExpression,
    whenThenUnits: whenThenUnitsTail ? makeListMap(whenThenUnitsTail, 1, whenThenUnitsHead) : [whenThenUnitsHead],
    elseKeyword: elseValue ? elseValue[1] : undefined,
    elseExpression: elseValue ? elseValue[3] : undefined,
    endKeyword: endKeyword,
    postWhenThenUnits: whenThenUnitsTail ? makeListMap(whenThenUnitsTail, 0) : [],
    innerSpacing: {
      postCase: postCase,
      postCaseExpression: postCaseExpression,
      postWhenThen: elseValue ? elseValue[0] : '',
      postElse: elseValue ? elseValue[2] : '',
      preEnd: preEnd,
    }
  });
}

WhenThenPair = whenKeyword:WhenToken postWhen:_ whenExpression:Expression postWhenExpression:_ thenKeyword:ThenToken postThen:_ thenExpression:OrExpression
{
  return {
    whenKeyword: whenKeyword,
    postWhenSpace: postWhen,
    whenExpression: whenExpression,
    postWhenExpressionSpace: postWhenExpression,
    thenKeyword: thenKeyword,
    postThenSpace: postThen,
    thenExpression: thenExpression,
  };
}



// ------------------------------

Interval =
  intervalKeyword:IntervalToken
  postIntervalKeyword:_
  intervalValue:BaseType
  postIntervalValue:_
  unitKeyword:($(Unit _ ToToken _ Unit) / $(Unit '_' Unit) / Unit)
{
  return new sql.SqlInterval({
    intervalKeyword: intervalKeyword,
    intervalValue: intervalValue,
    unitKeyword: unitKeyword,
    innerSpacing: {
      postIntervalKeyword: postIntervalKeyword,
      postIntervalValue: postIntervalValue
    }
  });
}

Unit
  = 'DAY'i
  / 'HOUR'i
  / 'MINUTE'i
  / 'MONTH'i
  / 'QUARTER'i
  / 'WEEK'i
  / 'YEAR'i
  / 'SECOND'i

Function =
  functionName:UnquotedRefPart
  postName:_?
  OpenParen
  postLeftParen:_?
  decorator:(FunctionDecorator _)?
  argumentHead:Expression
  argumentTail:((Comma / From) Expression)*
  preRightParen:_?
  CloseParen
  filter:(_ Filter)?
{
  return new sql.SqlFunction({
    functionName: functionName.name,
    decorator: decorator ? decorator[0] : undefined,
    arguments: argumentTail ? makeListMap(argumentTail, 1, argumentHead) : [argumentHead],
    separators: makeListMap(argumentTail, 0),
    filterKeyword: filter ? filter[1].filterKeyword : undefined,
    whereKeyword: filter ? filter[1].whereKeyword : undefined,
    whereExpression: filter ? filter[1].whereExpression : undefined,
    innerSpacing: {
      postName: postName ? postName : '',
      postDecorator: decorator ? decorator[1] || '' : '',
      postLeftParen: postLeftParen ? postLeftParen : '',
      preRightParen: preRightParen ? preRightParen : '',
      preFilter: filter && filter[0] ? filter[0] : '',
      postFilterKeyword: filter ? filter[1].postFilterKeyword : '',
      postFilterLeftParen: filter ? filter[1].postFilterLeftParen : '',
      postWhereKeyword: filter ? filter[1].postWhereKeyword : '',
      preFilterRightParen: filter ? filter[1].preFilterRightParen : '',
    }
  });
}

Filter = filterKeyword:FilterToken postFilterKeyword:_? OpenParen postLeftParen:_? filterExpression:WhereClause preRightParen:_? CloseParen
{
  return {
    filterKeyword: filterKeyword,
    postFilterKeyword: postFilterKeyword || '',
    postFilterLeftParen: postLeftParen || '',
    whereKeyword: filterExpression.whereKeyword,
    postWhereKeyword: filterExpression.postWhereKeyword,
    whereExpression: filterExpression.whereExpression,
    preFilterRightParen: preRightParen || '',
  };
}

Comma = left:_? ',' right:_?
{
  return new sql.Separator({
    left: left || '',
    right: right || '',
    separator: ','
  });
}

From = left:_? from:FromToken right:_?
{
  return new sql.Separator({
    left: left || '',
    right: right || '',
    separator: from
  });
}

SqlInParens = OpenParen leftSpacing:_? ex:Sql rightSpacing:_? CloseParen
{
  return ex.addParens(leftSpacing, rightSpacing);
}

SqlLiteral = lit:(DynamicPlaceholder / NullToken / TrueToken / FalseToken / Number / SingleQuotedString / UnicodeString / Timestamp / Array)
{
  return new sql.SqlLiteral(lit);
}

DynamicPlaceholder = "?"
{
  return {
    value: "?",
    stringValue: "?"
  };
}

NullLiteral = v:NullToken
{
  return new sql.SqlLiteral(v);
}

BooleanLiteral = v:(TrueToken / FalseToken)
{
  return new sql.SqlLiteral(v);
}

/* Numbers */

Number "Number" =
  [+-]?
  ((Digits Fraction?) / Fraction)
  ('e'i [+-]? Digits)?
{
  var n = text();
  return {
    value: parseFloat(n),
    stringValue: n
  };
}

Fraction = $('.' Digits)

Digits = $ Digit+

Digit = [0-9]

/* Strings */

SingleQuotedString = "'" v:$([^']*) "'"
{
  return {
    value: v,
    stringValue: text()
  };
}

UnicodeString = "U&'"i v:$([^']*) "'"
{
  return {
    value: v.replace(/\\[0-9a-f]{4}/gi, function(s) { return String.fromCharCode(parseInt(s.substr(1), 16)); }),
    stringValue: text()
  };
}

/* Timestamp */

Timestamp = keyword:TimestampToken postKeyword:_ v:SingleQuotedString
{
  return {
    keyword: keyword,
    innerSpacing: {
      postKeyword: postKeyword
    },
    value: v.value,
    stringValue: v.stringValue
  };
}

/* Array */

Array = keyword:ArrayToken postKeyword:_ v:ArrayBody
{
 return {
   keyword: keyword,
   innerSpacing: {
     postKeyword: postKeyword
   },
   value: v.value,
   stringValue: v.stringValue
 };
}

ArrayBody = '[' vs:(ArrayEntry (Comma ArrayEntry)*)? ']'
{
  var values = (vs ? makeListMap(vs[1], 1, vs[0]) : []).map(function(d) {
    return d.value;
  });

  return {
    value: values,
    stringValue: text()
  };
}

ArrayEntry = Number / SingleQuotedString / UnicodeString

// ------------------------------

SqlRef = tableBits:(RefPart _? "." _?)? column:RefPart !"."
{
  return new sql.SqlRef({
    column: column.name,
    quotes: column.quotes,
    table: deepGet(tableBits, '0.name'),
    tableQuotes: deepGet(tableBits, '0.quotes'),
    innerSpacing: {
      preTableDot: deepGet(tableBits, '1'),
      postTableDot: deepGet(tableBits, '3'),
    }
  });
}
/ namespaceBits:(RefPart _? "." _?) tableBits:(RefPart _? "." _?) column:RefPart !"."
{
  return new sql.SqlRef({
    column: column.name,
    quotes: column.quotes,
    table: deepGet(tableBits, '0.name'),
    tableQuotes: deepGet(tableBits, '0.quotes'),
    namespace: deepGet(namespaceBits, '0.name'),
    namespaceQuotes: deepGet(namespaceBits, '0.quotes'),
    innerSpacing: {
      preTableDot: deepGet(tableBits, '1'),
      posTabletDot: deepGet(tableBits, '3'),
      preNamespaceDot: deepGet(namespaceBits, '1'),
      postNamespaceDot: deepGet(namespaceBits, '3'),
    }
  });
}

RefPart = QuotedRefPart / UnquotedRefPart / Star

QuotedRefPart = ["] name:$([^"]+) ["]
{
  return {
    name: name,
    quotes: '"'
  };
}

UnquotedRefPart = name:$([a-z_]i [a-z0-9_]i*)
{
  return {
    name: name,
    quotes: ''
  };
}

Star = '*'
{
  return {
    name: '*',
    quotes: ''
  };
}

// -----------------------------------

Annotation = preAnnotation:___ '--:' postAnnotationSignifier: ___? key:$([a-z0-9_\-:*%/]i+) postKey:___? "=" postEquals:___? value:$([a-z0-9_\-:*%/]i+)
{
  return new sql.Annotation({
    innerSpacing: {
      preAnnotation: preAnnotation,
      postAnnotationSignifier: postAnnotationSignifier,
      postKey: postKey,
      postEquals: postEquals,
      preAnnotation: preAnnotation
    },
    key: key,
    value: value
  });
}

IdentifierPart = [a-z_]i

_ "optional whitespace" = $(Space* ("--" !":" [^\n]* ([\n] Space*)?)*)

__ "mandatory whitespace" = $(Space+ ("--" !":" [^\n]* ([\n] Space*)?)*)

___ "pure whitespace" = $(Space*)

Space = [ \t\n\r]

EndOfQuery = $(_ ';'? _)

OpenParen "(" = "("

CloseParen ")" = ")"

ComparisonOperator =
  '='
/ '<>'
/ '>='
/ '<='
/ '<'
/ '>'
/ LikeToken
/ InToken
/ '!='

FunctionDecorator =
  LeadingToken
/ BothToken
/ TrailingToken
/ DistinctToken

JoinType =
  'LEFT'i
/ 'RIGHT'i
/ 'INNER'i
/ $('FULL'i _ 'OUTER'i)
/ 'FULL'i

/* Tokens */

AllToken = $('ALL'i !IdentifierPart)
AndToken = $('AND'i !IdentifierPart)
ArrayToken = $('ARRAY'i !IdentifierPart)
AsToken = $('AS'i !IdentifierPart)
AscToken = $('ASC'i !IdentifierPart)
BetweenToken = $('BETWEEN'i !IdentifierPart)
BothToken = $('Both'i !IdentifierPart)
ByToken = $('BY'i !IdentifierPart)
CaseToken = $('CASE'i !IdentifierPart)
DescToken = $('DESC'i !IdentifierPart)
DistinctToken = $('DISTINCT'i !IdentifierPart)
ElseToken = $('ELSE'i !IdentifierPart)
EndToken = $('END'i !IdentifierPart)
ExplainToken = $('EXPLAIN'i !IdentifierPart __ 'PLAN'i !IdentifierPart __ 'FOR'i !IdentifierPart)
FalseToken = s:$('FALSE'i !IdentifierPart) { return { value: false, stringValue: s }; }
FilterToken= $('FILTER'i !IdentifierPart)
FromToken = $('FROM'i !IdentifierPart)
GroupByToken = $('GROUP'i !IdentifierPart _ 'BY'i !IdentifierPart)
HavingToken = $('HAVING'i !IdentifierPart)
InToken = $('IN'i !IdentifierPart)
IntervalToken = $('INTERVAL'i !IdentifierPart)
IsNotToken = $('IS'i __ 'NOT'i !IdentifierPart)
IsToken = $('IS'i !IdentifierPart)
JoinToken = $('JOIN'i !IdentifierPart)
LeadingToken = $('LEADING'i !IdentifierPart)
LikeToken = $('LIKE'i !IdentifierPart)
LimitToken = $('LIMIT'i !IdentifierPart)
NotToken = $('NOT'i !IdentifierPart)
NullToken = s:$('NULL'i !IdentifierPart) { return { value: null, stringValue: s }; }
OnToken = $('ON'i !IdentifierPart)
OrToken = $('OR'i !IdentifierPart)
OrderToken = $('ORDER'i !IdentifierPart __ 'BY'i !IdentifierPart)
SelectToken = $('SELECT'i !IdentifierPart)
ThenToken = $('THEN'i !IdentifierPart)
TimestampToken = $('TIMESTAMP'i !IdentifierPart)
ToToken = $('TO'i !IdentifierPart)
TrailingToken = $('TRAILING'i !IdentifierPart)
TrueToken = s:$('TRUE'i !IdentifierPart) { return { value: true, stringValue: s }; }
UnionToken = $('UNION'i !IdentifierPart __ 'All'i !IdentifierPart)
WhenToken = $('WHEN'i !IdentifierPart)
WhereToken = $('WHERE'i !IdentifierPart)
WithToken = $('WITH'i !IdentifierPart)

